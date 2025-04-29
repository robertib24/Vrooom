using Microsoft.EntityFrameworkCore;
using Vrooom.Data;
using Vrooom.Migrations;
using Vrooom.Models;
using Vrooom.Repos.SupportRepo;

namespace Vrooom.Repos.SupportRepos
{
    public class SupportRepo : ISupportRepo
    {
        private readonly VrooomDbContext _dbcontext;
        public SupportRepo(VrooomDbContext dbContext)
        {
            _dbcontext = dbContext;
        }

        public async Task addSupport(Support support)
        {
            await _dbcontext.Support.AddAsync(support);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task<IEnumerable<Support>> listSupport()
        {
            return await _dbcontext.Support
                                   .GroupBy(x => x.SupportId)
                                   .Select(g => g.FirstOrDefault())
                                   .ToListAsync();
        }

        public async Task<int> getMaxID()
        {
            try
            {
                int max = await _dbcontext.Support.MaxAsync(x => x.SupportId);
                return max;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }
        public async Task<IEnumerable<Support>> getSupportByUserID(int userId)
        {
            return await _dbcontext.Support
                                   .Where(s => s.UserId == userId)
                                   .GroupBy(s => s.SupportId)
                                   .Select(g => g.FirstOrDefault())
                                   .ToListAsync();
        }

        public async Task<IEnumerable<Support>> getSupportBySupportID(int supportId)
        {
            return await _dbcontext.Support.Where(s => s.SupportId == supportId).ToListAsync();
        }

        public async Task<User> UserByID(int userId)
        {
            var user = await _dbcontext.User.FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null)
            {
                throw new Exception($"Nu exista user cu id-ul {userId}");
            }
            return user;
        }
    }
}
