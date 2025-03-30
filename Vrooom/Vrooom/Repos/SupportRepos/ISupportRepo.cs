using Vrooom.Models;
namespace Vrooom.Repos.SupportRepo
{
    public interface ISupportRepo
    {
        Task addSupport(Support supp);
        Task<IEnumerable<Support>> listSupport();
        Task<IEnumerable<Support>> getSupportByUserID(int userID);
        Task<IEnumerable<Support>> getSupportBySupportID(int supportID);
        Task<User> UserByID(int userID);
        Task<int> getMaxID();
    }
}
