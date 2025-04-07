using Vrooom.Models;
using Vrooom.Models.DTOs;
namespace Vrooom.Services.SupportServices
{
    public interface ISupportService
    {
        Task addSupport(SupportDTO supp);
        Task<IEnumerable<SupportDTO>> getAllSupports();
        Task<IEnumerable<SupportDTO>> getSupportByUserID(int userID);
        Task<IEnumerable<SupportDTO>> getSupportBySupportID(int supportID);
        Task adminEmail(SupportDTO support);
        Task ReplySupport(SupportDTO supportDTO);
        Task replyEmail(SupportDTO support);

    }
}
