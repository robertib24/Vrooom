using Vrooom.Models.DTOs;
namespace Vrooom.Services.ReviewServices
{
    public interface IReviewService
    {
        Task AddReview(ReviewDTO reviewDTO, int postareId, int userId);
        Task DeleteReview(int id);
        Task UpdateReview(ReviewDTO reviewDTO, int id);
        Task<IEnumerable<ReviewDTO>> ReviewByRating(int rating);
        Task<IEnumerable<ReviewDTO>> GetReviewByDateAsc();
        Task<IEnumerable<ReviewDTO>> GetReviewByDateDesc();
        Task<IEnumerable<ReviewDTO>> GetReviewByRatingDesc();
        Task<IEnumerable<ReviewDTO>> GetReviewByRatingAsc();
    }
}
