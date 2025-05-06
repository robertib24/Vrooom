using Microsoft.AspNetCore.Mvc;
using Vrooom.Models.DTOs;
using Vrooom.Services.PostareServices;

namespace Vrooom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostareController : ControllerBase
    {
        private readonly IPostareService _postareService;

        public PostareController(IPostareService postareService)
        {
            _postareService = postareService;
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddPostare([FromBody] PostareDTO postare)
        {
            var id = await _postareService.AddPostare(postare);
            return Ok(new { Message = "Postare adăugată cu succes.", Id = id });
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeletePostare(int id)
        {
            await _postareService.DeletePostare(id);
            return Ok($"Postarea cu ID={id} a fost ștearsă.");
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdatePostare([FromBody] PostareDTO postare)
        {
            await _postareService.UpdatePostare(postare);
            return Ok("Postare actualizată.");
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllPosts()
        {
            var result = await _postareService.GetAllPosts();
            return Ok(result);
        }

        [HttpGet("title/{title}")]
        public async Task<IActionResult> GetByTitle(string title)
        {
            var result = await _postareService.PostByTitle(title);
            return Ok(result);
        }

        [HttpGet("pret")]
        public async Task<IActionResult> GetByPret([FromQuery] int minPrice, [FromQuery] int maxPrice)
        {
            var result = await _postareService.PostByPrice(minPrice, maxPrice);
            return Ok(result);
        }

        [HttpGet("km")]
        public async Task<IActionResult> GetByKM([FromQuery] int minKM, [FromQuery] int maxKM)
        {
            var result = await _postareService.PostByKM(minKM, maxKM);
            return Ok(result);
        }

        [HttpGet("an")]
        public async Task<IActionResult> GetByAn([FromQuery] int minYear, [FromQuery] int maxYear)
        {
            var result = await _postareService.PostByYear(minYear, maxYear);
            return Ok(result);
        }

        [HttpGet("model/{model}")]
        public async Task<IActionResult> GetByModel(string model)
        {
            var result = await _postareService.PostByModel(model);
            return Ok(result);
        }

        [HttpGet("firma/{firma}")]
        public async Task<IActionResult> GetByFirma(string firma)
        {
            var result = await _postareService.PostByFirma(firma);
            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUserId(int userId)
        {
            var result = await _postareService.PostByUserID(userId);
            return Ok(result);
        }

        [HttpGet("user-count/{userId}")]
        public async Task<IActionResult> GetPostCountByUserId(int userId)
        {
            var count = await _postareService.PostNumberByUserID(userId);
            return Ok(new { UserId = userId, Postari = count });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _postareService.PostByID(id);
            return Ok(result);
        }
    }
}
