using Vrooom.Models;

namespace Vrooom.Repos.SupportRepo
{
    public interface ISupportRepo
    {
        Task AddSupport(Support support);
        Task<IEnumerable<Support>> GetAllSupports();
        Task<IEnumerable<Support>> GetSupportsByUserID(int userId);
        Task<Support> GetSupportByID(int id);
        Task UpdateSupport(Support support);
    }
}
