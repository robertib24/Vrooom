using Vrooom.Models.DTOs;
namespace Vrooom.Services.PostareServices
{
    public interface IPostareService
    {
        Task<int> addPostare(PostareDTO postareDTO);
        Task deletePostare(int id);
        Task UpdatePostare(PostareDTO postare);
        Task<IEnumerable<PostareDTO>> getAllPosts();
        Task<IEnumerable<PostareDTO>> PostByTitle(String title);
        Task<IEnumerable<PostareDTO>> PostByPrice(int minPrice, int maxPrice);
        Task<IEnumerable<PostareDTO>> PostByKM(int minKM, int maxKM);
        Task<IEnumerable<PostareDTO>> PostByYear(int minYear, int maxYear);
        Task<IEnumerable<PostareDTO>> PostByModel(String model);
        Task<IEnumerable<PostareDTO>> PostByUserID(int userID);
        Task<IEnumerable<PostareDTO>> PostByFirma(String firma);
        Task<int> postNumberByUserID(int userID);
        Task<PostareDTO> PostByID(int id);
    }
}
