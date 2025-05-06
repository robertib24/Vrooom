using Vrooom.Models.DTOs;
namespace Vrooom.Services.CardServices
{
    public interface ICardService
    {
        Task AddCard(CardDTO cardDTO);
        Task DeleteCard(int id);
        Task UpdateCard(CardDTO card, int id);
        Task<IEnumerable<CardDTO>> GetCardByUserID(int userId);
        Task<CardDTO> GetCardByID(int id);
    }
}