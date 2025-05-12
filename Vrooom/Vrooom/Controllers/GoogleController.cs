using Microsoft.AspNetCore.Mvc;
using Vrooom.Services.GoogleServices;

namespace Vrooom.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GoogleController : ControllerBase
    {
        private readonly IGoogleService _mapsService;
        public GoogleController(IGoogleService mapsService)
        {
            _mapsService = mapsService;
        }
        [HttpGet("check")]
        public async Task<IActionResult> check(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return BadRequest("Text parameter is required.");
            }

            try
            {
                var result = await _mapsService.check(text);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        [HttpGet("coordinates")]
        public async Task<IActionResult> GetCoordinates(string location)
        {
            if (string.IsNullOrEmpty(location))
            {
                return BadRequest("Location parameter is required.");
            }

            try
            {
                var (latitude, longitude) = await _mapsService.GetCoordinatesAsync(location);
                return Ok(new { Latitude = latitude, Longitude = longitude });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
        [HttpGet("id")]
        public async Task<IActionResult> GetId(string location)
        {
            if (string.IsNullOrEmpty(location))
            {
                return BadRequest("Location parameter is required.");
            }

            try
            {
                var id = await _mapsService.GetIdfromLocationAsync(location);
                return Ok(id);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
        [HttpGet("location")]
        public async Task<IActionResult> GetLocation(double latitude, double longitude)
        {
            try
            {
                var location = await _mapsService.getLocationFromCoordinates(latitude, longitude);
                return Ok(location);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
    }
}
