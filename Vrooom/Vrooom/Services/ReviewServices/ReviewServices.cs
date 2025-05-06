using Vrooom.Models;
using Vrooom.Models.DTOs;
using Vrooom.Repos.ReviewRepos;
using Vrooom.Services.ReviewServices;
using Vrooom.Exceptions;

namespace Vrooom.Services.ReviewServices
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepo _reviewRepo;

        public ReviewService(IReviewRepo reviewRepo)
        {
            _reviewRepo = reviewRepo;
        }

        public async Task AddReview(ReviewDTO reviewDTO, int postareID, int userID)
        {
            var review = new Review
            {
                Comentariu = reviewDTO.Comentariu,
                Rating = reviewDTO.Rating,
                Data = DateTime.Now,
                PostareId = postareID,
                UserId = userID
            };

            await _reviewRepo.AddReview(review);
        }

        public async Task DeleteReview(int id)
        {
            await _reviewRepo.DeleteReview(id);
        }

        public async Task UpdateReview(ReviewDTO reviewDTO, int id)
        {
            var existing = await _reviewRepo.GetReviewById(id);
            if (existing == null)
                throw new NotFoundException($"Review-ul cu ID {id} nu a fost găsit.");

            existing.Comentariu = reviewDTO.Comentariu;
            existing.Rating = reviewDTO.Rating;
            existing.Data = DateTime.Now;

            await _reviewRepo.UpdateReview(existing);
        }

        public async Task<IEnumerable<ReviewDTO>> ReviewByRating(int rating)
        {
            var reviews = await _reviewRepo.GetReviewsByRating(rating);
            return reviews.Select(MapToDTO);
        }

        public async Task<IEnumerable<ReviewDTO>> GetReviewByDateAsc()
        {
            var reviews = await _reviewRepo.GetReviewByDateAsc();
            return reviews.Select(MapToDTO);
        }

        public async Task<IEnumerable<ReviewDTO>> GetReviewByDateDesc()
        {
            var reviews = await _reviewRepo.GetReviewByDateDesc();
            return reviews.Select(MapToDTO);
        }

        public async Task<IEnumerable<ReviewDTO>> ReviewByRatingAsc()
        {
            var reviews = await _reviewRepo.GetReviewByRatingAsc();
            return reviews.Select(MapToDTO);
        }

        public async Task<IEnumerable<ReviewDTO>> ReviewByRatingDesc()
        {
            var reviews = await _reviewRepo.GetReviewByRatingDesc();
            return reviews.Select(MapToDTO);
        }

        private static ReviewDTO MapToDTO(Review r) => new ReviewDTO
        {
            Comentariu = r.Comentariu,
            Rating = r.Rating,
            Data = r.Data
        };
    }
}
