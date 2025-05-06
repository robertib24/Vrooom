using Microsoft.EntityFrameworkCore;
using Vrooom.Data;
using Vrooom.Models;

namespace Vrooom.Repos.PostareRepo
{
    public class PostareRepo : IPostareRepo
    {
        private readonly VrooomDbContext _dbcontext;

        public PostareRepo(VrooomDbContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        public async Task AddPostare(Postare p)
        {
            await _dbcontext.Postare.AddAsync(p);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task DeletePostare(int id)
        {
            var p = await _dbcontext.Postare.FindAsync(id);
            if (p != null)
            {
                _dbcontext.Postare.Remove(p);
                await _dbcontext.SaveChangesAsync();
            }
        }

        public async Task<Postare> GetPostareByID(int postId)
        {
            var postare = await _dbcontext.Postare.FindAsync(postId);
            if (postare == null)
                throw new Exception($"Postarea cu ID-ul {postId} nu există.");
            return postare;
        }

        public async Task<IEnumerable<Postare>> GetPostare()
        {
            return await _dbcontext.Postare.ToListAsync();
        }

        public async Task<int> CountPostare()
        {
            return await _dbcontext.Postare.CountAsync();
        }

        public async Task<int> NrPostareByUserID(int userId)
        {
            return await _dbcontext.Postare.CountAsync(p => p.UserId == userId);
        }

        public async Task UpdatePost(Postare p)
        {
            _dbcontext.Postare.Update(p);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task<IEnumerable<Postare>> GetPostByTitle(string title)
        {
            return await _dbcontext.Postare
                .Where(p => p.Titlu.Contains(title))
                .ToListAsync();
        }

        public async Task<IEnumerable<Postare>> GetPostByModel(string model)
        {
            return await _dbcontext.Postare
                .Where(p => p.Model.Contains(model))
                .ToListAsync();
        }

        public async Task<IEnumerable<Postare>> GetPostByPrice(int minPrice, int maxPrice)
        {
            return await _dbcontext.Postare
                .Where(p => p.Pret >= minPrice && p.Pret <= maxPrice)
                .ToListAsync();
        }

        public async Task<IEnumerable<Postare>> GetPostByKM(int minKM, int maxKM)
        {
            return await _dbcontext.Postare
                .Where(p => p.Kilometraj >= minKM && p.Kilometraj <= maxKM)
                .ToListAsync();
        }

        public async Task<IEnumerable<Postare>> GetPostByYear(int minYear, int maxYear)
        {
            return await _dbcontext.Postare
                .Where(p => p.AnFabricatie >= minYear && p.AnFabricatie <= maxYear)
                .ToListAsync();
        }

        public async Task<IEnumerable<Postare>> GetPostByFirm(string firm)
        {
            return await _dbcontext.Postare
                .Where(p => p.Firma.Contains(firm))
                .ToListAsync();
        }

        public async Task<IEnumerable<Postare>> GetPostByUserID(int userId)
        {
            return await _dbcontext.Postare
                .Where(p => p.UserId == userId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Postare>> ExecQuery(string query)
        {
            return await _dbcontext.Postare
                .FromSqlRaw(query)
                .ToListAsync();
        }
    }
}
