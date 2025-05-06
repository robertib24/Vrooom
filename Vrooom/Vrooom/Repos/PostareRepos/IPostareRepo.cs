using Vrooom.Models;
namespace Vrooom.Repos.PostareRepo
{
    public interface IPostareRepo
    {
        Task AddPostare(Postare p);
        Task DeletePostare(int id);
        Task<Postare> GetPostareByID(int postId);
        Task<IEnumerable<Postare>> GetPostare();
        Task<int> CountPostare();
        Task<int> NrPostareByUserID(int userId);
        Task UpdatePost(Postare p);
        Task<IEnumerable<Postare>> GetPostByTitle(string title);
        Task<IEnumerable<Postare>> GetPostByModel(string model);
        Task<IEnumerable<Postare>> GetPostByPrice(int minPrice, int maxPrice);
        Task<IEnumerable<Postare>> GetPostByKM(int minKM, int maxKM);
        Task<IEnumerable<Postare>> GetPostByYear(int minYear, int maxYear);
        Task<IEnumerable<Postare>> GetPostByFirm(string firm);
        Task<IEnumerable<Postare>> GetPostByUserID(int userId);
        Task<IEnumerable<Postare>> ExecQuery(string query);
    }
}
