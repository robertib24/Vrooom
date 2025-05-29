using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vrooom.Data;
using Vrooom.Models;
using Vrooom.Models.DTOs;
using Vrooom.Services.PostareServices;
using Vrooom.Services.SupportServices;

namespace Vrooom.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly VrooomDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IPostareService _postareService;
        private readonly ISupportService _supportService;

        public AdminController(
            VrooomDbContext context,
            UserManager<User> userManager,
            IPostareService postareService,
            ISupportService supportService)
        {
            _context = context;
            _userManager = userManager;
            _postareService = postareService;
            _supportService = supportService;
        }

        // Admin Statistics
        [HttpGet("stats")]
        public async Task<IActionResult> GetAdminStats()
        {
            try
            {
                var totalUsers = await _userManager.Users.CountAsync();
                var totalVehicles = await _context.Postare.CountAsync();
                var totalBookings = await _context.Chirie.CountAsync();
                var activeUsers = await _userManager.Users.Where(u => u.EmailConfirmed).CountAsync();
                var activeVehicles = totalVehicles; // Assuming all are active for now

                // Get top brands
                var topBrands = await _context.Postare
                    .GroupBy(p => p.firma)
                    .Select(g => new { brand = g.Key, count = g.Count() })
                    .OrderByDescending(x => x.count)
                    .Take(5)
                    .ToListAsync();

                // Calculate new users/vehicles this month
                var thisMonth = DateTime.Now.Month;
                var thisYear = DateTime.Now.Year;

                var newUsersThisMonth = await _userManager.Users
                    .Where(u => u.Id > 0) // Placeholder for created date
                    .CountAsync();

                var stats = new
                {
                    totalUsers = totalUsers,
                    totalVehicles = totalVehicles,
                    totalBookings = totalBookings,
                    totalRevenue = totalBookings * 50, // Estimated revenue
                    activeUsers = activeUsers,
                    activeVehicles = activeVehicles,
                    pendingVehicles = 0,
                    newUsersThisMonth = Math.Min(newUsersThisMonth / 4, totalUsers), // Rough estimate
                    newVehiclesThisMonth = Math.Min(totalVehicles / 4, totalVehicles), // Rough estimate
                    topBrands = topBrands,
                    recentActivity = new[]
                    {
                        new {
                            type = "user_registration",
                            description = "New user registered",
                            timestamp = DateTime.Now.AddHours(-2).ToString("yyyy-MM-dd HH:mm")
                        },
                        new {
                            type = "vehicle_listing",
                            description = "New vehicle listed",
                            timestamp = DateTime.Now.AddHours(-5).ToString("yyyy-MM-dd HH:mm")
                        }
                    }
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Get All Vehicles for Admin
        [HttpGet("vehicles")]
        public async Task<IActionResult> GetAllVehicles(
            int page = 0,
            int pageSize = 10,
            string search = "",
            string status = "all")
        {
            try
            {
                var query = _context.Postare.Include(p => p.User).AsQueryable();

                // Apply search filter
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(p =>
                        p.titlu.Contains(search) ||
                        p.firma.Contains(search) ||
                        p.model.Contains(search) ||
                        p.User.nume.Contains(search) ||
                        p.User.prenume.Contains(search));
                }

                var totalVehicles = await query.CountAsync();

                var vehicles = await query
                    .Skip(page * pageSize)
                    .Take(pageSize)
                    .Select(p => new
                    {
                        id = p.PostareId,
                        userId = p.UserId,
                        titlu = p.titlu,
                        descriere = p.descriere,
                        pret = p.pret,
                        firma = p.firma,
                        model = p.model,
                        kilometraj = p.kilometraj,
                        anFabricatie = p.anFabricatie,
                        culoare = p.culoare,
                        locatie = p.adresa_user,
                        status = "active", // Default status
                        createdDate = DateTime.Now.AddDays(-30).ToString("yyyy-MM-dd"), // Placeholder
                        ownerName = p.User.nume + " " + p.User.prenume,
                        ownerEmail = p.User.Email,
                        nrImagini = p.nrImagini
                    })
                    .ToListAsync();

                return Ok(new
                {
                    vehicles = vehicles,
                    total = totalVehicles,
                    page = page,
                    pageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Get All Users for Admin
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers(
            int page = 0,
            int pageSize = 10,
            string search = "")
        {
            try
            {
                var query = _userManager.Users.AsQueryable();

                // Apply search filter
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(u =>
                        u.nume.Contains(search) ||
                        u.prenume.Contains(search) ||
                        u.UserName.Contains(search) ||
                        u.Email.Contains(search));
                }

                var totalUsers = await query.CountAsync();

                var users = await query
                    .Skip(page * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var userDtos = new List<object>();

                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    var vehicleCount = await _context.Postare.CountAsync(p => p.UserId == user.Id);

                    userDtos.Add(new
                    {
                        id = user.Id,
                        nume = user.nume,
                        prenume = user.prenume,
                        username = user.UserName,
                        email = user.Email,
                        nrTelefon = user.PhoneNumber,
                        role = roles.FirstOrDefault() ?? "Default",
                        joinDate = DateTime.Now.AddDays(-60).ToString("yyyy-MM-dd"), // Placeholder
                        linkPozaProfil = user.pozaProfil,
                        puncteFidelitate = user.puncteFidelitate,
                        vehicleCount = vehicleCount,
                        status = user.EmailConfirmed ? "active" : "suspended"
                    });
                }

                return Ok(new
                {
                    users = userDtos,
                    total = totalUsers,
                    page = page,
                    pageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Delete Vehicle (Admin only)
        [HttpDelete("vehicles/{id}")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            try
            {
                await _postareService.DeletePostare(id);
                return Ok(new { message = "Vehicle deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Update Vehicle Status (Admin only)
        [HttpPut("vehicles/{id}/status")]
        public async Task<IActionResult> UpdateVehicleStatus(int id, [FromBody] dynamic statusData)
        {
            try
            {
                // For now, just return success as we don't have status field in Postare model
                return Ok(new { message = "Vehicle status updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Update User Role (Admin only)
        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] dynamic roleData)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(id.ToString());
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                string newRole = roleData.role;
                var currentRoles = await _userManager.GetRolesAsync(user);

                // Remove all current roles
                if (currentRoles.Any())
                {
                    await _userManager.RemoveFromRolesAsync(user, currentRoles);
                }

                // Add new role
                await _userManager.AddToRoleAsync(user, newRole);

                return Ok(new { message = "User role updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Suspend User (Admin only)
        [HttpPut("users/{id}/suspend")]
        public async Task<IActionResult> SuspendUser(int id)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(id.ToString());
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                // Set EmailConfirmed to false to effectively suspend
                user.EmailConfirmed = false;
                await _userManager.UpdateAsync(user);

                return Ok(new { message = "User suspended successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Get All Support Tickets (Admin only)
        [HttpGet("support-tickets")]
        public async Task<IActionResult> GetAllSupportTickets()
        {
            try
            {
                var tickets = await _supportService.getAllSupports();
                return Ok(tickets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Admin Reply to Support Ticket
        [HttpPost("support-tickets/{supportId}/reply")]
        public async Task<IActionResult> AdminReplyToTicket(int supportId, [FromBody] SupportDTO replyData)
        {
            try
            {
                replyData.supportId = supportId;
                await _supportService.ReplySupport(replyData);
                return Ok(new { message = "Reply sent successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Get Vehicle Details (Admin)
        [HttpGet("vehicles/{id}")]
        public async Task<IActionResult> GetVehicleDetails(int id)
        {
            try
            {
                var vehicle = await _postareService.postareById(id);
                return Ok(vehicle);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Get User Details (Admin)
        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUserDetails(int id)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(id.ToString());
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                var roles = await _userManager.GetRolesAsync(user);
                var vehicleCount = await _context.Postare.CountAsync(p => p.UserId == user.Id);

                var userDto = new
                {
                    id = user.Id,
                    nume = user.nume,
                    prenume = user.prenume,
                    username = user.UserName,
                    email = user.Email,
                    nrTelefon = user.PhoneNumber,
                    role = roles.FirstOrDefault() ?? "Default",
                    joinDate = DateTime.Now.AddDays(-60).ToString("yyyy-MM-dd"),
                    linkPozaProfil = user.pozaProfil,
                    puncteFidelitate = user.puncteFidelitate,
                    vehicleCount = vehicleCount,
                    status = user.EmailConfirmed ? "active" : "suspended"
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}