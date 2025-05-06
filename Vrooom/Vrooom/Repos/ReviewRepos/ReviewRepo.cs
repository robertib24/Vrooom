using Microsoft.EntityFrameworkCore;
using Vrooom.Data;
using Vrooom.Models;
using Vrooom.Repos.ReviewRepos;

namespace Vrooom.Repos.ReviewRepos
{
    public class ReviewRepo : IReviewRepo
    {
        private readonly VrooomDbContext _dbcontext;

        public ReviewRepo(VrooomDbContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        public async Task AddReview(Review review)
        {
            await _dbcontext.Review.AddAsync(review);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task DeleteReview(int id)
        {
            var review = await _dbcontext.Review.FindAsync(id);
            if (review != null)
            {
                _dbcontext.Review.Remove(review);
                await _dbcontext.SaveChangesAsync();
            }
        }

        public async Task UpdateReview(Review review)
        {
            _dbcontext.Review.Update(review);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task<Review> GetReviewById(int id)
        {
            return await _dbcontext.Review.FirstOrDefaultAsync(r => r.ReviewId == id);
        }

        public async Task<IEnumerable<Review>> GetReviewsByRating(int rating)
        {
            return await _dbcontext.Review
                .Where(r => r.Rating == rating)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetReviewByRatingAsc()
        {
            return await _dbcontext.Review
                .OrderBy(r => r.Rating)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetReviewByRatingDesc()
        {
            return await _dbcontext.Review
                .OrderByDescending(r => r.Rating)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetReviewsByDate(DateTime date)
        {
            return await _dbcontext.Review
                .Where(r => r.Data.Date == date.Date)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetReviewByDateAsc()
        {
            return await _dbcontext.Review
                .OrderBy(r => r.Data)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetReviewByDateDesc()
        {
            return await _dbcontext.Review
                .OrderByDescending(r => r.Data)
                .ToListAsync();
        }
    }
}
