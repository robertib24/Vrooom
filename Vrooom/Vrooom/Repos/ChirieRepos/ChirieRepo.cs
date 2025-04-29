using Microsoft.EntityFrameworkCore;
using Vrooom.Data;
using Vrooom.Models;
using Vrooom.Models.DTOs;
using Vrooom.Repos.ChirieRepo;

namespace Vrooom.Repos.ChirieRepos
{
    public class ChirieRepo : IChirieRepo
    {
        private readonly VrooomDbContext _dbContext;

        public ChirieRepo(VrooomDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<User> UserByID(int userId)
        {
            var user = await _dbContext.User.FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null)
            {
                throw new Exception($"Nu exista user cu id-ul {userId}");
            }
            return user;
        }

        public async Task UpdatePuncteFid(User user)
        {
            _dbContext.User.Update(user);
            await _dbContext.SaveChangesAsync();
        }

        public async Task AddChirie(Chirie chirie)
        {
            var c = await _dbContext.Chirie.Where(x => x.PostareId == chirie.PostareId && (x.dataStart <= chirie.dataStart && (x.dataStop >= chirie.dataStop || x.dataStop >= chirie.dataStart) || x.dataStart >= chirie.dataStart && (x.dataStart <= chirie.dataStop || x.dataStop <= chirie.dataStop))).FirstOrDefaultAsync();
            if (c != null)
            {
                throw new Exception("Masina este deja inchiriata in aceasta perioada");
            }
            await _dbContext.Chirie.AddAsync(chirie);
            await _dbContext.SaveChangesAsync();
        }

        public async Task DeleteChirie(int id)
        {
            var k = await _dbContext.Chirie.Where(x => x.ChirieId == id).FirstOrDefaultAsync();
            if (k != null)
                _dbContext.Chirie.Remove(k);

            await _dbContext.SaveChangesAsync();
        }

        public async Task<Chirie> ChirieByID(int id)
        {
            var c = await _dbContext.Chirie.FirstOrDefaultAsync(i => i.ChirieId == id);
            if (c == null)
            {
                throw new Exception($"Nu exista chirie cu id-ul {id}");
            }
            return c;
        }

        public async Task UpdateChirie(Chirie c)
        {
            _dbContext.Chirie.Update(c);
            await _dbContext.SaveChangesAsync();
        }

        public async Task<IEnumerable<Chirie>> ChirieByDataStart(DateTime dataStart)
        {
            var c = await _dbContext.Chirie.Where(ch => ch.dataStart >= dataStart).ToListAsync();

            return c;
        }

        public async Task<IEnumerable<Chirie>> ChirieByDataStop(DateTime dataStop)
        {
            var c = await _dbContext.Chirie.Where(ch => ch.dataStop <= dataStop).ToListAsync();

            return c;
        }

        public async Task<IEnumerable<Chirie>> ChirieByData(DateTime dataStart, DateTime dataStop)
        {
            var c = await _dbContext.Chirie.Where(ch => ch.dataStop >= dataStop && ch.dataStart <= dataStart).ToListAsync();

            return c;
        }

        public async Task<int> UserByPostareID(int postareId)
        {
            var p = await _dbContext.Postare.FirstOrDefaultAsync(i => i.PostareId == postareId);
            if (p == null)
            {
                throw new Exception($"Nu exista postare cu id-ul {postareId}");
            }
            return p.UserId;
        }

        public async Task<Postare> PostareByID(int postareId)
        {
            var postare = await _dbContext.Postare.FirstOrDefaultAsync(x => x.PostareId == postareId);
            if (postare == null)
            {
                throw new Exception($"Nu exista postare cu id-ul {postareId}");
            }
            return postare;
        }
    }
}
