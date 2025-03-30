using Vrooom.Models;
namespace Vrooom.Repos.ReviewRepo
{
    public interface IReviewRepo
    {
        Task addReview(Review review);
        Task removeReview(Review review);
        Task<Review> ReviewByID(int id);
        Task UpdateReview(Review review);
        Task <IEnumerable<Review>> ReviewByRating(float rating);
        Task<IEnumerable<Review>> ReviewByRatingAsc();
        Task<IEnumerable<Review>> ReviewByRatingDesc();
        Task<IEnumerable<Review>> ReviewByDateAsc();
        Task<IEnumerable<Review>> ReviewByDateDesc();
        Task<int> UserByPostareID(int postareId);


    }
}
