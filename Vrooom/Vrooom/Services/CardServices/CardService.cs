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

        public async Task AddCard(CardDTO cardDTO)
        {
            var card = new Card()
            {
                numar = cardDTO.Numar,
                dataExpirare = cardDTO.DataExpirare,
                nume = cardDTO.Nume,
                cvv = cardDTO.CVV,
                UserId = cardDTO.UserId
            };
            await _cardRepository.AddCard(card);
        }

        public async Task DeleteCard(int id)
        {
            await _cardRepository.DeleteCard(id);
        }

        public async Task UpdateCard(CardDTO card, int id)
        {
            var c = await _cardRepository.CardByID(id);

            if (c is null)
            {
                throw new NotFoundException($"Nu exista card cu id-ul {id}.");
            }

            c.numar = card.Numar;
            c.dataExpirare = card.DataExpirare;
            c.nume = card.Nume;
            c.cvv = card.CVV;

            await _cardRepository.UpdateCard(c);
        }

        public async Task<IEnumerable<CardDTO>> GetCardByUserID(int id)
        {
            var cards = await _cardRepository.CardByUserID(id);
            return cards.Select(c => new CardDTO()
            {
                Numar = c.numar,
                DataExpirare = c.dataExpirare,
                Nume = c.nume,
                CVV = c.cvv,
                UserId = c.UserId
            });
        }

        public async Task<CardDTO> GetCardByID(int id)
        {
            var card = await _cardRepository.CardByID(id);
            return new CardDTO
            {
                Numar = card.numar,
                Nume = card.nume,
                CVV = card.cvv,
                DataExpirare = card.dataExpirare,
                UserId = card.UserId
            };
        }
    }
}
