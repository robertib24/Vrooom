using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;
using Vrooom.Models;

namespace Vrooom.Services.UserServices
{
    public class EmailSender : IEmailSender
    {
        private readonly ISendGridClient _sendGridClient;
        private readonly SendGridSettings _sendGridSettings;
        public EmailSender(ISendGridClient sendGridClient, IOptions<SendGridSettings> sendGridSettings)
        {
            _sendGridClient = sendGridClient;
            _sendGridSettings = sendGridSettings.Value;
        }
        /// <summary>
        /// Trimite un email la adresa specificata cu un fisier de tip HTML.
        /// </summary>
        /// <param name="email">Adresa de email destinatara</param>
        /// <param name="subject">Titlul emailului</param>
        /// <param name="htmlMessage">Continutul emailului</param>
        /// <returns></returns>
        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            var msg = new SendGridMessage()
            {
                From = new EmailAddress(_sendGridSettings.SendGridEmail, _sendGridSettings.SendGridName),
                Subject = subject,
                HtmlContent = htmlMessage,
            };
            msg.AddTo(new EmailAddress(email));
            await _sendGridClient.SendEmailAsync(msg);
        }
    }
}
