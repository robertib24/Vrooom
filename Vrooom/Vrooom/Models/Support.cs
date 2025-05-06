using System.ComponentModel.DataAnnotations;

namespace Vrooom.Models
{
    public class Support
    {
        [Key]
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Subiect { get; set; }
        public string Mesaj { get; set; }
        public DateTime Data { get; set; }
        public string Status { get; set; }
        public string Raspuns { get; set; }

        public int SupportId { get; set; }

        public virtual User User { get; set; }
    }
}
