using Vrooom.Models.DTOs;
namespace Vrooom.Services.CardServices
{
    public interface ICardService
    {
        Task addCard(CardDTO cardDTO);
        Task deleteCard(int id);
        Task UpdateCard(CardDTO card, int id);
        Task<IEnumerable<CardDTO>> GetCardByUserID(int id);
}
}
