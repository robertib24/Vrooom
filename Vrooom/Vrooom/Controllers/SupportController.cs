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
        private readonly ILogger<SupportController> _logger;

        public SupportController(ISupportService supportService, ILogger<SupportController> logger)
        {
            _supportService = supportService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> AddSupport(SupportDTO supportDTO)
        {
            try
            {
                _logger.LogInformation("📝 Creating new support ticket: {Title} for User {UserId}",
                    supportDTO.titlu, supportDTO.userId);

                await _supportService.AddSupport(supportDTO);

                _logger.LogInformation("✅ Support ticket created successfully with ID {SupportId}",
                    supportDTO.supportId);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creating support ticket for User {UserId}", supportDTO.userId);
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("reply")]
        public async Task<IActionResult> ReplySupport(SupportDTO supportDTO)
        {
            try
            {
                _logger.LogInformation("💬 Adding reply to support ticket {SupportId} from User {UserId}",
                    supportDTO.supportId, supportDTO.userId);
                _logger.LogInformation("Reply content: {Content}", supportDTO.comentariu);

                await _supportService.ReplySupport(supportDTO);

                _logger.LogInformation("✅ Reply added successfully to ticket {SupportId}", supportDTO.supportId);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error adding reply to support ticket {SupportId}", supportDTO.supportId);
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> getAllSupports()
        {
            try
            {
                var supports = await _supportService.getAllSupports();

                _logger.LogInformation("📋 Retrieved {Count} support tickets", supports.Count());

                return Ok(supports);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving all support tickets");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("SupportByUserId/{userId}")]
        public async Task<IActionResult> getSupportByUserId(int userId)
        {
            try
            {
                var supports = await _supportService.getSupportByUserId(userId);

                _logger.LogInformation("📋 Retrieved {Count} support tickets for User {UserId}",
                    supports.Count(), userId);

                // Log each ticket for debugging
                foreach (var support in supports)
                {
                    _logger.LogInformation("Ticket {SupportId}: '{Title}' - User {UserId}",
                        support.supportId, support.titlu, support.userId);
                }

                return Ok(supports);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving support tickets for User {UserId}", userId);
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("SupportBySupportId/{supportId}")]
        public async Task<IActionResult> getSupportBySupportId(int supportId)
        {
            try
            {
                var supports = await _supportService.getSupportBySupportId(supportId);

                _logger.LogInformation("🗂️ Retrieved {Count} messages for Support ID {SupportId}",
                    supports.Count(), supportId);

                // Log each message for debugging
                foreach (var support in supports)
                {
                    _logger.LogInformation("Message {SupportId}: '{Title}' from User {UserId} - {Content}",
                        support.supportId, support.titlu, support.userId,
                        support.comentariu.Length > 50 ? support.comentariu.Substring(0, 50) + "..." : support.comentariu);
                }

                return Ok(supports);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving support messages for Support ID {SupportId}", supportId);
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("ReplyEmail")]
        [AllowAnonymous]
        public async Task<IActionResult> replyEmail(SupportDTO support)
        {
            try
            {
                _logger.LogInformation("📧 Sending reply email for Support {SupportId}", support.supportId);

                await _supportService.replyEmail(support);

                _logger.LogInformation("✅ Reply email sent successfully for Support {SupportId}", support.supportId);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error sending reply email for Support {SupportId}", support.supportId);
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("CreateEmail")]
        [AllowAnonymous]
        public async Task<IActionResult> adminEmail(SupportDTO support)
        {
            try
            {
                _logger.LogInformation("📧 Sending admin email for Support {SupportId}", support.supportId);

                await _supportService.adminEmail(support);

                _logger.LogInformation("✅ Admin email sent successfully for Support {SupportId}", support.supportId);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error sending admin email for Support {SupportId}", support.supportId);
                return BadRequest(ex.Message);
            }
        }
    }
}