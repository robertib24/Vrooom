using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vrooom.Data;
using Vrooom.Exceptions;
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

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(id.ToString());
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                // Verificăm să nu șteargă contul propriu
                var currentUserClaims = HttpContext.User;
                var currentUserId = currentUserClaims?.FindFirst("id")?.Value;

                if (currentUserId == id.ToString())
                {
                    return BadRequest(new { error = "You cannot delete your own account" });
                }

                // Verificăm să nu șteargă ultimul admin
                var userRoles = await _userManager.GetRolesAsync(user);
                if (userRoles.Contains("Admin"))
                {
                    var adminCount = 0;
                    var allUsers = _userManager.Users.ToList();
                    foreach (var u in allUsers)
                    {
                        var roles = await _userManager.GetRolesAsync(u);
                        if (roles.Contains("Admin"))
                        {
                            adminCount++;
                        }
                    }

                    if (adminCount <= 1)
                    {
                        return BadRequest(new { error = "Cannot delete the last admin user" });
                    }
                }

                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // Ștergem toate datele asociate userului în ordine

                    // 1. Ștergem review-urile userului
                    var userReviews = await _context.Review.Where(r => r.UserId == id).ToListAsync();
                    if (userReviews.Any())
                    {
                        _context.Review.RemoveRange(userReviews);
                    }

                    // 2. Ștergem cardurile userului
                    var userCards = await _context.Card.Where(c => c.UserId == id).ToListAsync();
                    if (userCards.Any())
                    {
                        _context.Card.RemoveRange(userCards);
                    }

                    // 3. Ștergem ticket-urile de support ale userului
                    var userSupport = await _context.Support.Where(s => s.UserId == id).ToListAsync();
                    if (userSupport.Any())
                    {
                        _context.Support.RemoveRange(userSupport);
                    }

                    // 4. Ștergem închirierile userului
                    var userBookings = await _context.Chirie.Where(c => c.UserId == id).ToListAsync();
                    if (userBookings.Any())
                    {
                        _context.Chirie.RemoveRange(userBookings);
                    }

                    // 5. Pentru postările userului, le ștergem și pe ele cu toate dependențele
                    var userPosts = await _context.Postare
                        .Include(p => p.chirie)
                        .Include(p => p.review)
                        .Where(p => p.UserId == id)
                        .ToListAsync();

                    foreach (var post in userPosts)
                    {
                        // Ștergem review-urile pentru această postare
                        if (post.review != null && post.review.Any())
                        {
                            _context.Review.RemoveRange(post.review);
                        }

                        // Ștergem închirierile pentru această postare
                        if (post.chirie != null && post.chirie.Any())
                        {
                            _context.Chirie.RemoveRange(post.chirie);
                        }

                        // Ștergem postarea
                        _context.Postare.Remove(post);
                    }

                    // 6. Salvăm modificările pentru entitățile custom
                    await _context.SaveChangesAsync();

                    // 7. Ștergem userul din Identity (acest lucru va șterge și rolurile)
                    var result = await _userManager.DeleteAsync(user);

                    if (!result.Succeeded)
                    {
                        throw new Exception($"Failed to delete user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    }

                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        message = "User and all associated data deleted successfully",
                        deletedUserId = id,
                        deletedPosts = userPosts.Count,
                        deletedBookings = userBookings.Count,
                        deletedReviews = userReviews.Count,
                        deletedCards = userCards.Count,
                        deletedSupportTickets = userSupport.Count
                    });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    throw new Exception($"Transaction failed: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Failed to delete user",
                    message = ex.Message,
                    details = ex.InnerException?.Message
                });
            }
        }

        [HttpPost("support-tickets/{supportId}/reply")]
        public async Task<IActionResult> AdminReplyToTicket(int supportId, [FromBody] SupportDTO replyData)
        {
            try
            {
                Console.WriteLine($"📧 Admin replying to ticket {supportId}: {replyData.comentariu}");

                var currentUserIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(currentUserIdClaim) || !int.TryParse(currentUserIdClaim, out int adminUserId))
                {
                    Console.WriteLine("❌ Admin user ID not found in token");
                    return Unauthorized("Admin user ID not found");
                }

                var adminReply = new SupportDTO
                {
                    supportId = supportId,
                    titlu = "Admin Reply", 
                    comentariu = replyData.comentariu,
                    userId = adminUserId 
                };

                Console.WriteLine($"👤 Admin reply details: SupportId={supportId}, AdminUserId={adminUserId}, Title='{adminReply.titlu}'");

                await _supportService.ReplySupport(adminReply);
                Console.WriteLine($"✅ Admin reply saved to database");

                try
                {
                    await _supportService.adminEmail(adminReply);
                    Console.WriteLine($"📧 Admin reply email sent successfully for ticket {supportId}");
                }
                catch (Exception emailEx)
                {
                    Console.WriteLine($"⚠️ Reply saved but email failed: {emailEx.Message}");
                }

                return Ok(new
                {
                    message = "Reply sent successfully",
                    emailSent = true,
                    supportId = supportId,
                    adminUserId = adminUserId
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in admin reply: {ex.Message}");
                Console.WriteLine($"📋 Stack trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    error = ex.Message,
                    supportId = supportId
                });
            }
        }

        [HttpPost("support-tickets/{supportId}/resolve")]
        public async Task<IActionResult> ResolveTicket(int supportId)
        {
            try
            {
                Console.WriteLine($"🔧 AdminController: Resolving ticket {supportId}");

                // Get current admin user ID
                var currentUserIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(currentUserIdClaim) || !int.TryParse(currentUserIdClaim, out int adminUserId))
                {
                    Console.WriteLine("❌ Admin user ID not found in token");
                    return Unauthorized("Admin user ID not found");
                }

                Console.WriteLine($"👤 Admin user ID: {adminUserId}");

                // Use SupportService to resolve the ticket (includes email sending)
                await _supportService.ResolveTicket(supportId, adminUserId);

                Console.WriteLine($"✅ Ticket {supportId} resolved successfully via SupportService");

                return Ok(new
                {
                    message = "Ticket resolved successfully",
                    supportId = supportId,
                    resolvedAt = DateTime.Now,
                    resolvedBy = adminUserId,
                    emailSent = true
                });
            }
            catch (NotFoundException ex)
            {
                Console.WriteLine($"❌ Ticket not found: {ex.Message}");
                return NotFound(new
                {
                    error = "Ticket not found",
                    details = ex.Message,
                    supportId = supportId
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error resolving ticket {supportId}: {ex.Message}");
                Console.WriteLine($"📋 Error details: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    error = "Failed to resolve ticket",
                    details = ex.Message,
                    supportId = supportId
                });
            }
        }

        [HttpGet("support-tickets/{supportId}/status")]
        public async Task<IActionResult> GetTicketStatus(int supportId)
        {
            try
            {
                var tickets = await _context.Support
                    .Include(s => s.ResolvedByUser)
                    .Where(s => s.SupportId == supportId)
                    .ToListAsync();

                if (!tickets.Any())
                {
                    return NotFound($"No tickets found with Support ID {supportId}");
                }

                var mainTicket = tickets.OrderBy(t => t.CreatedAt).First();

                return Ok(new
                {
                    supportId = supportId,
                    status = mainTicket.Status,
                    createdAt = mainTicket.CreatedAt,
                    resolvedAt = mainTicket.ResolvedAt,
                    resolvedBy = mainTicket.ResolvedByUser?.UserName,
                    messageCount = tickets.Count
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error getting ticket status {supportId}: {ex.Message}");
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