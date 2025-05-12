namespace Vrooom.Services.S3Services
{
    public interface IS3Service
    {

        /// <summary>
        /// Incarca un fisier in bucket S3
        /// </summary>
        /// <param name="key">Numele ce il va avea imaginea cand va fi pusa in bucket</param>
        /// <param name="poza"> Poza ce urmeaza sa fie incarcata</param>
        /// <returns></returns>
        Task UploadFileAsync(string key, IFormFile poza);

        /// <summary>
        /// Preia link-ul catre o imagine din bucket
        /// </summary>
        /// <param name="key">Numele imaginii</param>
        string GetFileUrl(string key);

        /// <summary>
        /// Sterge o imagine din bucket
        /// </summary>
        /// <param name="key">Numele imaginii</param>
        Task DeleteFileAsync(string key);
    }
}
