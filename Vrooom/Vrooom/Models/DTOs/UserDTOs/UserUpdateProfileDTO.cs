namespace Vrooom.Models.DTOs.UserDTOs
{
    public class UserUpdateProfileDTO
    {
        public string? nume { get; set; }
        public string? prenume { get; set; }
        public string? nrTelefon { get; set; }
        public DateTime? dataNasterii { get; set; }
    }
}