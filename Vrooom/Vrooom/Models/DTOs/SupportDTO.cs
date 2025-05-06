namespace Vrooom.Models.DTOs
{
    public class SupportDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Subiect { get; set; }
        public string Mesaj { get; set; }
        public DateTime Data { get; set; }
        public string Status { get; set; }
        public string Raspuns { get; set; }
    }
}
