namespace Vrooom.Models.DTOs
{
    public class ChirieDTO
    {
        public int chirieId { get; set; }
        public int userId { get; set; }
        public int postareId { get; set; }
        public DateTime dataStart { get; set; }
        public DateTime dataStop { get; set; }

        public PaymentInfoDTO? paymentInfo { get; set; }
        public decimal totalAmount { get; set; }
        public int totalDays { get; set; }
    }

    public class PaymentInfoDTO
    {
        public string cardNumber { get; set; } = string.Empty;
        public string expiryDate { get; set; } = string.Empty;
        public string cvv { get; set; } = string.Empty;
        public string cardName { get; set; } = string.Empty;
    }
}
