using Vrooom.Models;
namespace Vrooom.Repos.ChirieRepo
{
    public interface IChirieRepo
    {
        Task AddChirie(Chirie c);
        Task DeleteChirie(int id);
        Task<Chirie> ChirieByID(int id);
        Task<IEnumerable<Chirie>> GetChirieByUserId(int userId);
        Task UpdateChirie(Chirie c);
        Task<IEnumerable<Chirie>> ChirieByDataStart(DateTime dataStart);
        Task<IEnumerable<Chirie>> ChirieByDataStop(DateTime dataStop);
        Task<IEnumerable<Chirie>> ChirieByData(DateTime dataStart, DateTime dataStop);
        Task<User> UserByID(int id);
        Task UpdatePuncteFid(User u);
        Task<int> UserByPostareID(int idPost);
        Task<Postare> PostareByID(int id);
    }
}
