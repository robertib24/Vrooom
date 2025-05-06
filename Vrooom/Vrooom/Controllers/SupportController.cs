using Microsoft.AspNetCore.Mvc;
using Vrooom.Models;
using Vrooom.Models.DTOs;
using Vrooom.Services.SupportServices;

namespace Vrooom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SupportController : ControllerBase
    {
        private readonly ISupportService _supportService;

        public SupportController(ISupportService supportService)
        {
            _supportService = supportService;
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddSupport([FromBody] SupportDTO support)
        {
            await _supportService.AddSupport(support);
            await _supportService.adminEmail(support);
            return Ok("Cerere de suport trimisă.");
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllSupports()
        {
            var result = await _supportService.GetAllSupports();
            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetSupportByUserId(int userId)
        {
            var result = await _supportService.GetSupportByUserID(userId);
            return Ok(result);
        }

        [HttpGet("id/{supportId}")]
        public async Task<IActionResult> GetSupportById(int supportId)
        {
            var result = await _supportService.GetSupportBySupportID(supportId);
            return Ok(result);
        }

        [HttpPost("reply")]
        public async Task<IActionResult> ReplySupport([FromBody] SupportDTO support)
        {
            await _supportService.ReplySupport(support);
            await _supportService.replyEmail(support);
            return Ok("Răspuns trimis utilizatorului.");
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateSupport([FromBody] Support support)
        {
            await _supportService.UpdateSupport(support);
            return Ok("Suport actualizat.");
        }
    }
}
