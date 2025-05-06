using Microsoft.Extensions.Primitives;
using System.ComponentModel.DataAnnotations;
using Vrooom.Models;

namespace Vrooom.Models
{
    public class Review
    {
        [Key]
        public int ReviewId { get; set; }
        public int PostareId {  get; set; }

        public int UserId { get; set; }

        public string Titlu {  get; set; }

        public string Comentariu { get; set; }

        public int Rating { get; set; }

        public DateTime Data {  get; set; }

        public virtual User User {  get; set; }

        public virtual Postare Postare {  get; set; }
    }
}
