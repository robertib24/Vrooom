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

        /// <summary>
        /// Resolve all tickets with the specified support ID
        /// </summary>
        /// <param name="supportId">The support ID to resolve</param>
        /// <param name="resolvedByUserId">The admin user ID who resolved the ticket</param>
        Task ResolveTicket(int supportId, int resolvedByUserId);
    }
}
