using Microsoft.AspNetCore.Mvc;
using Vrooom.Models.DTOs;
using Vrooom.Services.PostareServices;

namespace Vrooom.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PostareController : ControllerBase
    {
        private readonly IPostareService _postareService;

        public PostareController(IPostareService postareService)
        {
            _postareService = postareService;
        }

        [HttpPost]
        public async Task<IActionResult> AddPostare([FromForm] PostareDTO postareDTO)
        {

            return Ok(await _postareService.AddPostare(postareDTO));
        }
        [HttpGet]
        public async Task<IActionResult> getAllPostari()
        {
            var postari = await _postareService.getAllPostari();
            return Ok(postari);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePostare(int id)
        {
            try
            {
                await _postareService.DeletePostare(id);
                return Ok();
            }
            catch
            {
                return NotFound();
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePostare([FromBody] PostareDTO postare)
        {
            await _postareService.UpdatePostare(postare);
            return Ok();
        }

        [HttpGet("titlu/{titlu}")]
        public async Task<IActionResult> PostareByTitlu(String titlu)
        {
            var p = await _postareService.PostareByTitlu(titlu);
            return Ok(p);
        }

        [HttpGet("pret/{pretMinim}/{pretMaxim}")]
        public async Task<IActionResult> PostareByPret(int pretMinim, int pretMaxim)
        {
            var p = await _postareService.PostareByPret(pretMinim, pretMaxim);
            return Ok(p);
        }

        [HttpGet("firma/{firma}")]
        public async Task<IActionResult> PostareByFirma(String firma)
        {
            var p = await _postareService.PostareByFirma(firma);
            return Ok(p);
        }

        [HttpGet("model/{model}")]
        public async Task<IActionResult> PostareByModel(String model)
        {
            var p = await _postareService.PostareByModel(model);
            return Ok(p);
        }

        [HttpGet("km/{kmMinim}/{kmMaxim}")]
        public async Task<IActionResult> PostareByKm(int kmMinim, int kmMaxim)
        {
            var p = await _postareService.PostareByKm(kmMinim, kmMaxim);
            return Ok(p);
        }

        [HttpGet("an/{anMinim}/{anMaxim}")]
        public async Task<IActionResult> PostareByAn(int anMinim, int anMaxim)
        {
            var p = await _postareService.PostareByAn(anMinim, anMaxim);
            return Ok(p);
        }

        [HttpGet("count/{userId}")]
        public async Task<IActionResult> NrPostareByUser(int userId)
        {
            var p = await _postareService.NrPostareByUser(userId);
            return Ok(p);
        }

        [HttpGet("userId")]
        public async Task<IActionResult> PostareByUserId(int userId)
        {
            var p = await _postareService.PostareByUserId(userId);
            return Ok(p);
        }
        [HttpGet("carid/{id}")]
        public async Task<IActionResult> PostareById(int id)
        {
            var p = await _postareService.postareById(id);
            return Ok(p);
        }
    }
}
