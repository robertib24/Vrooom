using Vrooom.Models.DTOs;
using Vrooom.Exceptions;
using Vrooom.Models;
using Vrooom.Services;
using Vrooom.Services.GoogleServices;
using Vrooom.Repos.ChirieRepo;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Identity;

namespace Vrooom.Services.ChirieServices
{
    public class ChirieService : IChirieService
    {
        private readonly IChirieRepo _chirieRepository;
        private readonly IEmailSender _emailSender;
        private readonly UserManager<User> _userManager;
        private readonly IGoogleService _googleService;


        public ChirieService(IChirieRepo chirieRepository, IEmailSender emailSender, UserManager<User> userManager, IGoogleService googleService)
        {
            _chirieRepository = chirieRepository;
            _emailSender = emailSender;
            _userManager = userManager;
            _googleService = googleService;
        }

        public async Task<IEnumerable<ChirieDTO>> GetChirieByUserId(int userId)
        {
            try
            {
                var chirii = await _chirieRepository.GetChirieByUserId(userId);

                if (chirii == null || !chirii.Any())
                {
                    return new List<ChirieDTO>();
                }

                var result = chirii.Select(c => new ChirieDTO
                {
                    chirieId = c.ChirieId,
                    userId = c.UserId,
                    postareId = c.PostareId,
                    dataStart = c.dataStart,
                    dataStop = c.dataStop
                });

                return result;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving bookings for user {userId}: {ex.Message}");
            }
        }

        public async Task addChirie(ChirieDTO chirieDTO)
        {
            var chirie = new Chirie()
            {
                PostareId = chirieDTO.postareId,
                UserId = chirieDTO.userId,
                dataStart = chirieDTO.dataStart,
                dataStop = chirieDTO.dataStop
            };

            if (chirieDTO.userId == await _chirieRepository.UserByPostareID(chirieDTO.postareId))
            {
                throw new Exception("Nu poti inchiria o postare pusa de tine!");
            }

            await _chirieRepository.AddChirie(chirie);

            var user = await _chirieRepository.UserByID(chirie.UserId);

            TimeSpan zile = chirie.dataStop - chirie.dataStart;
            if (zile.Days == 0)
            {
                user.puncteFidelitate = user.puncteFidelitate + 1;
            }
            else
            {
                user.puncteFidelitate = user.puncteFidelitate + zile.Days;
            }

            await _chirieRepository.UpdatePuncteFid(user);
        }

        private async Task<PaymentResult> ProcessPayment(PaymentInfoDTO paymentInfo, decimal amount)
        {
            // Simulare procesare plată
            try
            {
                // Validare de bază a cardului
                if (string.IsNullOrEmpty(paymentInfo.cardNumber) || paymentInfo.cardNumber.Length != 16)
                {
                    return new PaymentResult { Success = false, ErrorMessage = "Invalid card number" };
                }

                if (string.IsNullOrEmpty(paymentInfo.cvv) || paymentInfo.cvv.Length < 3)
                {
                    return new PaymentResult { Success = false, ErrorMessage = "Invalid CVV" };
                }

                // Simulare delay pentru procesare
                await Task.Delay(1000);

                // Simulare succes (90% succes pentru testing)
                var random = new Random();
                if (random.Next(1, 11) <= 9)
                {
                    return new PaymentResult
                    {
                        Success = true,
                        TransactionId = Guid.NewGuid().ToString(),
                        ProcessedAmount = amount
                    };
                }
                else
                {
                    return new PaymentResult { Success = false, ErrorMessage = "Payment declined by bank" };
                }
            }
            catch (Exception ex)
            {
                return new PaymentResult { Success = false, ErrorMessage = $"Payment processing error: {ex.Message}" };
            }
        }
        public async Task<IEnumerable<ChirieDTO>> ChirieByDataStart(DateTime dataStart)
        {
            var c = await _chirieRepository.ChirieByDataStart(dataStart);

            if (c == null)
            {
                throw new NotFoundException($"Nu exista chirie cu aceasta data de inceput: {dataStart}.");
            }

            IEnumerable<ChirieDTO> rez;
            rez = c.Select(ch => new ChirieDTO
            {
                userId = ch.UserId,
                postareId = ch.PostareId,
                dataStart = ch.dataStart,
                dataStop = ch.dataStop
            });
            return rez;
        }

