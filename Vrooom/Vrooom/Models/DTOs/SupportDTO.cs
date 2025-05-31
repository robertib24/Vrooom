namespace Vrooom.Models.DTOs
{
    public class SupportDTO
    {
        public int supportId { get; set; }
        public string titlu { get; set; }
        public string comentariu { get; set; }
        public int userId { get; set; }

        public string Status { get; set; } = "Open";
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? ResolvedAt { get; set; }
        public int? ResolvedByUserId { get; set; }
        public string? ResolvedByUserName { get; set; }
    }
}