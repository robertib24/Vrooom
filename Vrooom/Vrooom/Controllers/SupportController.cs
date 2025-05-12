using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vrooom.Models.DTOs;
using Vrooom.Services.SupportServices;

namespace Vrooom.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupportController : Controller
    {
        private readonly ISupportService _supportService;
        public SupportController(ISupportService supportService)
        {
            _supportService = supportService;
        }

        [HttpPost]
        public async Task<IActionResult> AddSupport(SupportDTO supportDTO)
        {
            await _supportService.AddSupport(supportDTO);
            return Ok();
        }
        [HttpPost("reply")]
        public async Task<IActionResult> ReplySupport(SupportDTO supportDTO)
        {
            await _supportService.ReplySupport(supportDTO);
            return Ok();
        }

        [HttpGet]
        public async Task<IActionResult> getAllSupports()
        {
            var supports = await _supportService.getAllSupports();
            return Ok(supports);
        }

        [HttpGet("SupportByUserId/{userId}")]
        public async Task<IActionResult> getSupportByUserId(int userId)
        {
            var supports = await _supportService.getSupportByUserId(userId);
            return Ok(supports);
        }

        [HttpGet("SupportBySupportId/{supportId}")]
        public async Task<IActionResult> getSupportBySupportId(int supportId)
        {
            var supports = await _supportService.getSupportBySupportId(supportId);
            return Ok(supports);
        }

        [HttpPost("ReplyEmail")]
        [AllowAnonymous]
        public async Task<IActionResult> replyEmail(SupportDTO support)
        {
            try
            {
                await _supportService.replyEmail(support);
                return Ok();
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpPost("CreateEmail")]
        [AllowAnonymous]
        public async Task<IActionResult> adminEmail(SupportDTO support)
        {
            try
            {
                await _supportService.adminEmail(support);
                return Ok();
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }
    }
}
