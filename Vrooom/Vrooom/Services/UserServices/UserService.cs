using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Web;
using Vrooom.Exceptions;
using Vrooom.Models.DTOs.UserDTOs;
using Vrooom.Models.Enum;
using Vrooom.Models;
using Vrooom.Services.OpenAIServices;
using Vrooom.Services.S3Services;
using Vrooom.Repos.PostareRepo;

namespace Vrooom.Services.UserServices
{
    public class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IEmailSender _emailSender;
        private readonly IS3Service _s3Service;
        private readonly IPostareRepo _postareRepository;
        private readonly IOpenAIService _openAIService;
        private readonly ILogger<UserService> _logger;

        public UserService(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IOpenAIService openAIService,
            IS3Service s3Service,
            IEmailSender emailSender,
            IPostareRepo postareRepository,
            ILogger<UserService> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _s3Service = s3Service;
            _emailSender = emailSender;
            _postareRepository = postareRepository;
            _openAIService = openAIService;
            _logger = logger;
        }

        public async Task ConfirmEmail(string username, string token)
        {
            try
            {
                _logger.LogInformation($"🔄 Attempting email confirmation for user: {username}");

                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                {
                    _logger.LogWarning($"❌ User not found: {username}");
                    throw new NotFoundException("User not found");
                }

                _logger.LogInformation($"👤 User found: {user.UserName}, Current EmailConfirmed: {user.EmailConfirmed}");

                // Decode the token if it's URL encoded
                var decodedToken = HttpUtility.UrlDecode(token);
                _logger.LogInformation($"📝 Original token length: {token?.Length}, Decoded token length: {decodedToken?.Length}");

                var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

                if (result.Succeeded)
                {
                    _logger.LogInformation($"✅ Email confirmed successfully for user: {username}");

                    // Verify the confirmation was saved
                    var updatedUser = await _userManager.FindByNameAsync(username);
                    _logger.LogInformation($"📋 Updated EmailConfirmed status: {updatedUser.EmailConfirmed}");

                    if (!updatedUser.EmailConfirmed)
                    {
                        _logger.LogWarning($"⚠️ Email confirmation succeeded but EmailConfirmed is still false for user: {username}");
                        // Force update if needed
                        updatedUser.EmailConfirmed = true;
                        await _userManager.UpdateAsync(updatedUser);
                        _logger.LogInformation($"🔧 Force updated EmailConfirmed to true for user: {username}");
                    }
                }
                else
                {
                    var errors = result.Errors.Select(e => e.Description).ToArray();
                    _logger.LogWarning($"❌ Email confirmation failed for {username}: {string.Join(", ", errors)}");

                    // Check if it's a token-related error
                    if (errors.Any(e => e.Contains("Invalid token") || e.Contains("expired")))
                    {
                        throw new WrongDetailsException("The confirmation link is invalid or has expired");
                    }

                    throw new WrongDetailsException($"Email confirmation failed: {string.Join(", ", errors)}");
                }
            }
            catch (Exception ex) when (!(ex is NotFoundException || ex is WrongDetailsException))
            {
                _logger.LogError(ex, $"❌ Exception during email confirmation for {username}: {ex.Message}");
                throw new Exception($"An error occurred during email confirmation: {ex.Message}");
            }
        }

        public async Task<bool> uploadPhoto(RegisterDTO newUser)
        {
            try
            {
                _logger.LogInformation($"🔄 Uploading photo for user: {newUser.username}");

                string res = (await _openAIService.profilePictureFilter(newUser.pozaProfil)).prompt;
                if (res != "Yes.")
                {
                    _logger.LogWarning($"❌ Profile picture rejected for {newUser.username}: {res}");
                    await failureEmail(newUser, res);
                    return false;
                }

                await _s3Service.UploadFileAsync(newUser.username + "_pfp.png", newUser.pozaProfil);
                _logger.LogInformation($"✅ Photo uploaded successfully for user: {newUser.username}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error uploading photo for user: {newUser.username}");
                throw;
            }
        }