        public async Task<IEnumerable<ChirieDTO>> ChirieByDataStop(DateTime dataStop)
        {
            var c = await _chirieRepository.ChirieByDataStop(dataStop);

            if (c == null)
            {
                throw new NotFoundException($"Nu exista chirie cu aceasta data de sfarsit: {dataStop}.");
            }

            IEnumerable<ChirieDTO> rez;
            rez = c.Select(ch => new ChirieDTO
            {
                userId = ch.UserId,
                postareId = ch.PostareId,
                dataStart = ch.dataStart,
                dataStop = ch.dataStop
            });
            return rez;
        }

        public async Task<IEnumerable<ChirieDTO>> ChirieByData(DateTime dataStart, DateTime dataStop)
        {
            var c = await _chirieRepository.ChirieByData(dataStart, dataStop);

            if (c == null)
            {
                throw new NotFoundException($"Nu exista chirie cu aceasta data de sfarsit: {dataStop}.");
            }

            IEnumerable<ChirieDTO> rez;
            rez = c.Select(ch => new ChirieDTO
            {
                userId = ch.UserId,
                postareId = ch.PostareId,
                dataStart = ch.dataStart,
                dataStop = ch.dataStop
            });
            return rez;
        }

        public async Task deleteChirie(int id)
        {
            await _chirieRepository.DeleteChirie(id);
        }

        public async Task UpdateChirie(ChirieDTO chirie, int id)
        {
            var c = await _chirieRepository.ChirieByID(id);

            if (c == null)
            {
                throw new NotFoundException($"Nu exista chirie cu id-ul {id}.");
            }

            c.dataStart = chirie.dataStart;
            c.dataStop = chirie.dataStop;

            await _chirieRepository.UpdateChirie(c);
        }

        public class PaymentResult
        {
            public bool Success { get; set; }
            public string? ErrorMessage { get; set; }
            public string? TransactionId { get; set; }
            public decimal ProcessedAmount { get; set; }
        }

        public async Task rentConfirmationMail(ChirieDTO chirie)
        {
            User renter = await _chirieRepository.UserByID(chirie.userId);
            int ownerId = await _chirieRepository.UserByPostareID(chirie.postareId);
            Console.WriteLine(ownerId);
            User owner = await _chirieRepository.UserByID(ownerId);
            Postare postare = await _chirieRepository.PostareByID(chirie.postareId);

            if (postare == null || postare.adresa_formala == null || postare.adresa_formala == "")
            {
                throw new Exception();
            }

            string renterEmailHtml = await File.ReadAllTextAsync("Templates/RenterEmailTemplate.html");
            renterEmailHtml = renterEmailHtml.Replace("{{username}}", renter.UserName);
            renterEmailHtml = renterEmailHtml.Replace("{{firma}}", postare.firma);
            renterEmailHtml = renterEmailHtml.Replace("{{model}}", postare.model);
            renterEmailHtml = renterEmailHtml.Replace("{{seller}}", owner.UserName);
            renterEmailHtml = renterEmailHtml.Replace("{{data-start}}", chirie.dataStart.ToString("yyyy-MM-dd"));
            renterEmailHtml = renterEmailHtml.Replace("{{data-stop}}", chirie.dataStop.ToString("yyyy-MM-dd"));
            renterEmailHtml = renterEmailHtml.Replace("{{maps_img}}", _googleService.getLocationImageFromCoordinates(postare.latitudine, postare.longitudine));
            renterEmailHtml = renterEmailHtml.Replace("{{adresa-text}}", postare.adresa_formala)
                .Replace("{{latitudine}}", postare.latitudine.ToString()).Replace("{{longitudine}}", postare.longitudine.ToString());
            await _emailSender.SendEmailAsync(renter.Email, "Vehicul inchiriat cu succes", renterEmailHtml);

            string ownerEmailHtml = await File.ReadAllTextAsync("Templates/OwnerEmailTemplate.html");
            ownerEmailHtml = ownerEmailHtml.Replace("{{username}}", owner.UserName);
            ownerEmailHtml = ownerEmailHtml.Replace("{{cumparator}}", renter.UserName);
            ownerEmailHtml = ownerEmailHtml.Replace("{{firma}}", postare.firma);
            ownerEmailHtml = ownerEmailHtml.Replace("{{model}}", postare.model);
            ownerEmailHtml = ownerEmailHtml.Replace("{{data-start}}", chirie.dataStart.ToString("yyyy-MM-dd"));
            ownerEmailHtml = ownerEmailHtml.Replace("{{data-stop}}", chirie.dataStop.ToString("yyyy-MM-dd"));
            await _emailSender.SendEmailAsync(owner.Email, "Vehicul inchiriat cu succes", ownerEmailHtml);
        }
    }
}
