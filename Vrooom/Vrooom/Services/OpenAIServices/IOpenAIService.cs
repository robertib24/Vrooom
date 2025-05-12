using Vrooom.Models.DTOs;

namespace Vrooom.Services.OpenAIServices
{
    public interface IOpenAIService
    {

        /// <summary>
        /// Modifica descrierea facuta de client si o imbunatateste. Daca userul a specificat doar modelul, AI-ul va genera propria descriere
        /// </summary>
        /// <param name="prompt">Prompt-ul userului</param>
        /// <returns>
        /// Raspunsul cu descrierea imbunatatita
        /// </returns>
        /// <exception cref="NotFoundException">Daca prompt-ul primit nu pare a fi o descrierere</exception>
        Task<Models.DTOs.OpenAIDTO> GetDescription(Models.DTOs.OpenAIDTO prompt);

        /// <summary>
        /// Verifica folosind OpenAI daca poza de profil este potrivita pentru site sau nu
        /// Se converteste fisierul in Base64, deoarece API-ul nu accepta incarcare de fisiere
        /// Odata trimisa imaginea, se asteapta raspuns. Chat completion-ul este modificat
        /// astfel incat sa raspunda cu "yes" daca poza e potrivita, iar daca contine chestii precum tigari, alcool, etc
        /// va raspunde cu "No." urmat de ceea ce contine
        /// </summary>
        /// <param name="file">Imaginea ce va fi parsata</param>
        /// <returns> Un JSON cu raspunsul modelului.</returns>
        Task<Models.DTOs.OpenAIDTO> profilePictureFilter(IFormFile file);

        /// <summary>
        /// Functie care apeleaza un tool propriu OpenAI pentru a gasi masini in functie de criteriile date de user
        /// </summary>
        Task<IEnumerable<PostareDTO>> GetInfo(string prompt);
    }
}
