using Microsoft.AspNetCore.Mvc;
using Vrooom.Models.DTOs;
using Vrooom.Services.ReviewServices;

namespace Vrooom.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService reviewService;

        public ReviewController(IReviewService reviewService)
        {
            this.reviewService = reviewService;
        }

        [HttpPost]
        public async Task<IActionResult> AddReview(ReviewDTO reviewDTO, int postareId, int userId)
        {
            await reviewService.AddReview(reviewDTO, postareId, userId);
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            try
            {
                await reviewService.DeleteReview(id);
                return Ok();
            }
            catch
            {
                return NotFound();
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReview([FromBody] ReviewDTO review, int id)
        {
            await reviewService.UpdateReview(review, id);
            return Ok();
        }

        [HttpGet("rating/{rating}")]
        public async Task<IActionResult> ReviewByRating(int rating)
        {
            var r = await reviewService.ReviewByRating(rating);
            return Ok(r);
        }

        [HttpGet("GetReviewsByDateNewToOld")]
        public async Task<IActionResult> GetReviewByDateAsc()
        {
            var r = await reviewService.GetReviewByDateAsc();
            return Ok(r);
        }

        [HttpGet("GetReviewsByDateOldToNew")]
        public async Task<IActionResult> GetReviewByDateDesc()
        {
            var r = await reviewService.GetReviewByDateAsc();
            return Ok(r);
        }

        [HttpGet("GetReviewsByRatingLowToHigh")]
        public async Task<IActionResult> GetReviewByRatingAsc()
        {
            var r = await reviewService.GetReviewByRatingAsc();
            return Ok(r);
        }

        [HttpGet("GetReviewsByRatingHighToLow")]
        public async Task<IActionResult> GetReviewByRatingDesc()
        {
            var r = await reviewService.GetReviewByRatingDesc();
            return Ok(r);
        }
    }
}
