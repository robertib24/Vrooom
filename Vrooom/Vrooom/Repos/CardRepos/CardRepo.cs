using Microsoft.EntityFrameworkCore;
using Vrooom.Data;
using Vrooom.Models;
using Vrooom.Repos.CardRepos;
namespace Vrooom.Repos
{
    public class CardRepo : ICardRepo
    {
        private readonly VrooomDbContext _dbcontext;
        public CardRepo(VrooomDbContext dbContext)
        {
            _dbcontext = dbContext;
        }

        public async Task AddCard(Card card)
        {
            var c = await _dbcontext.Card.Where(x => x.numar == card.numar && x.nume == card.nume && x.cvv == card.cvv && x.dataExpirare == card.dataExpirare && x.UserId == card.UserId).FirstOrDefaultAsync();
            if (c != null)
            {
                throw new Exception("Cardul este deja adaugat in acest cont");
            }
            await _dbcontext.Card.AddAsync(card);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task DeleteCard(int id)
        {
            var k = await _dbcontext.Card.Where(x => x.CardId == id).FirstOrDefaultAsync();
            if (k != null)
                _dbcontext.Card.Remove(k);

            await _dbcontext.SaveChangesAsync();
        }

        public async Task<Card> CardByID(int id)
        {
            var c = await _dbcontext.Card.FirstOrDefaultAsync(i => i.CardId == id);
            if (c == null)
            {
                throw new Exception($"Nu exista card cu id-ul {id}");
            }
            return c;
        }
        public async Task<IEnumerable<Card>> CardByUserID(int id)
        {
            var c = await _dbcontext.Card.Where(i => i.UserId == id).ToListAsync();
            if (c == null)
            {
                throw new Exception($"User-ul nu are carduri");

            }
            return c;
        }

        public async Task UpdateCard(Card card)
        {
            _dbcontext.Card.Update(card);
            await _dbcontext.SaveChangesAsync();
        }
    }
}
