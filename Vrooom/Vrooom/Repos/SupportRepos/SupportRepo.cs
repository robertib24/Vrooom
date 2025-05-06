using Microsoft.EntityFrameworkCore;
using Vrooom.Data;
using Vrooom.Models;

namespace Vrooom.Repos.SupportRepo
{
    public class SupportRepo : ISupportRepo
    {
        private readonly VrooomDbContext _dbcontext;

        public SupportRepo(VrooomDbContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        public async Task AddSupport(Support support)
        {
            await _dbcontext.Support.AddAsync(support);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task<IEnumerable<Support>> GetAllSupports()
        {
            return await _dbcontext.Support.ToListAsync();
        }

        public async Task<IEnumerable<Support>> GetSupportsByUserID(int userId)
        {
            return await _dbcontext.Support
                .Where(s => s.UserId == userId)
                .ToListAsync();
        }

        public async Task<Support> GetSupportByID(int id)
        {
            var support = await _dbcontext.Support.FirstOrDefaultAsync(s => s.SupportId == id);
            if (support == null)
                throw new Exception($"Nu există suport cu ID-ul {id}.");
            return support;
        }

        public async Task UpdateSupport(Support support)
        {
            _dbcontext.Support.Update(support);
            await _dbcontext.SaveChangesAsync();
        }
    }
}