        public async Task<IdentityResult> RegisterAsync(RegisterDTO newUser)
        {
            try
            {
                _logger.LogInformation($"🔄 Starting registration for user: {newUser.username}");

                // PASUL 1: Validare și upload poză de profil în S3
                string profilePictureUrl;
                try
                {
                    _logger.LogInformation($"📸 Validating and uploading profile picture for: {newUser.username}");

                    // Verificăm că avem o poză
                    if (newUser.pozaProfil == null || newUser.pozaProfil.Length == 0)
                    {
                        _logger.LogWarning($"❌ No profile picture provided for user: {newUser.username}");
                        return IdentityResult.Failed(new IdentityError
                        {
                            Code = "ProfilePictureRequired",
                            Description = "Profile picture is required"
                        });
                    }

                    // Validare OpenAI
                    string validationResult = (await _openAIService.profilePictureFilter(newUser.pozaProfil)).prompt;
                    if (validationResult != "Yes.")
                    {
                        _logger.LogWarning($"❌ Profile picture rejected for {newUser.username}: {validationResult}");
                        await failureEmail(newUser, validationResult);
                        return IdentityResult.Failed(new IdentityError
                        {
                            Code = "InvalidProfilePicture",
                            Description = validationResult
                        });
                    }

                    // Upload în S3 PRIMUL
                    string s3Key = newUser.username + "_pfp.png";
                    await _s3Service.UploadFileAsync(s3Key, newUser.pozaProfil);

                    // Obținem URL-ul real al pozei
                    profilePictureUrl = _s3Service.GetFileUrl(s3Key);

                    _logger.LogInformation($"✅ Profile picture uploaded successfully to S3: {profilePictureUrl}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"❌ Error uploading profile picture for user: {newUser.username}");
                    await failureEmail(newUser, "Failed to upload profile picture. Please try again.");
                    return IdentityResult.Failed(new IdentityError
                    {
                        Code = "ProfilePictureUploadFailed",
                        Description = "Failed to upload profile picture"
                    });
                }

                // PASUL 2: Crearea userului cu URL-ul real al pozei
                var user = new User
                {
                    UserName = newUser.username,
                    Email = newUser.email,
                    nume = newUser.nume,
                    prenume = newUser.prenume,
                    PhoneNumber = newUser.nrTelefon,
                    permis = "N/A",
                    carteIdentitate = "N/A",
                    dataNasterii = newUser.dataNasterii,
                    pozaProfil = profilePictureUrl, // URL-ul real din S3
                    puncteFidelitate = 0,
                    EmailConfirmed = false
                };

                var result = await _userManager.CreateAsync(user, newUser.parola);

                if (result.Succeeded)
                {
                    await _userManager.AddToRoleAsync(user, Roles.Default.ToString());
                    _logger.LogInformation($"✅ User {newUser.username} registered successfully with profile picture: {profilePictureUrl}");
                }
                else
                {
                    // PASUL 3: Cleanup dacă crearea userului a eșuat
                    try
                    {
                        await _s3Service.DeleteFileAsync(newUser.username + "_pfp.png");
                        _logger.LogInformation($"🗑️ Cleaned up uploaded profile picture for failed user creation: {newUser.username}");
                    }
                    catch (Exception cleanupEx)
                    {
                        _logger.LogWarning(cleanupEx, $"⚠️ Warning: Could not clean up profile picture for {newUser.username}: {cleanupEx.Message}");
                    }

                    var errors = result.Errors.Select(e => e.Description);
                    _logger.LogWarning($"❌ Registration failed for {newUser.username}: {string.Join(", ", errors)}");
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Exception during registration for {newUser.username}: {ex.Message}");
                throw;
            }
        }

        // Metodă pentru actualizarea pozei de profil (pentru utilizatori existenți)
        public async Task<bool> UpdateProfilePicture(string username, IFormFile newProfilePicture)
        {
            try
            {
                _logger.LogInformation($"🔄 Updating profile picture for user: {username}");

                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                {
                    _logger.LogWarning($"❌ User not found: {username}");
                    throw new NotFoundException("User not found");
                }

                // Validăm noua poză cu OpenAI
                var registerDTO = new RegisterDTO { username = username, pozaProfil = newProfilePicture };
                string validationResult = (await _openAIService.profilePictureFilter(newProfilePicture)).prompt;

                if (validationResult != "Yes.")
                {
                    _logger.LogWarning($"❌ New profile picture rejected for {username}: {validationResult}");
                    return false;
                }

                // Upload-ul noii poze (va suprascrie poza existentă)
                string s3Key = username + "_pfp.png";
                await _s3Service.UploadFileAsync(s3Key, newProfilePicture);

                // Actualizăm URL-ul în baza de date (s-ar putea să fie același URL, dar cu conținut nou)
                string newProfileUrl = _s3Service.GetFileUrl(s3Key);
                user.pozaProfil = newProfileUrl;
                await _userManager.UpdateAsync(user);

                _logger.LogInformation($"✅ Profile picture updated successfully for user: {username}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error updating profile picture for user: {username}");
                return false;
            }
        }

        public async Task resetPassword(ResetPasswordDTO user)
        {
            try
            {
                var userByName = await _userManager.FindByNameAsync(user.Username);
                if (userByName == null)
                {
                    throw new NotFoundException("User not found");
                }

                var result = await _userManager.ResetPasswordAsync(userByName, user.Token, user.Password);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.Select(e => e.Description);
                    throw new WrongDetailsException($"Password reset failed: {string.Join(", ", errors)}");
                }
            }
            catch (Exception ex) when (!(ex is NotFoundException || ex is WrongDetailsException))
            {
                _logger.LogError(ex, $"❌ Exception during password reset for {user.Username}: {ex.Message}");
                throw;
            }
        }

        public async Task uploadDocument(string username, string document, IFormFile file)
        {
            try
            {
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                {
                    throw new NotFoundException("User not found");
                }

                if (document == "permis")
                {
                    user.permis = _s3Service.GetFileUrl(username + "_permis.png");
                }
                else if (document == "carteIdentitate")
                {
                    user.carteIdentitate = _s3Service.GetFileUrl(username + "_carteIdentitate.png");
                }
                else
                {
                    throw new WrongDetailsException("Document type does not exist");
                }

                await _userManager.UpdateAsync(user);
                await _s3Service.UploadFileAsync(username + "_" + document + ".png", file);

                _logger.LogInformation($"✅ Document {document} uploaded for user: {username}");
            }
            catch (Exception ex) when (!(ex is NotFoundException || ex is WrongDetailsException))
            {
                _logger.LogError(ex, $"❌ Exception during document upload for {username}: {ex.Message}");
                throw;
            }
        }

        public async Task forgotPassword(ForgotPasswordDTO userDTO)
        {
            try
            {
                var userByName = await _userManager.FindByNameAsync(userDTO.Username);
                var userByEmail = await _userManager.FindByEmailAsync(userDTO.Email);

                if (userByName == null || userByEmail == null)
                {
                    throw new NotFoundException("User not found");
                }

                if (userByName.Id != userByEmail.Id)
                {
                    throw new WrongDetailsException("Username does not match email");
                }

                var token = await _userManager.GeneratePasswordResetTokenAsync(userByName);
                var encodedToken = HttpUtility.UrlEncode(token);
                var url = "http://localhost:4200/resetPassword?username=" + userByName.UserName + "&token=" + encodedToken;

                string emailHtml = await File.ReadAllTextAsync("Templates/ForgotEmailTemplate.html");
                emailHtml = emailHtml.Replace("{{confirmationUrl}}", url);
                emailHtml = emailHtml.Replace("{{username}}", userByName.UserName);

                await _emailSender.SendEmailAsync(userByName.Email, "Reset Password", emailHtml);
                _logger.LogInformation($"✅ Password reset email sent for user: {userDTO.Username}");
            }
            catch (Exception ex) when (!(ex is NotFoundException || ex is WrongDetailsException))
            {
                _logger.LogError(ex, $"❌ Exception during forgot password for {userDTO.Username}: {ex.Message}");
                throw;
            }
        }

        public async Task sendConfirmationEmail(RegisterDTO newUser)
        {
            try
            {
                _logger.LogInformation($"🔄 Sending confirmation email for user: {newUser.username}");

                User user = await _userManager.FindByNameAsync(newUser.username);
                if (user == null)
                {
                    throw new NotFoundException("User not found");
                }

                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                _logger.LogInformation($"📝 Generated confirmation token for {newUser.username}, length: {token?.Length}");

                var encodedToken = HttpUtility.UrlEncode(token);
                _logger.LogInformation($"🔗 Encoded token length: {encodedToken?.Length}");

                // Updated URL to match the new route
                var url = $"http://localhost:4200/confirmMail?username={user.UserName}&token={encodedToken}";
                _logger.LogInformation($"🌐 Confirmation URL: {url}");

                string emailHtml = await File.ReadAllTextAsync("Templates/ConfirmationEmailTemplate.html");
                emailHtml = emailHtml.Replace("{{confirmationUrl}}", url);
                emailHtml = emailHtml.Replace("{{username}}", newUser.username);

                await _emailSender.SendEmailAsync(user.Email, "Confirm Email", emailHtml);
                _logger.LogInformation($"✅ Confirmation email sent successfully to: {user.Email}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Exception sending confirmation email for {newUser.username}: {ex.Message}");
                throw;
            }
        }

        public async Task failureEmail(RegisterDTO newUser, string reason)
        {
            try
            {
                string emailHtml = await File.ReadAllTextAsync("Templates/FailureEmailTemplate.html");
                emailHtml = emailHtml.Replace("{{username}}", newUser.username);
                emailHtml = emailHtml.Replace("{{reason}}", reason);
                await _emailSender.SendEmailAsync(newUser.email, "Registration Failed", emailHtml);
                _logger.LogInformation($"✅ Failure email sent for user: {newUser.username}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Exception sending failure email for {newUser.username}: {ex.Message}");
                throw;
            }
        }


        public async Task<UserDTO> getUserDetails(string username)
        {
            try
            {
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                {
                    throw new NotFoundException("User not found");
                }

                Console.WriteLine($"👤 User found: {user.UserName}");
                Console.WriteLine($"📧 User email: {user.Email}");
                Console.WriteLine($"📱 User phone: {user.PhoneNumber}");

                var userInfo = new UserDTO
                {
                    username = user.UserName,
                    email = user.Email, // Asigură-te că email-ul este inclus
                    nume = user.nume,
                    prenume = user.prenume,
                    nrTelefon = user.PhoneNumber,
                    permis = user.permis != "N/A",
                    carteIdentitate = user.carteIdentitate != "N/A",
                    dataNasterii = user.dataNasterii,
                    linkPozaProfil = user.pozaProfil,
                    puncteFidelitate = user.puncteFidelitate
                };

                Console.WriteLine($"✅ Returning user details with email: {userInfo.email}");
                return userInfo;
            }
            catch (Exception ex) when (!(ex is NotFoundException))
            {
                _logger.LogError(ex, $"❌ Exception getting user details for {username}: {ex.Message}");
                throw;
            }
        }

        public async Task<SafeUserDTO> getUserProfile(string username)
        {
            try
            {
                var u = await _userManager.FindByNameAsync(username);
                if (u == null)
                {
                    throw new NotFoundException("User not found");
                }

                int nrPostari = await _postareRepository.NrPostareByUserID(u.Id);

                Console.WriteLine($"👤 User profile: {u.UserName}");
                Console.WriteLine($"📧 User email: {u.Email}");

                return new SafeUserDTO()
                {
                    id = u.Id,
                    nume = u.nume,
                    prenume = u.prenume,
                    username = u.UserName,
                    nrTelefon = u.PhoneNumber,
                    linkPozaProfil = u.pozaProfil,
                    dataNasterii = u.dataNasterii,
                    nrPostari = nrPostari,
                    email = u.Email
                };
            }
            catch (Exception ex) when (!(ex is NotFoundException))
            {
                _logger.LogError(ex, $"❌ Exception getting user profile for {username}: {ex.Message}");
                throw;
            }
        }

        public async Task<string> LoginAsync(LoginDTO login)
        {
            try
            {
                _logger.LogInformation($"🔄 Login attempt for user: {login.username}");

                var user = await _userManager.FindByNameAsync(login.username);
                if (user == null)
                {
                    _logger.LogWarning($"❌ User not found: {login.username}");
                    throw new NotFoundException("User does not exist");
                }

                _logger.LogInformation($"👤 User found: {user.UserName}, EmailConfirmed: {user.EmailConfirmed}");

                if (!user.EmailConfirmed)
                {
                    _logger.LogWarning($"❌ Email not confirmed for user: {login.username}");
                    throw new NotFoundException("Email not confirmed. Please check your email for the confirmation link.");
                }

                var result = await _signInManager.PasswordSignInAsync(login.username, login.parola, login.remember, lockoutOnFailure: false);

                if (result.Succeeded)
                {
                    _logger.LogInformation($"✅ Login successful for user: {login.username}");
                    return TokenHandler(user, await _userManager.GetRolesAsync(user));
                }
                else if (result.IsLockedOut)
                {
                    _logger.LogWarning($"🔒 Account locked out: {login.username}");
                    throw new LockedOutException("Too many login attempts recently, account is locked.");
                }
                else
                {
                    _logger.LogWarning($"❌ Invalid credentials for user: {login.username}");
                    throw new WrongDetailsException("Invalid username or password");
                }
            }
            catch (Exception ex) when (!(ex is NotFoundException || ex is WrongDetailsException || ex is LockedOutException))
            {
                _logger.LogError(ex, $"❌ Exception during login for {login.username}: {ex.Message}");
                throw;
            }
        }

        public string TokenHandler(User user, IList<String> Role)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier , user.UserName),
                new Claim("id", user.Id.ToString()),
                new Claim(ClaimTypes.Name , user.nume),
                new Claim(ClaimTypes.Email , user.Email),
                new Claim(ClaimTypes.MobilePhone , user.PhoneNumber),
                new Claim(ClaimTypes.Role, Role.FirstOrDefault() ?? Roles.Default.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: "https://localhost:7215/",
                audience: "https://localhost:7215/",
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                notBefore: DateTime.Now,
                signingCredentials: new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes("rGSSVGNjKoM4qq41wHcssBm4JDzDxfc93rfcAy+id0I=")),
                    SecurityAlgorithms.HmacSha256)
            );

            var x = new JwtSecurityTokenHandler().WriteToken(token);
            return x;
        }

        public async Task LogoutAsync()
        {
            await _signInManager.SignOutAsync();
        }

        public async Task checkRoleUpdates(string username)
        {
            var user = await _userManager.FindByNameAsync(username);
            if (user.permis != "N/A")
            {
                await _userManager.RemoveFromRolesAsync(user, await _userManager.GetRolesAsync(user));
                await _userManager.AddToRoleAsync(user, "Chirias");
            }
            else if (user.carteIdentitate != "N/A")
            {
                await _userManager.RemoveFromRolesAsync(user, await _userManager.GetRolesAsync(user));
                await _userManager.AddToRoleAsync(user, "Propietar");
            }
        }

        public async Task<IdentityResult> ChangePasswordAsync(UserChangePassDTO user)
        {
            var u = await _userManager.FindByNameAsync(user.username);
            var result = await _userManager.ChangePasswordAsync(u, user.parolaVeche, user.parolaNoua);
            return result;
        }

        public async Task<UserDTO> getUserById(int id)
        {
            try
            {
                var u = await _userManager.FindByIdAsync(id.ToString());
                if (u == null)
                {
                    throw new NotFoundException("User not found");
                }

                var userInfo = new UserDTO
                {
                    username = u.UserName,
                    email = u.Email,
                    nume = u.nume,
                    prenume = u.prenume,
                    nrTelefon = u.PhoneNumber,
                    permis = u.permis != "N/A",
                    carteIdentitate = u.carteIdentitate != "N/A",
                    dataNasterii = u.dataNasterii,
                    linkPozaProfil = u.pozaProfil,
                    puncteFidelitate = u.puncteFidelitate
                };
                return userInfo;
            }
            catch (Exception ex) when (!(ex is NotFoundException))
            {
                _logger.LogError(ex, $"❌ Exception getting user by id {id}: {ex.Message}");
                throw;
            }
        }
    }
}