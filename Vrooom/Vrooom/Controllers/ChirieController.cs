using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vrooom.Models.DTOs;
using Vrooom.Services.ChirieServices;

namespace Vrooom.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChirieController : ControllerBase
    {
        private readonly IChirieService _chirieService;

        public ChirieController(IChirieService chirieService)
        {
            _chirieService = chirieService;
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
