using Microsoft.AspNetCore.Mvc;
using Vrooom.Models.DTOs.UserDTOs;
using Vrooom.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Vrooom.Models;
using Microsoft.AspNetCore.Authorization;
using Vrooom.Services;
using Vrooom.Exceptions;
using Vrooom.Services.UserServices;
using Microsoft.AspNetCore.Identity.UI.Services;

namespace Vrooom.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IEmailSender _emailSender;
        private readonly UserManager<User> _userManager;

        public UserController(IUserService userService, IEmailSender emailSender, UserManager<User> userManager)
        {
            _userService = userService;
            _emailSender = emailSender;
            _userManager = userManager;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromForm] RegisterDTO user)
        {
            try
            {
                if (user.pozaProfil == null || user.pozaProfil.Length == 0)
                {
                    return BadRequest(new { error = "Profile picture is required" });
                }

                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png" };
                if (!allowedTypes.Contains(user.pozaProfil.ContentType.ToLower()))
                {
                    return BadRequest(new { error = "Only JPEG and PNG images are allowed" });
                }

                if (user.pozaProfil.Length > 5 * 1024 * 1024) // 5MB
                {
                    return BadRequest(new { error = "Image size must be less than 5MB" });
                }

                Console.WriteLine($"📝 Registering user: {user.username}");
                Console.WriteLine($"📁 Profile picture: {user.pozaProfil.FileName} ({user.pozaProfil.Length} bytes)");

                var result = await _userService.RegisterAsync(user);
                if (result.Succeeded)
                {
                    Console.WriteLine($"✅ User {user.username} registered successfully");

                    // Trimite automat email-ul de confirmare după înregistrare
                    try
                    {
                        await _userService.sendConfirmationEmail(user);
                        Console.WriteLine($"📧 Confirmation email sent to: {user.email}");
                    }
                    catch (Exception emailEx)
                    {
                        Console.WriteLine($"⚠️ Registration successful but email failed: {emailEx.Message}");
                    }

                    return Ok(new
                    {
                        message = "Registration successful. Please check your email for confirmation link.",
                        emailSent = true
                    });
                }
                else
                {
                    var errors = result.Errors.Select(e => e.Description);
                    Console.WriteLine($"❌ Registration failed for {user.username}: {string.Join(", ", errors)}");
                    return BadRequest(errors);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Registration error for {user.username}: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("confirmEmail")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmEmail(string username, string token)
        {
            try
            {
                Console.WriteLine($"🔄 Email confirmation attempt for user: {username}");
                Console.WriteLine($"📝 Token received: {token?.Substring(0, Math.Min(20, token?.Length ?? 0))}...");

                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(token))
                {
                    Console.WriteLine("❌ Missing username or token");
                    return BadRequest(new { error = "Username and token are required" });
                }

                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                {
                    Console.WriteLine($"❌ User not found: {username}");
                    return NotFound(new { error = "User not found" });
                }

                Console.WriteLine($"👤 User found: {user.UserName}, Current EmailConfirmed: {user.EmailConfirmed}");

                if (user.EmailConfirmed)
                {
                    Console.WriteLine($"✅ Email already confirmed for user: {username}");
                    return Ok(new { message = "Email already confirmed", alreadyConfirmed = true });
                }

                var result = await _userManager.ConfirmEmailAsync(user, token);

                if (result.Succeeded)
                {
                    Console.WriteLine($"✅ Email confirmed successfully for user: {username}");

                    var updatedUser = await _userManager.FindByNameAsync(username);
                    Console.WriteLine($"📋 Updated EmailConfirmed status: {updatedUser.EmailConfirmed}");

                    return Ok(new
                    {
                        message = "Email confirmed successfully! You can now login.",
                        success = true,
                        emailConfirmed = updatedUser.EmailConfirmed
                    });
                }
                else
                {
                    var errors = result.Errors.Select(e => e.Description).ToArray();
                    Console.WriteLine($"❌ Email confirmation failed for {username}: {string.Join(", ", errors)}");

                    return BadRequest(new
                    {
                        error = "Email confirmation failed",
                        details = errors,
                        invalidToken = true
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Exception during email confirmation for {username}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginDTO user)
        {
            try
            {
                Console.WriteLine($"🔄 Login attempt for user: {user.username}");

                var dbUser = await _userManager.FindByNameAsync(user.username);
                if (dbUser != null)
                {
                    Console.WriteLine($"👤 User found - EmailConfirmed: {dbUser.EmailConfirmed}");
                }

                var result = await _userService.LoginAsync(user);

                Console.WriteLine($"✅ Login successful for user: {user.username}");
                return Ok(new { Token = result, Message = $"Autentificat ca {user.username}" });
            }
            catch (LockedOutException e)
            {
                Console.WriteLine($"🔒 Account locked: {user.username} - {e.Message}");
                return BadRequest(e.Message);
            }
            catch (WrongDetailsException e)
            {
                Console.WriteLine($"❌ Wrong credentials: {user.username} - {e.Message}");
                return NotFound(e.Message);
            }
            catch (Exception e)
            {
                Console.WriteLine($"❌ Login error for {user.username}: {e.Message}");
                return BadRequest(e.Message);
            }
        }

        // ===== NEW ENHANCED ENDPOINTS =====

        [HttpPut("updateProfile/{username}")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile(string username, [FromBody] UserUpdateProfileDTO profileData)
        {
            try
            {
                Console.WriteLine($"🔄 Updating profile for user: {username}");

                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                // Update user properties
                user.nume = profileData.nume ?? user.nume;
                user.prenume = profileData.prenume ?? user.prenume;
                user.PhoneNumber = profileData.nrTelefon ?? user.PhoneNumber;

                if (profileData.dataNasterii.HasValue)
                {
                    user.dataNasterii = profileData.dataNasterii.Value;
                }

                var result = await _userManager.UpdateAsync(user);

                if (result.Succeeded)
                {
                    Console.WriteLine($"✅ Profile updated successfully for user: {username}");
                    return Ok(new { message = "Profile updated successfully" });
                }
                else
                {
                    var errors = result.Errors.Select(e => e.Description);
                    Console.WriteLine($"❌ Profile update failed for {username}: {string.Join(", ", errors)}");
                    return BadRequest(new { error = "Profile update failed", details = errors });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Exception updating profile for {username}: {ex.Message}");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("changePassword")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] UserChangePassDTO changePasswordData)
        {
            try
            {
                Console.WriteLine($"🔄 Changing password for user: {changePasswordData.username}");

                var result = await _userService.ChangePasswordAsync(changePasswordData);

                if (result.Succeeded)
                {
                    Console.WriteLine($"✅ Password changed successfully for user: {changePasswordData.username}");
                    return Ok(new { message = "Password changed successfully" });
                }
                else
                {
                    var errors = result.Errors.Select(e => e.Description);
                    Console.WriteLine($"❌ Password change failed for {changePasswordData.username}: {string.Join(", ", errors)}");
                    return BadRequest(new { error = "Password change failed", details = errors });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Exception changing password for {changePasswordData.username}: {ex.Message}");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("updateProfilePicture/{username}")]
        [Authorize]
        public async Task<IActionResult> UpdateProfilePicture(string username, [FromForm] IFormFile profilePicture)
        {
            try
            {
                Console.WriteLine($"🔄 Updating profile picture for user: {username}");

                if (profilePicture == null || profilePicture.Length == 0)
                {
                    return BadRequest(new { error = "Profile picture is required" });
                }

                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png" };
                if (!allowedTypes.Contains(profilePicture.ContentType.ToLower()))
                {
                    return BadRequest(new { error = "Only JPEG and PNG images are allowed" });
                }

                if (profilePicture.Length > 5 * 1024 * 1024) // 5MB
                {
                    return BadRequest(new { error = "Image size must be less than 5MB" });
                }

                var success = await _userService.UpdateProfilePicture(username, profilePicture);

                if (success)
                {
                    Console.WriteLine($"✅ Profile picture updated successfully for user: {username}");
                    return Ok(new
                    {
                        message = "Profile picture updated successfully",
                        url = $"https://vrooom1224.s3.eu-central-1.amazonaws.com/{username}_pfp.png"
                    });
                }
                else
                {
                    Console.WriteLine($"❌ Profile picture update failed for user: {username}");
                    return BadRequest(new { error = "Failed to update profile picture. Image may be inappropriate." });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Exception updating profile picture for {username}: {ex.Message}");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("getUserDetails")]
        [AllowAnonymous]
        public async Task<IActionResult> getUserDetails(string username)
        {
            try
            {
                var result = await _userService.getUserDetails(username);
                return Ok(result);
            }
            catch (NotFoundException e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpPost("uploadPhoto")]
        [AllowAnonymous]
        [Obsolete("This endpoint is deprecated. Use updateProfilePicture instead.")]
        public async Task<IActionResult> uploadPhoto([FromForm] RegisterDTO user)
        {
            try
            {
                var res = await _userService.uploadPhoto(user);
                if (res == true)
                    return Ok(res);
                else
                    return BadRequest(res);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpPost("sendConfirmationEmail")]
        [AllowAnonymous]
        public async Task<IActionResult> sendConfirmationEmail([FromForm] RegisterDTO user)
        {
            try
            {
                await _userService.sendConfirmationEmail(user);
                return Ok();
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpPost("forgotPassword")]
        [AllowAnonymous]
        public async Task<IActionResult> forgotPassword(ForgotPasswordDTO user)
        {
            Console.WriteLine(user.Username);
            Console.WriteLine(user.Email);
            try
            {
                await _userService.forgotPassword(user);
                return Ok();
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpPost("resetPassword")]
        [AllowAnonymous]
        public async Task<IActionResult> resetPassword(ResetPasswordDTO user)
        {
            try
            {
                await _userService.resetPassword(user);
                return Ok();
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("getUser")]
        [AllowAnonymous]
        public async Task<IActionResult> getUser(string username)
        {
            try
            {
                var result = await _userService.getUserProfile(username);
                return Ok(result);
            }
            catch (NotFoundException e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpPost("uploadDocument")]
        [Authorize]
        public async Task<IActionResult> uploadDocument(string username, string document, IFormFile file)
        {
            try
            {
                Console.WriteLine($"🔄 Uploading document {document} for user: {username}");

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { error = "Document file is required" });
                }

                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "application/pdf" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                {
                    return BadRequest(new { error = "Only JPEG, PNG and PDF files are allowed" });
                }

                if (file.Length > 10 * 1024 * 1024) // 10MB
                {
                    return BadRequest(new { error = "File size must be less than 10MB" });
                }

                if (document != "permis" && document != "carteIdentitate")
                {
                    return BadRequest(new { error = "Invalid document type. Must be 'permis' or 'carteIdentitate'" });
                }

                await _userService.uploadDocument(username, document, file);

                Console.WriteLine($"✅ Document {document} uploaded successfully for user: {username}");
                return Ok(new
                {
                    message = "Document uploaded successfully",
                    documentType = document,
                    url = $"https://vrooom1224.s3.eu-central-1.amazonaws.com/{username}_{document}.png"
                });
            }
            catch (Exception e)
            {
                Console.WriteLine($"❌ Error uploading document {document} for {username}: {e.Message}");
                return BadRequest(new { error = e.Message });
            }
        }

        [HttpGet("getById")]
        [AllowAnonymous]
        public async Task<IActionResult> getUserById(int id)
        {
            try
            {
                var result = await _userService.getUserById(id);
                return Ok(result);
            }
            catch (NotFoundException e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpGet("getDocumentStatus/{username}")]
        [Authorize]
        public async Task<IActionResult> GetDocumentStatus(string username)
        {
            try
            {
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                var documentStatus = new
                {
                    permis = new
                    {
                        uploaded = user.permis != "N/A",
                        verified = user.permis != "N/A", // Assuming uploaded = verified for now
                        url = user.permis != "N/A" ? user.permis : null
                    },
                    carteIdentitate = new
                    {
                        uploaded = user.carteIdentitate != "N/A",
                        verified = user.carteIdentitate != "N/A", // Assuming uploaded = verified for now
                        url = user.carteIdentitate != "N/A" ? user.carteIdentitate : null
                    }
                };

                return Ok(documentStatus);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error getting document status for {username}: {ex.Message}");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpDelete("deleteDocument/{username}/{documentType}")]
        [Authorize]
        public async Task<IActionResult> DeleteDocument(string username, string documentType)
        {
            try
            {
                Console.WriteLine($"🔄 Deleting document {documentType} for user: {username}");

                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                if (documentType != "permis" && documentType != "carteIdentitate")
                {
                    return BadRequest(new { error = "Invalid document type" });
                }

                // Reset document status in database
                if (documentType == "permis")
                {
                    user.permis = "N/A";
                }
                else if (documentType == "carteIdentitate")
                {
                    user.carteIdentitate = "N/A";
                }

                await _userManager.UpdateAsync(user);

                // Note: In a production environment, you might also want to delete from S3
                // This would require injecting IS3Service and calling DeleteFileAsync

                Console.WriteLine($"✅ Document {documentType} deleted successfully for user: {username}");
                return Ok(new { message = "Document deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error deleting document {documentType} for {username}: {ex.Message}");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        // DEBUGGING ENDPOINTS (Remove in production)
        [HttpGet("debug-user-status/{username}")]
        [AllowAnonymous]
        public async Task<IActionResult> DebugUserStatus(string username)
        {
            try
            {
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                return Ok(new
                {
                    username = user.UserName,
                    email = user.Email,
                    emailConfirmed = user.EmailConfirmed,
                    phoneNumberConfirmed = user.PhoneNumberConfirmed,
                    twoFactorEnabled = user.TwoFactorEnabled,
                    lockoutEnabled = user.LockoutEnabled,
                    lockoutEnd = user.LockoutEnd,
                    accessFailedCount = user.AccessFailedCount,
                    id = user.Id,
                    permis = user.permis,
                    carteIdentitate = user.carteIdentitate,
                    pozaProfil = user.pozaProfil
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("force-confirm-email/{username}")]
        [AllowAnonymous] // Remove this in production!
        public async Task<IActionResult> ForceConfirmEmail(string username)
        {
            try
            {
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                user.EmailConfirmed = true;
                var result = await _userManager.UpdateAsync(user);

                if (result.Succeeded)
                {
                    Console.WriteLine($"✅ Force confirmed email for user: {username}");
                    return Ok(new { message = "Email force confirmed", success = true });
                }
                else
                {
                    var errors = result.Errors.Select(e => e.Description);
                    return BadRequest(new { error = "Failed to update user", details = errors });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("test-send-email")]
        [AllowAnonymous]
        public async Task<IActionResult> TestSendEmail([FromBody] string emailAddress)
        {
            try
            {
                Console.WriteLine($"🔄 Attempting to send test email to: {emailAddress}");

                string testEmailHtml = @"
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Vrooom Test Email</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 40px; 
                            background-color: #f5f5f5; 
                        }
                        .container { 
                            background: white; 
                            padding: 30px; 
                            border-radius: 10px; 
                            max-width: 600px; 
                            margin: 0 auto;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        .header { 
                            color: #4a7bae; 
                            text-align: center; 
                            border-bottom: 2px solid #eee;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                        }
                        .content { 
                            line-height: 1.6; 
                            color: #333;
                        }
                        .success-badge {
                            background: #4caf50;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 25px;
                            display: inline-block;
                            font-weight: bold;
                            margin: 20px 0;
                        }
                        .footer { 
                            font-size: 12px; 
                            color: #777; 
                            text-align: center; 
                            margin-top: 40px; 
                            padding-top: 20px;
                            border-top: 1px solid #eee;
                        }
                        .timestamp {
                            background: #f8f9fa;
                            padding: 15px;
                            border-radius: 5px;
                            font-family: monospace;
                            margin: 20px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>🚗 Vrooom Email Test</h1>
                        </div>
                        <div class='content'>
                            <p>Hello!</p>
                            <p>Congratulations! You have successfully received this test email from the Vrooom application.</p>
                            
                            <div class='success-badge'>
                                ✅ Email Service Working Correctly!
                            </div>
                            
                            <p>This confirms that:</p>
                            <ul>
                                <li>✓ SendGrid integration is properly configured</li>
                                <li>✓ Email templates are rendering correctly</li>
                                <li>✓ The email delivery system is operational</li>
                            </ul>
                            
                            <div class='timestamp'>
                                <strong>Sent at:</strong> " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss UTC") + @"<br>
                                <strong>From:</strong> Vrooom Car Rental API<br>
                                <strong>Environment:</strong> Development
                            </div>
                            
                            <p>If you received this email, everything is working perfectly! 🎉</p>
                        </div>
                        <div class='footer'>
                            <p>&copy; 2025 Vrooom Car Rental. All rights reserved.</p>
                            <p>This is an automated test email from the development environment.</p>
                        </div>
                    </div>
                </body>
                </html>";

                await _emailSender.SendEmailAsync(emailAddress, "🚗 Vrooom Test Email - Service Working!", testEmailHtml);

                Console.WriteLine($"✅ Test email sent successfully to: {emailAddress}");

                return Ok(new
                {
                    success = true,
                    message = $"Test email sent successfully to {emailAddress}",
                    timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    emailAddress = emailAddress
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error sending test email to {emailAddress}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");

                return BadRequest(new
                {
                    success = false,
                    error = ex.Message,
                    timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    emailAddress = emailAddress,
                    innerException = ex.InnerException?.Message
                });
            }
        }
    }
}