using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Vrooom.Models;
using Vrooom.Repos.ReviewRepos;

namespace VrooomTestConsole
{
    public class DummyReviewRepo : IReviewRepo
    {
        private readonly List<Review> _reviews = new();
        private int _nextId = 1;

        public Task AddReview(Review review)
        {
            review.ReviewId = _nextId++;
            _reviews.Add(review);
            Console.WriteLine($"Review adăugat: {review.Comentariu}, Rating: {review.Rating}");
            return Task.CompletedTask;
        }

        public Task DeleteReview(int id)
        {
            _reviews.RemoveAll(r => r.ReviewId == id);
            Console.WriteLine($"Review cu ID {id} șters.");
            return Task.CompletedTask;
        }

        public Task<Review> GetReviewById(int id)
            => Task.FromResult(_reviews.FirstOrDefault(r => r.ReviewId == id));

        public Task UpdateReview(Review review)
        {
            var index = _reviews.FindIndex(r => r.ReviewId == review.ReviewId);
            if (index != -1)
                _reviews[index] = review;
            return Task.CompletedTask;
        }

        public Task<IEnumerable<Review>> GetReviewsByRating(int rating)
            => Task.FromResult(_reviews.Where(r => r.Rating == rating).AsEnumerable());

        public Task<IEnumerable<Review>> GetReviewsByDate(DateTime date)
            => Task.FromResult(_reviews.Where(r => r.Data.Date == date.Date).AsEnumerable());

        public Task<IEnumerable<Review>> GetReviewByDateAsc()
            => Task.FromResult(_reviews.OrderBy(r => r.Data).AsEnumerable());

        public Task<IEnumerable<Review>> GetReviewByDateDesc()
            => Task.FromResult(_reviews.OrderByDescending(r => r.Data).AsEnumerable());

        public Task<IEnumerable<Review>> GetReviewByRatingAsc()
            => Task.FromResult(_reviews.OrderBy(r => r.Rating).AsEnumerable());

        public Task<IEnumerable<Review>> GetReviewByRatingDesc()
            => Task.FromResult(_reviews.OrderByDescending(r => r.Rating).AsEnumerable());
    }
}
