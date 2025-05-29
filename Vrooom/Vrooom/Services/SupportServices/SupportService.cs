using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Vrooom.Models.DTOs;
using Vrooom.Exceptions;
using Vrooom.Models;
using Vrooom.Repos.SupportRepo;

namespace Vrooom.Services.SupportServices
{
    public class SupportService : ISupportService
    {
        private readonly ISupportRepo _supportRepository;
        private readonly IEmailSender _emailSender;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<SupportService> _logger;

        public SupportService(ISupportRepo supportRepository, IEmailSender emailSender, UserManager<User> userManager, ILogger<SupportService> logger)
        {
            _supportRepository = supportRepository;
            _emailSender = emailSender;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task AddSupport(SupportDTO supportDTO)
        {
            try
            {
                _logger.LogInformation("🎫 Creating new support ticket for User {UserId}: {Title}",
                    supportDTO.userId, supportDTO.titlu);

                var support = new Support
                {
                    SupportId = await _supportRepository.getMaxID() + 1,
                    UserId = supportDTO.userId,
                    titlu = supportDTO.titlu,
                    comentariu = supportDTO.comentariu
                };

                _logger.LogInformation("📝 Assigned Support ID {SupportId} to new ticket", support.SupportId);

                await _supportRepository.addSupport(support);

                _logger.LogInformation("✅ Support ticket {SupportId} created successfully", support.SupportId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creating support ticket for User {UserId}", supportDTO.userId);
                throw;
            }
        }

        public async Task ReplySupport(SupportDTO supportDTO)
        {
            try
            {
                _logger.LogInformation("💬 Adding reply to Support {SupportId} from User {UserId}",
                    supportDTO.supportId, supportDTO.userId);
                _logger.LogInformation("Reply title: '{Title}', Content: '{Content}'",
                    supportDTO.titlu,
                    supportDTO.comentariu.Length > 100 ? supportDTO.comentariu.Substring(0, 100) + "..." : supportDTO.comentariu);

                var support = new Support
                {
                    SupportId = supportDTO.supportId,
                    UserId = supportDTO.userId,
                    titlu = supportDTO.titlu,
                    comentariu = supportDTO.comentariu
                };

                await _supportRepository.addSupport(support);

                _logger.LogInformation("✅ Reply added successfully to Support {SupportId}", supportDTO.supportId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error adding reply to Support {SupportId} from User {UserId}",
                    supportDTO.supportId, supportDTO.userId);
                throw;
            }
        }

        public async Task<IEnumerable<SupportDTO>> getAllSupports()
        {
            try
            {
                _logger.LogInformation("📋 Retrieving all support tickets");

                IEnumerable<SupportDTO> rez;
                var s = await _supportRepository.listSupport();

                _logger.LogInformation("🗂️ Found {Count} support records in database", s.Count());

                rez = s.Select(sup => new SupportDTO
                {
                    supportId = sup.SupportId,
                    userId = sup.UserId,
                    titlu = sup.titlu,
                    comentariu = sup.comentariu
                });

                var resultList = rez.ToList();
                _logger.LogInformation("📊 Returning {Count} support tickets", resultList.Count);

                // Log sample of tickets for debugging
                foreach (var ticket in resultList.Take(5))
                {
                    _logger.LogInformation("Sample ticket {SupportId}: '{Title}' from User {UserId}",
                        ticket.supportId, ticket.titlu, ticket.userId);
                }

                return resultList;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving all support tickets");
                throw;
            }
        }

        public async Task<IEnumerable<SupportDTO>> getSupportByUserId(int userId)
        {
            try
            {
                _logger.LogInformation("🔍 Retrieving support tickets for User {UserId}", userId);

                IEnumerable<Support> s = null;

                User u = await _userManager.FindByIdAsync(userId.ToString());
                if (u == null)
                {
                    _logger.LogWarning("⚠️ User {UserId} not found", userId);
                    throw new NotFoundException($"User with ID {userId} not found");
                }

                _logger.LogInformation("👤 User {UserId} found: {Username}, Role check...", userId, u.UserName);

                if (await _userManager.IsInRoleAsync(u, "Admin"))
                {
                    _logger.LogInformation("🔑 User {UserId} is Admin, retrieving all tickets", userId);
                    s = await _supportRepository.listSupport();
                }
                else
                {
                    _logger.LogInformation("👥 User {UserId} is regular user, retrieving their tickets only", userId);
                    s = await _supportRepository.getSupportByUserID(userId);
                }

                if (s == null || !s.Any())
                {
                    _logger.LogInformation("📭 No support tickets found for User {UserId}", userId);
                    return new List<SupportDTO>();
                }

                _logger.LogInformation("📊 Found {Count} support records for User {UserId}", s.Count(), userId);

                IEnumerable<SupportDTO> rez;
                rez = s.Select(sup => new SupportDTO
                {
                    supportId = sup.SupportId,
                    userId = sup.UserId,
                    titlu = sup.titlu,
                    comentariu = sup.comentariu
                });

                var resultList = rez.ToList();

                // Log details of each ticket for debugging
                foreach (var ticket in resultList)
                {
                    _logger.LogInformation("Ticket {SupportId}: '{Title}' from User {UserId} - {ContentPreview}",
                        ticket.supportId, ticket.titlu, ticket.userId,
                        ticket.comentariu.Length > 50 ? ticket.comentariu.Substring(0, 50) + "..." : ticket.comentariu);
                }

                return resultList;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving support tickets for User {UserId}", userId);
                throw;
            }
        }

        public async Task<IEnumerable<SupportDTO>> getSupportBySupportId(int supportId)
        {
            try
            {
                _logger.LogInformation("🗂️ Retrieving conversation for Support ID {SupportId}", supportId);

                var s = await _supportRepository.getSupportBySupportID(supportId);

                if (s == null || !s.Any())
                {
                    _logger.LogInformation("📭 No messages found for Support ID {SupportId}", supportId);
                    return new List<SupportDTO>();
                }

                _logger.LogInformation("💬 Found {Count} messages for Support ID {SupportId}", s.Count(), supportId);

                IEnumerable<SupportDTO> rez;
                rez = s.Select(sup => new SupportDTO
                {
                    supportId = sup.SupportId,
                    userId = sup.UserId,
                    titlu = sup.titlu,
                    comentariu = sup.comentariu
                });

                var resultList = rez.ToList();

                // Log each message in the conversation
                foreach (var message in resultList)
                {
                    _logger.LogInformation("Message in {SupportId}: '{Title}' from User {UserId} - {ContentPreview}",
                        message.supportId, message.titlu, message.userId,
                        message.comentariu.Length > 50 ? message.comentariu.Substring(0, 50) + "..." : message.comentariu);
                }

                return resultList;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving conversation for Support ID {SupportId}", supportId);
                throw;
            }
        }

        public async Task replyEmail(SupportDTO support)
        {
            try
            {
                _logger.LogInformation("📧 Sending reply email for Support {SupportId} to User {UserId}",
                    support.supportId, support.userId);

                User u = await _supportRepository.UserByID(support.userId);
                string clientEmailHtml = await File.ReadAllTextAsync("Templates/ClientSupportEmailTemplate.html");
                clientEmailHtml = clientEmailHtml.Replace("{{titlu}}", support.titlu.ToString())
                    .Replace("{{username}}", u.UserName.ToString())
                    .Replace("{{link-ticket}}", "http://localhost:4200/ticket?id=" + support.supportId.ToString());

                await _emailSender.SendEmailAsync(u.Email, "Support", clientEmailHtml);

                _logger.LogInformation("✅ Reply email sent successfully to {Email} for Support {SupportId}",
                    u.Email, support.supportId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error sending reply email for Support {SupportId}", support.supportId);
                throw;
            }
        }

        public async Task adminEmail(SupportDTO support)
        {
            try
            {
                _logger.LogInformation("📧 Sending admin email for Support {SupportId} to User {UserId}",
                    support.supportId, support.userId);

                User user = await _supportRepository.UserByID(support.userId);
                string clientEmailHtml = await File.ReadAllTextAsync("Templates/AdminSupportEmailTemplate.html");
                clientEmailHtml = clientEmailHtml.Replace("{{titlu}}", support.titlu.ToString());
                clientEmailHtml = clientEmailHtml.Replace("{{username}}", user.UserName.ToString());
                clientEmailHtml = clientEmailHtml.Replace("{{comentariu}}", support.comentariu.ToString());

                await _emailSender.SendEmailAsync(user.Email, "Support", clientEmailHtml);

                _logger.LogInformation("✅ Admin email sent successfully to {Email} for Support {SupportId}",
                    user.Email, support.supportId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error sending admin email for Support {SupportId}", support.supportId);
                throw;
            }
        }
    }
}