namespace Vrooom.Models.DTOs
{
    public class CardDTO
    {
        public string Numar { get; set; }
        public string Nume { get; set; }
        public int CVV { get; set; }
        public DateTime DataExpirare { get; set; }
        public int UserId { get; set; }
    }
}
