using Vrooom.Models;
namespace Vrooom.Repos.PostareRepo
{
    public interface IPostareRepo
    {
        Task addPostare(Postare p);
        Task deletePostare(int id);
        Task<Postare> getPostareByID(int postId);
        Task<IEnumerable<Postare>> getPostare();
        Task<int> CountPostare();
        Task<int> NrPostareByUserID(int userId);
        Task updatePost(Postare p);
        Task<IEnumerable<Postare>> getPostByTitle(string title);
        Task<IEnumerable<Postare>> getPostByModel(string model);
        Task<IEnumerable<Postare>> getPostByPrice(int minPrice, int maxPrice);
        Task<IEnumerable<Postare>> getPostByKM(int minKM, int maxKM);
        Task<IEnumerable<Postare>> getPostByYear(int minYear, int maxYear);
        Task<IEnumerable<Postare>> getPostByFirm(string firm);
        Task<IEnumerable<Postare>> getPostByUserID(int userId);
        Task<IEnumerable<Postare>> execQuery(string query);
    }
}
