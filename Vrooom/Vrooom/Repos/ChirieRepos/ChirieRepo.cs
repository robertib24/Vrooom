using Microsoft.EntityFrameworkCore;
using Vrooom.Data;
using Vrooom.Models;

namespace Vrooom.Repos.ChirieRepos
{
    public class ChirieRepo : IChirieRepo
    {
        private readonly VrooomDbContext _dbcontext;

        public ChirieRepo(VrooomDbContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        public async Task AddChirie(Chirie c)
        {
            await _dbcontext.Chirie.AddAsync(c);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task DeleteChirie(int id)
        {
            var ch = await _dbcontext.Chirie.FindAsync(id);
            if (ch != null)
            {
                _dbcontext.Chirie.Remove(ch);
                await _dbcontext.SaveChangesAsync();
            }
        }

        public async Task<Chirie> ChirieByID(int id)
        {
            var ch = await _dbcontext.Chirie.FirstOrDefaultAsync(x => x.ChirieId == id);
            if (ch == null)
                throw new Exception($"Nu există chirie cu ID-ul {id}.");
            return ch;
        }

        public async Task UpdateChirie(Chirie c)
        {
            _dbcontext.Chirie.Update(c);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task<IEnumerable<Chirie>> ChiriiByDataStart(DateTime dataStart)
        {
            return await _dbcontext.Chirie
                .Where(c => c.DataStart.Date == dataStart.Date)
                .ToListAsync();
        }

        public async Task<IEnumerable<Chirie>> ChiriiByDataStop(DateTime dataStop)
        {
            return await _dbcontext.Chirie
                .Where(c => c.DataStop.Date == dataStop.Date)
                .ToListAsync();
        }

        public async Task<IEnumerable<Chirie>> ChiriiByData(DateTime dataStart, DateTime dataStop)
        {
            return await _dbcontext.Chirie
                .Where(c => c.DataStart.Date >= dataStart.Date && c.DataStop.Date <= dataStop.Date)
                .ToListAsync();
        }

        public async Task<User> UserByID(int id)
        {
            var user = await _dbcontext.User.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
                throw new Exception($"Utilizatorul cu ID-ul {id} nu există.");
            return user;
        }

        public async Task UpdatePuncteFid(User u)
        {
            _dbcontext.User.Update(u);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task<int> UserByPostareID(int idPost)
        {
            var post = await _dbcontext.Postare.FirstOrDefaultAsync(p => p.PostareId == idPost);
            if (post == null)
                throw new Exception($"Postarea cu ID-ul {idPost} nu există.");
            return post.UserId;
        }

        public async Task<Postare> PostareByID(int id)
        {
            var p = await _dbcontext.Postare.FirstOrDefaultAsync(p => p.PostareId == id);
            if (p == null)
                throw new Exception($"Postarea cu ID-ul {id} nu există.");
            return p;
        }
    }
}
