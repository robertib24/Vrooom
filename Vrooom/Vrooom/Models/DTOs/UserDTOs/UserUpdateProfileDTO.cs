using System.ComponentModel.DataAnnotations;

namespace Vrooom.Models.DTOs.UserDTOs
{
    public class UserUpdateProfileDTO
    {
        [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
        public string? nume { get; set; }

        [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
        public string? prenume { get; set; }

        [Phone(ErrorMessage = "Invalid phone number format")]
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string? nrTelefon { get; set; }

        [DataType(DataType.Date)]
        public DateTime? dataNasterii { get; set; }

        public string? username { get; set; }
    }
}