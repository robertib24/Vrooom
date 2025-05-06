using Vrooom.Models.DTOs;
namespace Vrooom.Services.ChirieServices
{
    public interface IChirieService
    {
        Task AddChirie(ChirieDTO chirieDTO);
        Task DeleteChirie(int id);
        Task UpdateChirie(ChirieDTO chirie, int id);
        Task<IEnumerable<ChirieDTO>> ChirieByDataStart(DateTime dataStart);
        Task<IEnumerable<ChirieDTO>> ChirieByDataStop(DateTime dataStop);
        Task<IEnumerable<ChirieDTO>> ChirieByData(DateTime dataStart, DateTime dataStop);
        Task RentConfirmationMail(ChirieDTO chirieDTO);
    }
}
