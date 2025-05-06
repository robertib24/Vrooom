using Microsoft.AspNetCore.Mvc;
using Vrooom.Models.DTOs;
using Vrooom.Services.ReviewServices;

namespace Vrooom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddReview(
            [FromBody] ReviewDTO review,
            [FromQuery] int postareID,
            [FromQuery] int userID)
        {
            await _reviewService.AddReview(review, postareID, userID);
            return Ok("Review adăugat cu succes.");
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            await _reviewService.DeleteReview(id);
            return Ok($"Review-ul cu ID={id} a fost șters.");
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateReview(int id, [FromBody] ReviewDTO review)
        {
            await _reviewService.UpdateReview(review, id);
            return Ok("Review actualizat cu succes.");
        }

        [HttpGet("by-rating/{rating}")]
        public async Task<IActionResult> GetByRating(int rating)
        {
            var result = await _reviewService.ReviewByRating(rating);
            return Ok(result);
        }

        [HttpGet("by-date-asc")]
        public async Task<IActionResult> GetByDateAsc()
        {
            var result = await _reviewService.GetReviewByDateAsc();
            return Ok(result);
        }

        [HttpGet("by-date-desc")]
        public async Task<IActionResult> GetByDateDesc()
        {
            var result = await _reviewService.GetReviewByDateDesc();
            return Ok(result);
        }

        [HttpGet("by-rating-asc")]
        public async Task<IActionResult> GetByRatingAsc()
        {
            var result = await _reviewService.ReviewByRatingAsc();
            return Ok(result);
        }

        [HttpGet("by-rating-desc")]
        public async Task<IActionResult> GetByRatingDesc()
        {
            var result = await _reviewService.ReviewByRatingDesc();
            return Ok(result);
        }
    }
}
