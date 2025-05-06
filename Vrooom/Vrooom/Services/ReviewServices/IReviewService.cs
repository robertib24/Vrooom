using Vrooom.Models.DTOs;

namespace Vrooom.Services.ReviewServices
{
    public interface IReviewService
    {
        Task AddReview(ReviewDTO reviewDTO, int postareID, int userID);
        Task DeleteReview(int id);
        Task UpdateReview(ReviewDTO review, int id);
        Task<IEnumerable<ReviewDTO>> ReviewByRating(int rating);
        Task<IEnumerable<ReviewDTO>> GetReviewByDateAsc();
        Task<IEnumerable<ReviewDTO>> GetReviewByDateDesc();
        Task<IEnumerable<ReviewDTO>> ReviewByRatingAsc();
        Task<IEnumerable<ReviewDTO>> ReviewByRatingDesc();
    }
}
