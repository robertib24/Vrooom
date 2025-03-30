using Vrooom.Models;
namespace Vrooom.Repos.CardRepos
{
    public interface ICardRepo
    {
        Task AddCard(Card card);
        Task DeleteCard(int id);
        Task <Card> CardByID(int id);
        Task UpdateCard(Card c);
        Task<IEnumerable<Card>> CardByUserID(int id);
    }
}
