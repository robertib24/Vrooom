using System.ComponentModel.DataAnnotations;
namespace Vrooom.Models
{
    public class Support
    {
        [Key]
        public int dummyId { get; set; }
        public int SupportId { get; set; }
        public int UserId { get; set; }
        public string titlu { get; set; }
        public string comentariu { get; set; }
        public string Status { get; set; } = "Open"; // Open, InProgress, Resolved, Closed
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? ResolvedAt { get; set; }
        public int? ResolvedByUserId { get; set; }

        public virtual User User { get; set; }
        public virtual User? ResolvedByUser { get; set; }
    }
}