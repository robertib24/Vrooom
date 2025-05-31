using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vrooom.Data;
using Vrooom.Models.DTOs;
using Vrooom.Services.ChirieServices;

namespace Vrooom.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChirieController : ControllerBase
    {
        private readonly IChirieService _chirieService;
        private readonly VrooomDbContext _dbContext;

        public ChirieController(IChirieService chirieService, VrooomDbContext dbContext)
        {
            _chirieService = chirieService;
            _dbContext = dbContext;
        }

        [HttpPost]
        public async Task<IActionResult> AddChirie(ChirieDTO chirieDTO)
        {
            try
            {
                await _chirieService.addChirie(chirieDTO);
                return Ok();
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("owner/{userId}")]
        public async Task<IActionResult> GetBookingsForOwner(int userId)
        {
            try
            {
                var userPosts = await _dbContext.Postare
                    .Where(p => p.UserId == userId)
                    .Select(p => p.PostareId)
                    .ToListAsync();

                if (!userPosts.Any())
                {
                    return Ok(new List<object>());
                }

                var ownerBookings = await _dbContext.Chirie
                    .Include(c => c.User)
                    .Include(c => c.Postare)
                    .Where(c => userPosts.Contains(c.PostareId))
                    .OrderByDescending(c => c.dataStart)
                    .Select(c => new
                    {
                        chirieId = c.ChirieId,
                        postareId = c.PostareId,
                        userId = c.UserId,
                        dataStart = c.dataStart,
                        dataStop = c.dataStop,
                        renterName = c.User.nume + " " + c.User.prenume,
                        renterEmail = c.User.Email,
                        vehicleName = c.Postare.firma + " " + c.Postare.model,
                        vehicleYear = c.Postare.anFabricatie,
                        dailyRate = c.Postare.pret,
                        totalDays = (c.dataStop - c.dataStart).Days,
                        totalAmount = (c.dataStop - c.dataStart).Days * c.Postare.pret,
                        status = c.dataStart > DateTime.Now ? "upcoming" :
                                c.dataStop < DateTime.Now ? "completed" : "active"
                    })
                    .ToListAsync();

                return Ok(ownerBookings);
            }
            catch (Exception e)
            {
                return BadRequest(new { error = e.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteChirie(int id)
        {
            try
            {
                await _chirieService.deleteChirie(id);
                return Ok();
            }
            catch
            {
                return NotFound();
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateChirie([FromBody] ChirieDTO chirie, int id)
        {
            await _chirieService.UpdateChirie(chirie, id);
            return Ok();
        }

        [HttpGet("dataStart/{dataStart}")]
        public async Task<IActionResult> ChirieByDataStart(DateTime dataStart)
        {
            await _chirieService.ChirieByDataStart(dataStart);
            return Ok();
        }

        [HttpGet("dataStop/{dataStop}")]
        public async Task<IActionResult> ChirieByDataStop(DateTime dataStop)
        {
            await _chirieService.ChirieByDataStop(dataStop);
            return Ok();
        }

        [HttpGet("data/{dataStart}/{dataStop}")]
        public async Task<IActionResult> ChirieByData(DateTime dataStart, DateTime dataStop)
        {
            await _chirieService.ChirieByData(dataStart, dataStop);
            return Ok();
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetChirieByUserId(int userId)
        {
            try
            {
                var chirii = await _chirieService.GetChirieByUserId(userId);
                return Ok(chirii);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpPost("rentConfirmationEmail")]
        [AllowAnonymous]
        public async Task<IActionResult> rentConfirmationEmail(ChirieDTO chirie)
        {
            try
            {
                await _chirieService.rentConfirmationMail(chirie);
                return Ok();
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }
    }
}