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
                    comentariu = supportDTO.comentariu,
                    Status = "Open",
                    CreatedAt = DateTime.Now 
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

                var support = new Support
                {
                    SupportId = supportDTO.supportId,
                    UserId = supportDTO.userId,
                    titlu = supportDTO.titlu,
                    comentariu = supportDTO.comentariu,
                    Status = "InProgress", 
                    CreatedAt = DateTime.Now
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

                var s = await _supportRepository.listSupport();

                _logger.LogInformation("🗂️ Found {Count} support records in database", s.Count());

                var rez = s.Select(sup => new SupportDTO
                {
                    supportId = sup.SupportId,
                    userId = sup.UserId,
                    titlu = sup.titlu,
                    comentariu = sup.comentariu,
                    Status = sup.Status ?? "Open",
                    CreatedAt = sup.CreatedAt,
                    ResolvedAt = sup.ResolvedAt,
                    ResolvedByUserId = sup.ResolvedByUserId
                });

                var resultList = rez.ToList();
                _logger.LogInformation("📊 Returning {Count} support tickets", resultList.Count);

                return resultList;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving all support tickets");
                throw;
            }
        }

        public async Task ResolveTicket(int supportId, int resolvedByUserId)
        {
            try
            {
                _logger.LogInformation("🔧 Resolving Support ID {SupportId} by User {UserId}",
                    supportId, resolvedByUserId);

                // Get all tickets with this supportId to update their status
                var tickets = await _supportRepository.getSupportBySupportID(supportId);

                if (tickets == null || !tickets.Any())
                {
                    _logger.LogWarning("⚠️ No tickets found with Support ID {SupportId}", supportId);
                    throw new NotFoundException($"No support tickets found with ID {supportId}");
                }

                _logger.LogInformation("📋 Found {Count} tickets to resolve for Support ID {SupportId}",
                    tickets.Count(), supportId);

                // Resolve all tickets with this supportId
                await _supportRepository.ResolveTicket(supportId, resolvedByUserId);

                _logger.LogInformation("✅ Support ID {SupportId} resolved successfully by User {UserId}",
                    supportId, resolvedByUserId);

                // Send resolution email to the customer
                try
                {
                    // Find the original customer ticket (not admin replies)
                    var originalTicket = tickets.FirstOrDefault(t =>
                        t.titlu != "Admin Reply" &&
                        !string.IsNullOrEmpty(t.titlu) &&
                        t.userId != resolvedByUserId);

                    if (originalTicket != null)
                    {
                        _logger.LogInformation("📧 Sending resolution email to customer (User ID: {UserId})",
                            originalTicket.userId);

                        var resolutionEmailData = new SupportDTO
                        {
                            supportId = supportId,
                            titlu = originalTicket.titlu,
                            comentariu = "Your support ticket has been resolved. Thank you for contacting us!",
                            userId = originalTicket.userId
                        };

                        await sendResolutionEmail(resolutionEmailData);
                        _logger.LogInformation("✅ Resolution email sent successfully");
                    }
                    else
                    {
                        _logger.LogWarning("⚠️ Could not find original customer ticket for resolution email");
                    }
                }
                catch (Exception emailEx)
                {
                    _logger.LogWarning(emailEx, "⚠️ Resolution email failed (ticket was resolved): {Error}",
                        emailEx.Message);
                }
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error resolving Support ID {SupportId}", supportId);
                throw new Exception($"Failed to resolve support ticket {supportId}: {ex.Message}", ex);
            }
        }

        public async Task sendResolutionEmail(SupportDTO support)
        {
            try
            {
                _logger.LogInformation("📧 Sending resolution email for Support {SupportId} to User {UserId}",
                    support.supportId, support.userId);

                User user = await _supportRepository.UserByID(support.userId);
                if (user == null)
                {
                    _logger.LogError("❌ User {UserId} not found for resolution email", support.userId);
                    throw new Exception($"User with ID {support.userId} not found");
                }

                // Create resolution email HTML
                string resolutionEmailHtml = @"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Support Ticket Resolved</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px; 
                }
                .container { 
                    background-color: #f9f9f9; 
                    border-radius: 5px; 
                    padding: 20px; 
                    border: 1px solid #ddd; 
                }
                .header { 
                    text-align: center; 
                    padding-bottom: 10px; 
                    border-bottom: 1px solid #ddd; 
                    margin-bottom: 20px; 
                }
                .header h1 { 
                    color: #4caf50; 
                }
                .resolved { 
                    background-color: #e8f5e8; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin: 15px 0; 
                    border-left: 4px solid #4caf50; 
                }
                .footer { 
                    margin-top: 30px; 
                    font-size: 12px; 
                    text-align: center; 
                    color: #777; 
                }
                .btn {
                    display: inline-block;
                    background-color: #4caf50;
                    color: white;
                    text-decoration: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🎉 Support Ticket Resolved</h1>
                </div>
                <p>Hello, <strong>{{username}}</strong>,</p>
                <p>Great news! Your support ticket has been successfully resolved by our team.</p>
                
                <div class='resolved'>
                    <p><strong>Ticket #{{supportId}}: {{titlu}}</strong></p>
                    <p><strong>Status:</strong> ✅ Resolved</p>
                    <p><strong>Resolution Date:</strong> {{resolvedDate}}</p>
                </div>
                
                <p>Our team has addressed your concern and the issue should now be resolved. If you continue to experience any problems or have additional questions, please don't hesitate to create a new support ticket.</p>
                
                <p style='text-align: center;'>
                    <a href='http://localhost:4200/support' class='btn'>View Support Center</a>
                </p>
                
                <p>Thank you for choosing Vrooom Car Rental. We appreciate your patience and understanding.</p>
                
                <div class='footer'>
                    <p>&copy; 2025 Vrooom Car Rental. All rights reserved.</p>
                    <p>This is an automated message regarding your support ticket resolution.</p>
                </div>
            </div>
        </body>
        </html>";

                resolutionEmailHtml = resolutionEmailHtml.Replace("{{username}}", user.UserName ?? "Valued Customer");
                resolutionEmailHtml = resolutionEmailHtml.Replace("{{supportId}}", support.supportId.ToString());
                resolutionEmailHtml = resolutionEmailHtml.Replace("{{titlu}}", support.titlu ?? "Support Request");
                resolutionEmailHtml = resolutionEmailHtml.Replace("{{resolvedDate}}", DateTime.Now.ToString("MMMM dd, yyyy 'at' HH:mm"));

                string emailSubject = $"✅ Support Ticket #{support.supportId} - Resolved";
                await _emailSender.SendEmailAsync(user.Email, emailSubject, resolutionEmailHtml);

                _logger.LogInformation("✅ Resolution email sent successfully to {Email} for Support {SupportId}",
                    user.Email, support.supportId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error sending resolution email for Support {SupportId}", support.supportId);
                throw new Exception($"Failed to send resolution email: {ex.Message}", ex);
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