using Microsoft.Extensions.Primitives;
using System.ComponentModel.DataAnnotations;

namespace ProiectMDS.Models
{
    public class Review
    {
        [Key]
        public int ReviewId { get; set; }
        public int PostareId {  get; set; }

        public int UserId { get; set; }

        public string titlu {  get; set; }

        public string comentariu { get; set; }

        public int rating { get; set; }

        public DateTime dataReview {  get; set; }

        public virtual User User {  get; set; }

        public virtual Postare Postare {  get; set; }
    }
}
