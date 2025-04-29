using Microsoft.EntityFrameworkCore;
using System.Linq;
using Vrooom.Data;
using Vrooom.Models;
using Vrooom.Repos.ReviewRepo;

namespace Vrooom.Repos.ReviewRepos
{
    public class ReviewRepo : IReviewRepo
    {
        private readonly VrooomDbContext _dbcontext;
        public ReviewRepo(VrooomDbContext dbContext)
        {
            _dbcontext = dbContext;
        }

        public async Task addReview(Review review)
        {
            var r = await _dbcontext.Review.Where(x => x.PostareId == review.PostareId && x.UserId == review.UserId).FirstOrDefaultAsync();
            if (r != null)
            {
                throw new Exception("Ai dat deja review acestei postari");
            }
            await _dbcontext.Review.AddAsync(review);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task removeReview(int id)
        {
            var k = await _dbcontext.Review.Where(x => x.ReviewId == id).FirstOrDefaultAsync();
            if (k != null)
                _dbcontext.Review.Remove(k);

            await _dbcontext.SaveChangesAsync();
        }

        public async Task<Review> ReviewByID(int id)
        {
            var r = await _dbcontext.Review.FirstOrDefaultAsync(i => i.ReviewId == id);
            if (r == null)
            {
                throw new Exception($"Nu exista review cu id-ul {id}");
            }
            return r;
        }

        public async Task UpdateReview(Review r)
        {
            _dbcontext.Review.Update(r);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task<IEnumerable<Review>> ReviewByRating(float rating)
        {
            var r = await _dbcontext.Review.Where(rr => rr.rating == rating).ToListAsync();

            return r;
        }

        public async Task<IEnumerable<Review>> ReviewByDateAsc()
        {
            return await _dbcontext.Review.ToListAsync();
        }

        public async Task<IEnumerable<Review>> ReviewByDateDesc()
        {
            return await _dbcontext.Review.ToListAsync();
        }

        public async Task<IEnumerable<Review>> ReviewByRatingDesc()
        {
            return await _dbcontext.Review.ToListAsync();
        }

        public async Task<IEnumerable<Review>> ReviewByRatingAsc()
        {
            return await _dbcontext.Review.ToListAsync();
        }

        public async Task<int> UserByPostareID(int postareId)
        {
            var p = await _dbcontext.Postare.FirstOrDefaultAsync(i => i.PostareId == postareId);
            if (p == null)
            {
                throw new Exception($"Nu exista postare cu id-ul {postareId}");
            }
            return p.UserId;
        }
    }
}
