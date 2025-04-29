using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;
using Vrooom.Exceptions;
using Vrooom.Models;
using Vrooom.Models.DTOs;
using Vrooom.Repos;
using Vrooom.Repos.CardRepos;

namespace Vrooom.Services.CardServices
{
    public class CardService : ICardService
    {
        private readonly ICardRepo _cardRepository;
        public CardService(ICardRepo cardRepository)
        {
            _cardRepository = cardRepository;
        }
        public async Task addCard(CardDTO cardDTO)
        {
            var card = new Card()
            {
                numar = cardDTO.numar,
                dataExpirare = cardDTO.dataExpirare,
                nume = cardDTO.nume,
                cvv = cardDTO.cvv,
                UserId = cardDTO.UserId
            };
            await _cardRepository.AddCard(card);
        }

        public async Task deleteCard(int id)
        {
            await _cardRepository.DeleteCard(id);
        }

        public async Task UpdateCard(CardDTO card, int id)
        {
            var c = await _cardRepository.CardByID(id);

            if (c == null)
            {
                throw new NotFoundException($"Nu exista card cu id-ul {id}.");
            }

            c.numar = card.numar;
            c.dataExpirare = card.dataExpirare;
            c.nume = card.nume;
            c.cvv = card.cvv;

            await _cardRepository.UpdateCard(c);
        }
        public async Task<IEnumerable<CardDTO>> GetCardByUserID(int id)
        {
            var cards = await _cardRepository.CardByUserID(id);
            return cards.Select(c => new CardDTO()
            {
                numar = c.numar,
                dataExpirare = c.dataExpirare,
                nume = c.nume,
                cvv = c.cvv,
                UserId = c.UserId
            });
        }
    }
}
