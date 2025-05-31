using Vrooom.Models;
using Vrooom.Models.DTOs;
namespace Vrooom.Services.SupportServices
{
    public interface ISupportService
    {
        Task AddSupport(SupportDTO supportDTO);
        Task<IEnumerable<SupportDTO>> getAllSupports();
        Task<IEnumerable<SupportDTO>> getSupportByUserId(int userId);
        Task<IEnumerable<SupportDTO>> getSupportBySupportId(int supportId);
        Task adminEmail(SupportDTO support);
        Task ReplySupport(SupportDTO supportDTO);
        Task replyEmail(SupportDTO support);

        /// <summary>
        /// Resolve a support ticket and send notification email to customer
        /// </summary>
        /// <param name="supportId">The support ID to resolve</param>
        /// <param name="resolvedByUserId">The admin user ID who resolved the ticket</param>
        Task ResolveTicket(int supportId, int resolvedByUserId);

        /// <summary>
        /// Send resolution email to customer
        /// </summary>
        /// <param name="support">Support ticket data for email</param>
        Task sendResolutionEmail(SupportDTO support);
    }
}
