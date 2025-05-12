using Vrooom.Models.DTOs;
namespace Vrooom.Services.PostareServices
{
    public interface IPostareService
    {
        Task<int> AddPostare(PostareDTO postareDTO);
        Task DeletePostare(int id);
        Task UpdatePostare(PostareDTO postare);
        Task<IEnumerable<PostareDTO>> getAllPostari();
        Task<IEnumerable<PostareDTO>> PostareByTitlu(String titlu);
        Task<IEnumerable<PostareDTO>> PostareByPret(int pretMinim, int pretMaxim);
        Task<IEnumerable<PostareDTO>> PostareByKm(int kmMinim, int kmMaxim);
        Task<IEnumerable<PostareDTO>> PostareByAn(int anMinim, int anMaxim);
        Task<IEnumerable<PostareDTO>> PostareByFirma(String firma);
        Task<IEnumerable<PostareDTO>> PostareByModel(String model);
        Task<int> NrPostareByUser(int userId);
        Task<IEnumerable<PostareDTO>> PostareByUserId(int userId);
        Task<PostareDTO> postareById(int id);
    }
}
