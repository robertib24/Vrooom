using Vrooom.Models;
using Vrooom.Models.DTOs;
namespace Vrooom.Services.SupportServices
{
    public interface ISupportService
    {
        Task AddSupport(SupportDTO supportDTO);
        Task<IEnumerable<SupportDTO>> GetAllSupports();
        Task<IEnumerable<SupportDTO>> GetSupportByUserID(int userID);
        Task<IEnumerable<SupportDTO>> GetSupportBySupportID(int supportID);
        Task adminEmail(SupportDTO support);
        Task ReplySupport(SupportDTO supportDTO);
        Task replyEmail(SupportDTO support);
        Task UpdateSupport(Support support);
    }
}
