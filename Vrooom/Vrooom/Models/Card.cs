using System.ComponentModel.DataAnnotations;
using Vrooom.Models;

namespace Vrooom.Models
{
    public class Card
    {
        [Key]
        public int Id { get; set; }

        public int CardId { get; set; }
        public int UserId { get; set; }

        public string numar {  get; set; }

        public DateTime dataExpirare { get; set; }

        public string nume {  get; set; }

        public int cvv { get; set; }

        public virtual User User {  get; set; }
    }
}
