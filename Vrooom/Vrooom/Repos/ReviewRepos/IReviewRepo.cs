using Vrooom.Models;

namespace Vrooom.Repos.ReviewRepos
{
    public interface IReviewRepo
    {
        Task AddReview(Review review); //
        Task DeleteReview(int id); //
        Task UpdateReview(Review review); //
        Task<IEnumerable<Review>> GetReviewsByRating(int rating); //
        Task<IEnumerable<Review>> GetReviewByRatingAsc(); //
        Task<IEnumerable<Review>> GetReviewByRatingDesc(); //
        Task<IEnumerable<Review>> GetReviewsByDate(DateTime date);
        Task<IEnumerable<Review>> GetReviewByDateAsc();
        Task<IEnumerable<Review>> GetReviewByDateDesc();
        Task<Review> GetReviewById(int id); //
    }
}
