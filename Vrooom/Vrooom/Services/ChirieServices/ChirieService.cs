using Vrooom.Models;
using Vrooom.Models.DTOs;
using Vrooom.Repos.ChirieRepos;
using Vrooom.Exceptions;

namespace Vrooom.Services.ChirieServices
{
    public class ChirieService : IChirieService
    {
        private readonly IChirieRepo _chirieRepository;

        public ChirieService(IChirieRepo chirieRepository)
        {
            _chirieRepository = chirieRepository;
        }

        public async Task AddChirie(ChirieDTO chirieDTO)
        {
            // ✅ Validare simplă a datelor
            if (chirieDTO.DataStop <= chirieDTO.DataStart)
                throw new Exception("Data de încheiere trebuie să fie după data de început.");

            if (chirieDTO.UserId <= 0 || chirieDTO.PostareId <= 0)
                throw new Exception("UserId sau PostareId invalid.");

            // ✅ Verificare dacă mașina este deja închiriată în acel interval
            var suprapuneri = await _chirieRepository.ChiriiByData(chirieDTO.DataStart, chirieDTO.DataStop);
            bool exista = suprapuneri.Any(c => c.MasinaId == chirieDTO.MasinaId);
            if (exista)
                throw new Exception("Mașina este deja închiriată în intervalul selectat.");

            var chirie = new Chirie
            {
                DataStart = chirieDTO.DataStart,
                DataStop = chirieDTO.DataStop,
                UserId = chirieDTO.UserId,
                MasinaId = chirieDTO.MasinaId
            };

            await _chirieRepository.AddChirie(chirie);

            // ✅ Log informativ
            Console.WriteLine($"[INFO] Chirie adăugată: UserId={chirie.UserId}, MasinaId={chirie.MasinaId}, {chirie.DataStart:dd.MM.yyyy} - {chirie.DataStop:dd.MM.yyyy}");
        }

        public async Task DeleteChirie(int id)
        {
            await _chirieRepository.DeleteChirie(id);
            Console.WriteLine($"[INFO] Chirie cu ID={id} a fost ștearsă.");
        }

        public async Task UpdateChirie(ChirieDTO chirieDTO, int id)
        {
            var chirie = await _chirieRepository.ChirieByID(id);

            if (chirie is null)
                throw new NotFoundException($"Nu exista chirie cu id-ul {id}.");

            chirie.DataStart = chirieDTO.DataStart;
            chirie.DataStop = chirieDTO.DataStop;
            chirie.UserId = chirieDTO.UserId;
            chirie.MasinaId = chirieDTO.MasinaId;

            await _chirieRepository.UpdateChirie(chirie);

            Console.WriteLine($"[INFO] Chirie actualizată: ID={id}, UserId={chirie.UserId}, MasinaId={chirie.MasinaId}");
        }

        public async Task<IEnumerable<ChirieDTO>> ChirieByDataStart(DateTime dataStart)
        {
            var chirii = await _chirieRepository.ChiriiByDataStart(dataStart);
            return chirii.Select(c => new ChirieDTO
            {
                DataStart = c.DataStart,
                DataStop = c.DataStop,
                UserId = c.UserId,
                MasinaId = c.MasinaId
            });
        }

        public async Task<IEnumerable<ChirieDTO>> ChirieByDataStop(DateTime dataStop)
        {
            var chirii = await _chirieRepository.ChiriiByDataStop(dataStop);
            return chirii.Select(c => new ChirieDTO
            {
                DataStart = c.DataStart,
                DataStop = c.DataStop,
                UserId = c.UserId,
                MasinaId = c.MasinaId
            });
        }

        public async Task<IEnumerable<ChirieDTO>> ChirieByData(DateTime dataStart, DateTime dataStop)
        {
            var chirii = await _chirieRepository.ChiriiByData(dataStart, dataStop);
            return chirii.Select(c => new ChirieDTO
            {
                DataStart = c.DataStart,
                DataStop = c.DataStop,
                UserId = c.UserId,
                MasinaId = c.MasinaId
            });
        }

        public async Task RentConfirmationMail(ChirieDTO chirieDTO)
        {
            Console.WriteLine($"[EMAIL] Email de confirmare pentru chirie: UserId={chirieDTO.UserId} -> MasinaId={chirieDTO.MasinaId}");
            await Task.CompletedTask;
        }
    }
}
