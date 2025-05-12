using Microsoft.AspNetCore.Mvc;
using Vrooom.Models.DTOs;
using Vrooom.Services.OpenAIServices;

namespace Vrooom.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OpenAIController : ControllerBase
    {
        private readonly IOpenAIService _openAIService;
        public OpenAIController(IOpenAIService openAIService)
        {
            _openAIService = openAIService;
        }

        [HttpPost("getdescription")]
        public async Task<IActionResult> GetDescription([FromBody] OpenAIDTO prompt)
        {
            var result = await _openAIService.GetDescription(prompt);
            if (result != null)
            {
                return Ok(result);
            }
            return NotFound();
        }
        [HttpPost("getCars")]
        public async Task<IActionResult> getCars([FromBody] OpenAIDTO prompt)
        {
            var result = await _openAIService.GetInfo(prompt.prompt);
            if (result != null)
            {
                return Ok(result);
            }
            return NotFound();
        }
    }
}
