using Vrooom.Models.DTOs;
using Vrooom.Models;
using Vrooom.Exceptions;
using Vrooom.Repos.ReviewRepo;

namespace Vrooom.Services.ReviewServices
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepo _reviewRepository;
        public ReviewService(IReviewRepo reviewRepository)
        {
            _reviewRepository = reviewRepository;
        }
        public async Task AddReview(ReviewDTO reviewDTO, int postareId, int userId)
        {
            if (userId == await _reviewRepository.UserByPostareID(postareId))
            {
                throw new Exception("Nu poti da review unei postari publicate de tine!");
            }

            var review = new Review()
            {
                PostareId = postareId,
                UserId = userId,
                titlu = reviewDTO.titlu,
                comentariu = reviewDTO.comentariu,
                rating = reviewDTO.rating,
                dataReview = reviewDTO.dataReview
            };
            await _reviewRepository.addReview(review);
        }

        public async Task DeleteReview(int id)
        {
            await _reviewRepository.removeReview(id);
        }

        public async Task UpdateReview(ReviewDTO reviewDTO, int reviewId)
        {
            var r = await _reviewRepository.ReviewByID(reviewId);

            if (r == null)
            {
                throw new NotFoundException($"Nu exista review cu id-ul {reviewId}.");
            }

            r.titlu = reviewDTO.titlu;
            r.comentariu = reviewDTO.comentariu;
            r.rating = reviewDTO.rating;

            await _reviewRepository.UpdateReview(r);
        }

        public async Task<IEnumerable<ReviewDTO>> ReviewByRating(int rating)
        {
            var r = await _reviewRepository.ReviewByRating(rating);

            if (r == null)
            {
                throw new NotFoundException($"Nu exista review cu acest rating {rating}.");
            }

            IEnumerable<ReviewDTO> rez;
            rez = r.Select(re => new ReviewDTO
            {
                titlu = re.titlu,
                comentariu = re.comentariu,
                rating = re.rating,
                dataReview = re.dataReview
            });
            return rez;
        }

        public async Task<IEnumerable<ReviewDTO>> GetReviewByDateAsc()
        {
            var r = await _reviewRepository.ReviewByDateAsc();

            IEnumerable<ReviewDTO> rez;
            rez = r.Select(re => new ReviewDTO
            {
                titlu = re.titlu,
                comentariu = re.comentariu,
                rating = re.rating,
                dataReview = re.dataReview
            });

            IEnumerable<ReviewDTO> rez2 = rez.OrderByDescending(d => d.dataReview);
            return rez2;
        }

        public async Task<IEnumerable<ReviewDTO>> GetReviewByDateDesc()
        {
            var r = await _reviewRepository.ReviewByDateDesc();

            IEnumerable<ReviewDTO> rez;
            rez = r.Select(re => new ReviewDTO
            {
                titlu = re.titlu,
                comentariu = re.comentariu,
                rating = re.rating,
                dataReview = re.dataReview
            });

            IEnumerable<ReviewDTO> rez2 = rez.OrderByDescending(d => d.dataReview);
            return rez2;
        }

        public async Task<IEnumerable<ReviewDTO>> GetReviewByRatingAsc()
        {
            var r = await _reviewRepository.ReviewByRatingAsc();

            IEnumerable<ReviewDTO> rez;
            rez = r.Select(re => new ReviewDTO
            {
                titlu = re.titlu,
                comentariu = re.comentariu,
                rating = re.rating,
                dataReview = re.dataReview
            });

            IEnumerable<ReviewDTO> rez2 = rez.OrderBy(d => d.rating);
            return rez2;
        }

        public async Task<IEnumerable<ReviewDTO>> GetReviewByRatingDesc()
        {
            var r = await _reviewRepository.ReviewByRatingDesc();

            IEnumerable<ReviewDTO> rez;
            rez = r.Select(re => new ReviewDTO
            {
                titlu = re.titlu,
                comentariu = re.comentariu,
                rating = re.rating,
                dataReview = re.dataReview
            });

            IEnumerable<ReviewDTO> rez2 = rez.OrderByDescending(d => d.rating);
            return rez2;
        }
    }
}
