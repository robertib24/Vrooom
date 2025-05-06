using Microsoft.AspNetCore.Mvc;
using Vrooom.Models.DTOs;
using Vrooom.Services.CardServices;

namespace Vrooom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CardController : ControllerBase
    {
        private readonly ICardService _cardService;

        public CardController(ICardService cardService)
        {
            _cardService = cardService;
        }

        // POST: api/card/add
        [HttpPost("add")]
        public async Task<IActionResult> AddCard([FromBody] CardDTO cardDto)
        {
            await _cardService.AddCard(cardDto);
            return Ok("Card adăugat cu succes.");
        }

        // DELETE: api/card/delete/5
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteCard(int id)
        {
            await _cardService.DeleteCard(id);
            return Ok("Card șters.");
        }

        // PUT: api/card/update/5
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateCard([FromBody] CardDTO cardDto, int id)
        {
            await _cardService.UpdateCard(cardDto, id);
            return Ok("Card actualizat.");
        }

        // GET: api/card/user/3
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetCardsByUserId(int userId)
        {
            var cards = await _cardService.GetCardByUserID(userId);
            return Ok(cards);
        }

        // GET: api/card/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCardById(int id)
        {
            var card = await _cardService.GetCardByID(id);
            return Ok(card);
        }
    }
}
