using Vrooom.Models.DTOs;
namespace Vrooom.Services.ChirieServices
{
    public interface IChirieService
    {
        Task addChirie(ChirieDTO chirieDTO);
        Task deleteChirie(int id);
        Task UpdateChirie(ChirieDTO chirie, int id);
        Task<IEnumerable<ChirieDTO>> ChirieByDataStart(DateTime dataStart);
        Task<IEnumerable<ChirieDTO>> ChirieByDataStop(DateTime dataStop);
        Task<IEnumerable<ChirieDTO>> ChirieByData(DateTime dataStart, DateTime dataStop);
        Task rentConfirmationMail(ChirieDTO chirieDTO);
    }
}
