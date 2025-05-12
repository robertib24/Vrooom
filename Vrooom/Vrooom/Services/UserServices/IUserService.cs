using Microsoft.AspNetCore.Identity;
using Vrooom.Models;
using Vrooom.Models.DTOs.UserDTOs;

namespace Vrooom.Services.UserServices
{
    public interface IUserService
    {

        /// <summary>
        /// Inregistreaza un nou utilizator.
        /// </summary>
        /// <param name="newUser"></param>
        /// <returns></returns>
        Task<IdentityResult> RegisterAsync(RegisterDTO newUser);
        Task<UserDTO> getUserDetails(string username);
        Task<string> LoginAsync(LoginDTO login);
        Task ConfirmEmail(string username, string token);
        Task<bool> uploadPhoto(RegisterDTO newUser);
        Task sendConfirmationEmail(RegisterDTO newUser);
        Task resetPassword(ResetPasswordDTO user);
        Task forgotPassword(ForgotPasswordDTO userDTO);
        Task uploadDocument(string username, string document, IFormFile file);
        Task<SafeUserDTO> getUserProfile(string username);
        Task<UserDTO> getUserById(int id);
    }
}
