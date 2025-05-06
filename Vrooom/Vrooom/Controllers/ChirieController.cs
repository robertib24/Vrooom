using Microsoft.AspNetCore.Mvc;
using Vrooom.Models.DTOs;
using Vrooom.Services.ChirieServices;

namespace Vrooom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChirieController : ControllerBase
    {
        private readonly IChirieService _chirieService;

        public ChirieController(IChirieService chirieService)
        {
            _chirieService = chirieService;
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddChirie([FromBody] ChirieDTO chirie)
        {
            await _chirieService.AddChirie(chirie);
            return Ok("Chirie adăugată cu succes.");
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteChirie(int id)
        {
            await _chirieService.DeleteChirie(id);
            return Ok($"Chiria cu ID {id} a fost ștearsă.");
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateChirie(int id, [FromBody] ChirieDTO chirie)
        {
            await _chirieService.UpdateChirie(chirie, id);
            return Ok("Chirie actualizată cu succes.");
        }

        [HttpGet("start/{dataStart}")]
        public async Task<IActionResult> ChiriiByStart([FromRoute] DateTime dataStart)
        {
            var chirii = await _chirieService.ChirieByDataStart(dataStart);
            return Ok(chirii);
        }

        [HttpGet("stop/{dataStop}")]
        public async Task<IActionResult> ChiriiByStop([FromRoute] DateTime dataStop)
        {
            var chirii = await _chirieService.ChirieByDataStop(dataStop);
            return Ok(chirii);
        }

        [HttpGet("interval")]
        public async Task<IActionResult> ChiriiByInterval([FromQuery] DateTime dataStart, [FromQuery] DateTime dataStop)
        {
            var chirii = await _chirieService.ChirieByData(dataStart, dataStop);
            return Ok(chirii);
        }

        [HttpPost("confirm-mail")]
        public async Task<IActionResult> RentConfirmationMail([FromBody] ChirieDTO chirie)
        {
            await _chirieService.RentConfirmationMail(chirie);
            return Ok("Emailul de confirmare a fost trimis.");
        }
    }
}
