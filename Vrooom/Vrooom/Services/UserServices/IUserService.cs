using Microsoft.AspNetCore.Identity;
using Vrooom.Models;
using Vrooom.Models.DTOs.UserDTOs;

namespace Vrooom.Services.UserServices
{
    public interface IUserService
    {
        /// <summary>
        /// Inregistreaza un nou utilizator cu upload automat de poză de profil
        /// </summary>
        /// <param name="newUser">Datele utilizatorului nou</param>
        /// <returns>Rezultatul înregistrării</returns>
        Task<IdentityResult> RegisterAsync(RegisterDTO newUser);

        /// <summary>
        /// Obține detaliile utilizatorului
        /// </summary>
        /// <param name="username">Username-ul utilizatorului</param>
        /// <returns>Detaliile utilizatorului</returns>
        Task<UserDTO> getUserDetails(string username);

        /// <summary>
        /// Autentifică utilizatorul
        /// </summary>
        /// <param name="login">Credențialele de login</param>
        /// <returns>Token-ul JWT</returns>
        Task<string> LoginAsync(LoginDTO login);

        /// <summary>
        /// Confirmă email-ul utilizatorului
        /// </summary>
        /// <param name="username">Username-ul utilizatorului</param>
        /// <param name="token">Token-ul de confirmare</param>
        Task ConfirmEmail(string username, string token);

        /// <summary>
        /// Schimbă parola utilizatorului
        /// </summary>
        /// <param name="changePasswordData">Datele pentru schimbarea parolei</param>
        /// <returns>Rezultatul schimbării parolei</returns>
        Task<IdentityResult> ChangePasswordAsync(UserChangePassDTO changePasswordData);

        /// <summary>
        /// Uploadează poza de profil pentru un utilizator nou (deprecated - folosește RegisterAsync)
        /// </summary>
        /// <param name="newUser">Datele utilizatorului</param>
        /// <returns>True dacă upload-ul a reușit</returns>
        [Obsolete("Use RegisterAsync instead - this method is deprecated")]
        Task<bool> uploadPhoto(RegisterDTO newUser);

        /// <summary>
        /// Actualizează poza de profil pentru un utilizator existent
        /// </summary>
        /// <param name="username">Username-ul utilizatorului</param>
        /// <param name="newProfilePicture">Noua poză de profil</param>
        /// <returns>True dacă actualizarea a reușit</returns>
        Task<bool> UpdateProfilePicture(string username, IFormFile newProfilePicture);

        /// <summary>
        /// Trimite email de confirmare
        /// </summary>
        /// <param name="newUser">Datele utilizatorului</param>
        Task sendConfirmationEmail(RegisterDTO newUser);

        /// <summary>
        /// Resetează parola utilizatorului
        /// </summary>
        /// <param name="user">Datele pentru resetarea parolei</param>
        Task resetPassword(ResetPasswordDTO user);

        /// <summary>
        /// Inițiază procesul de resetare a parolei
        /// </summary>
        /// <param name="userDTO">Username și email pentru resetare</param>
        Task forgotPassword(ForgotPasswordDTO userDTO);

        /// <summary>
        /// Obține profilul public al utilizatorului
        /// </summary>
        /// <param name="username">Username-ul utilizatorului</param>
        /// <returns>Profilul public al utilizatorului</returns>
        Task<SafeUserDTO> getUserProfile(string username);

        /// <summary>
        /// Uploadează documente pentru utilizator
        /// </summary>
        /// <param name="username">Username-ul utilizatorului</param>
        /// <param name="document">Tipul documentului</param>
        /// <param name="file">Fișierul documentului</param>
        Task uploadDocument(string username, string document, IFormFile file);

        /// <summary>
        /// Obține utilizatorul după ID
        /// </summary>
        /// <param name="id">ID-ul utilizatorului</param>
        /// <returns>Datele utilizatorului</returns>
        Task<UserDTO> getUserById(int id);

        /// <summary>
        /// Verifică și actualizează rolurile utilizatorului în funcție de documentele încărcate
        /// </summary>
        /// <param name="username">Username-ul utilizatorului</param>
        Task checkRoleUpdates(string username);

        /// <summary>
        /// Trimite email de eșec pentru înregistrare
        /// </summary>
        /// <param name="newUser">Datele utilizatorului</param>
        /// <param name="reason">Motivul eșecului</param>
        Task failureEmail(RegisterDTO newUser, string reason);

        /// <summary>
        /// Generează token JWT pentru utilizator
        /// </summary>
        /// <param name="user">Utilizatorul</param>
        /// <param name="roles">Rolurile utilizatorului</param>
        /// <returns>Token-ul JWT</returns>
        string TokenHandler(User user, IList<string> roles);

        /// <summary>
        /// Deloghează utilizatorul
        /// </summary>
        Task LogoutAsync();
    }
}