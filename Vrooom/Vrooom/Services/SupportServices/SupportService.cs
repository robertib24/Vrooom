using Vrooom.Models;
using Vrooom.Models.DTOs;
using Vrooom.Repos.SupportRepo;
using Vrooom.Exceptions;

namespace Vrooom.Services.SupportServices
{
    public class SupportService : ISupportService
    {
        private readonly ISupportRepo _supportRepo;

        public SupportService(ISupportRepo supportRepo)
        {
            _supportRepo = supportRepo;
        }

        public async Task AddSupport(SupportDTO supportDTO)
        {
            var support = new Support
            {
                UserId = supportDTO.UserId,
                Subiect = supportDTO.Subiect,
                Mesaj = supportDTO.Mesaj,
                Data = DateTime.Now,
                Status = "In asteptare",
                Raspuns = null
            };

            await _supportRepo.AddSupport(support);
        }

        public async Task<IEnumerable<SupportDTO>> GetAllSupports()
        {
            var supports = await _supportRepo.GetAllSupports();
            return supports.Select(MapToDTO);
        }

        public async Task<IEnumerable<SupportDTO>> GetSupportByUserID(int userID)
        {
            var supports = await _supportRepo.GetSupportsByUserID(userID);
            return supports.Select(MapToDTO);
        }

        public async Task<IEnumerable<SupportDTO>> GetSupportBySupportID(int supportID)
        {
            var support = await _supportRepo.GetSupportByID(supportID);
            return support != null ? new[] { MapToDTO(support) } : Enumerable.Empty<SupportDTO>();
        }

        public Task adminEmail(SupportDTO support)
        {
            Console.WriteLine($"[EMAIL ADMIN] Subiect: {support.Subiect} | Mesaj: {support.Mesaj}");
            return Task.CompletedTask;
        }

        public async Task ReplySupport(SupportDTO supportDTO)
        {
            var support = await _supportRepo.GetSupportByID(supportDTO.Id);
            if (support == null)
                throw new NotFoundException($"Ticket-ul cu ID {supportDTO.Id} nu a fost găsit.");

            support.Raspuns = supportDTO.Raspuns;
            support.Status = "Rezolvat";
            await _supportRepo.UpdateSupport(support);
        }

        public Task replyEmail(SupportDTO support)
        {
            Console.WriteLine($"[EMAIL RĂSPUNS] Către User {support.UserId}: {support.Raspuns}");
            return Task.CompletedTask;
        }

        public async Task UpdateSupport(Support support)
        {
            var existing = await _supportRepo.GetSupportByID(support.Id);
            if (existing == null)
                throw new NotFoundException($"Support cu ID {support.Id} nu există.");

            existing.Subiect = support.Subiect;
            existing.Mesaj = support.Mesaj;
            existing.Raspuns = support.Raspuns;
            existing.Status = support.Status;
            existing.Data = DateTime.Now;

            await _supportRepo.UpdateSupport(existing);
        }

        private static SupportDTO MapToDTO(Support s) => new SupportDTO
        {
            Id = s.Id,
            UserId = s.UserId,
            Subiect = s.Subiect,
            Mesaj = s.Mesaj,
            Data = s.Data,
            Status = s.Status,
            Raspuns = s.Raspuns
        };
    }
}
