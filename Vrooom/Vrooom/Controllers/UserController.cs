using Microsoft.AspNetCore.Mvc;
using Vrooom.Models.DTOs.UserDTOs;
using Vrooom.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Vrooom.Models;
using Microsoft.AspNetCore.Authorization;
using Vrooom.Services;

namespace Vrooom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly VrooomDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IWebHostEnvironment _environment;
        private readonly JwtService _jwtService;

        public UserController(UserManager<User> userManager, IWebHostEnvironment environment, JwtService jwtService, VrooomDbContext context)
        {
            _userManager = userManager;
            _environment = environment;
            _jwtService = jwtService;
            _context = context;
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDTO dto)
        {
            var user = await _userManager.FindByNameAsync(dto.Username);

            if (user == null || user.Email != dto.Email)
            {
                return NotFound("Utilizatorul nu a fost găsit.");
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            return Ok(new { Token = token });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            var user = await _userManager.FindByNameAsync(dto.username);
            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.parola))
                return Unauthorized("Date de autentificare invalide.");

            var token = _jwtService.GenerateToken(user);
            return Ok(new { Token = token });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromForm] RegisterDTO dto)
        {
            var uploadsPath = Path.Combine(_environment.WebRootPath ?? "wwwroot", "images");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.pozaProfil.FileName);
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await dto.pozaProfil.CopyToAsync(stream);
            }

            string profilePicturePath = "/images/" + fileName;

            var user = new User
            {
                UserName = dto.username,
                Email = dto.email,
                nume = dto.nume,
                prenume = dto.prenume,
                PhoneNumber = dto.nrTelefon,
                dataNasterii = dto.dataNasterii,
                pozaProfil = profilePicturePath,
                EmailConfirmed = true,
                carteIdentitate = dto.carteIdentitate,
            };

            var result = await _userManager.CreateAsync(user, dto.parola);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            return Ok("Utilizatorul a fost înregistrat cu succes.");
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDTO dto)
        {
            var user = await _userManager.FindByNameAsync(dto.Username);
            if (user == null)
            {
                return NotFound("Utilizatorul nu a fost găsit.");
            }

            var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.Password);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            return Ok("Parola a fost resetată cu succes.");
        }

        [HttpPost("generate-reset-token")]
        public async Task<IActionResult> GenerateResetToken([FromBody] ForgotPasswordDTO dto)
        {
            var user = await _userManager.FindByNameAsync(dto.Username);
            if (user == null || user.Email != dto.Email)
            {
                return NotFound("Utilizatorul nu a fost găsit.");
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            return Ok(new { Token = token });
        }

        [HttpGet("profile-public")]
        public async Task<IActionResult> GetPublicProfileSelf()
        {
            var userName = User.Identity?.Name;
            if (string.IsNullOrEmpty(userName))
                return Unauthorized("Utilizator neautentificat.");

            var user = await _userManager.FindByNameAsync(userName);
            if (user == null)
                return NotFound("Utilizatorul nu a fost găsit.");

            var postariCount = await _context.Postari.CountAsync(p => p.UserId == user.Id);

            var dto = new SafeUserDTO
            {
                id = user.Id,
                nume = user.nume,
                prenume = user.prenume,
                username = user.UserName,
                nrTelefon = user.PhoneNumber,
                dataNasterii = user.dataNasterii,
                linkPozaProfil = user.pozaProfil,
                nrPostari = postariCount
            };

            return Ok(dto);
        }

        [HttpGet("profile-public/{username}")]
        public async Task<IActionResult> GetPublicProfile(string username)
        {
            var user = await _userManager.FindByNameAsync(username);
            if (user == null)
                return NotFound("Utilizatorul nu a fost găsit.");

            var postariCount = await _context.Postari.CountAsync(p => p.UserId == user.Id);

            var dto = new SafeUserDTO
            {
                id = user.Id,
                nume = user.nume,
                prenume = user.prenume,
                username = user.UserName,
                nrTelefon = null,
                dataNasterii = user.dataNasterii,
                linkPozaProfil = user.pozaProfil,
                nrPostari = postariCount
            };

            return Ok(dto);
        }

        /*[Authorize]
        [HttpGet("get-profile")]
        public IActionResult GetProfile()
        {
            var username = User.Identity?.Name;
            return Ok($"Hello, {username}");
        }*/
        [Authorize]
        [HttpGet("get-profile")] // CEVA AICI NU E BINE, NU STIU DACA E DIN COD SAU SUNT EU PREA TUTA SI IN TESTARE PUN CEVA GRESIT.. POATE VA DATI VOI SEAMA, TOATA ZIUA AM STAT PE EL, MA DAU BATUTA!
        public IActionResult GetProfile()
        {
            var username = User.Identity?.Name ?? "(null)";
            return Ok($"Hello, {username}");
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] UserChangePassDTO dto)
        {
            var user = await _userManager.FindByNameAsync(dto.username);
            if (user == null)
            {
                return NotFound("Utilizatorul nu a fost găsit.");
            }

            var isOldPasswordCorrect = await _userManager.CheckPasswordAsync(user, dto.parolaVeche);
            if (!isOldPasswordCorrect)
            {
                return BadRequest("Parola veche este incorectă.");
            }

            var result = await _userManager.ChangePasswordAsync(user, dto.parolaVeche, dto.parolaNoua);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            return Ok("Parola a fost schimbată cu succes.");
        }

    }
}
