using Microsoft.AspNetCore.Mvc;
using Vrooom.Services.S3Services;

namespace Vrooom.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VehicleDocumentController : ControllerBase
    {
        private readonly IS3Service _s3Service;

        public VehicleDocumentController(IS3Service s3Service)
        {
            _s3Service = s3Service;
        }

        [HttpPost("{vehicleId}/uploadDocument/{documentType}")]
        public async Task<IActionResult> UploadVehicleDocument(int vehicleId, string documentType, IFormFile file)
        {
            try
            {
                var extension = Path.GetExtension(file.FileName).TrimStart('.').ToLower();
                if (string.IsNullOrEmpty(extension))
                {
                    extension = "jpg"; // default
                }

                var fileName = $"post{vehicleId}/{documentType}.{extension}";
                await _s3Service.UploadFileAsync(fileName, file);

                var url = _s3Service.GetFileUrl(fileName);
                return Ok(new { success = true, url = url, message = $"{documentType} uploaded successfully" });
            }
            catch (Exception e)
            {
                return BadRequest(new { success = false, message = e.Message });
            }
        }
    }
}
