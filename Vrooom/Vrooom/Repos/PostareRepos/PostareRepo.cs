using Microsoft.EntityFrameworkCore;
using System.Linq;
using Vrooom.Data;
using Vrooom.Exceptions;
using Vrooom.Models;
using Vrooom.Models.DTOs;
using Vrooom.Repos.PostareRepo;

namespace Vrooom.Repos.PostareRepos
{
    public class PostareRepo : IPostareRepo
    {
        private readonly VrooomDbContext _dbContext;

        public PostareRepo(VrooomDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task addPostare(Postare postare)
        {
            await _dbContext.Postare.AddAsync(postare);
            await _dbContext.SaveChangesAsync();
        }

        public async Task deletePostare(int id)
        {
            var k = await _dbContext.Postare.Where(x => x.PostareId == id).FirstOrDefaultAsync();
            if (k != null)
                _dbContext.Postare.Remove(k);

            await _dbContext.SaveChangesAsync();
        }
        public async Task<IEnumerable<Postare>> execQuery(string query)
        {
            string sql = $"{query}";
            return await _dbContext.Postare.FromSqlRaw(sql).ToListAsync();
        }

        public async Task<Postare> getPostareByID(int id)
        {
            var p = await _dbContext.Postare.FirstOrDefaultAsync(i => i.PostareId == id);
            if (p == null)
            {
                throw new Exception($"Nu exista postare cu id-ul {id}");
            }
            return p;
        }
        public async Task<int> NrPostareByUserID(int userId)
        {
            return await _dbContext.Postare.CountAsync(p => p.UserId == userId);
        }
        public async Task<int> CountPostare()
        {
            return await _dbContext.Postare.MaxAsync(p => p.PostareId);
        }
        public async Task<IEnumerable<Postare>> getPostare()
        {
            return await _dbContext.Postare.ToListAsync();
        }
        public async Task updatePost(Postare p)
        {
            _dbContext.Postare.Update(p);
            await _dbContext.SaveChangesAsync();
        }

        public async Task<IEnumerable<Postare>> getPostByYear(int anMinim, int anMaxim)
        {
            var p = await _dbContext.Postare.Where(pr => pr.anFabricatie >= anMinim && pr.anFabricatie <= anMaxim).ToListAsync();

            return p;
        }

        public async Task<IEnumerable<Postare>> getPostByFirm(string firma)
        {
            var p = await _dbContext.Postare.Where(pr => pr.firma.ToLower().Contains(firma.ToLower())).ToListAsync();

            return p;
        }

        public async Task<IEnumerable<Postare>> getPostByKM(int kmMinim, int kmMaxim)
        {
            var p = await _dbContext.Postare.Where(pr => pr.kilometraj >= kmMinim && pr.kilometraj <= kmMaxim).ToListAsync();

            return p;
        }

        public async Task<IEnumerable<Postare>> getPostByModel(string model)
        {
            var p = await _dbContext.Postare.Where(pr => pr.model.ToLower().Contains(model.ToLower())).ToListAsync();

            return p;
        }

        public async Task<IEnumerable<Postare>> getPostByPrice(int pretMinim, int pretMaxim)
        {
            var p = await _dbContext.Postare.Where(pr => pr.pret >= pretMinim && pr.pret <= pretMaxim).ToListAsync();

            return p;
        }

        public async Task<IEnumerable<Postare>> getPostByTitle(string titlu)
        {
            var p = await _dbContext.Postare.Where(pr => pr.titlu.ToLower().Contains(titlu.ToLower())).ToListAsync();

            return p;
        }

        public async Task<IEnumerable<Postare>> getPostByUserID(int userId)
        {
            var p = await _dbContext.Postare.Where(pr => pr.UserId == userId).ToListAsync();

            return p;
        }
    }
}
