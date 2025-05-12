using Microsoft.AspNetCore.Mvc;
using Vrooom.Models.DTOs;
using Vrooom.Services.CardServices;

namespace Vrooom.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CardController : ControllerBase
    {
        private readonly ICardService cardService;

        public CardController(ICardService cardService)
        {
            this.cardService = cardService;
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> CardByUserID(int id)
        {
            var cards = await cardService.GetCardByUserID(id);
            return Ok(cards);
        }

        [HttpPost]
        public async Task<IActionResult> AddCard(CardDTO cardDTO)
        {
            await cardService.addCard(cardDTO);
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCard(int id)
        {
            try
            {
                await cardService.deleteCard(id);
                return Ok();
            }
            catch
            {
                return NotFound();
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCard([FromBody] CardDTO card, int id)
        {
            await cardService.UpdateCard(card, id);
            return Ok();
        }

    }
}
