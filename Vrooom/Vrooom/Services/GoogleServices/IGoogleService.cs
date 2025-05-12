namespace Vrooom.Services.GoogleServices
{
    public interface IGoogleService
    {
        /// <summary>
        /// Verifica daca textul este o culoare
        /// </summary>
        /// <param name="text">Posibila culoare</param>
        /// <returns>Culoarea in limba engleza</returns>
        Task<string> check(string text);
        /// <summary>
        /// Functie care returneaza coordonatele unei locatii folosind Google Maps API
        /// </summary>
        /// <param name="location"> Locatia introdusa de user</param>
        /// <returns>Latitudinea si longitudinea adresei</returns>
        Task<(double Latitude, double Longitude)> GetCoordinatesAsync(string location);

        /// <summary>
        /// Returneaza adresa unei locatii dupa coordonate folosind Google Maps API
        /// </summary>
        /// <param name="latitude">Latitudinea locatiei</param>
        /// <param name="longitude">Longitudinea locatiei</param>
        /// <returns>Un string cu dresa</returns>
        Task<string> getLocationFromCoordinates(double latitude, double longitude);

        /// <summary>
        /// Returneaza ID-ul locatiei, asa cum este el stocat in baza de date de la Google.
        /// </summary>
        /// <param name="location">Adresa</param>
        /// <returns>ID-ul locatiei</returns>
        Task<string> GetIdfromLocationAsync(string location);


        /// <summary>
        /// Pentru a evita expunerea cheii API, se returneaza un URL care redirectioneaza catre locatia dorita
        /// </summary>
        /// <param name="location"> Locatia</param>
        /// <returns>Un link ce reprezinta un embed cu care userul poate interactiona</returns>
        string getLocationURL(string location);

        /// <summary>
        /// Pentru a evita expunerea cheii API, se returneaza un URL care redirectioneaza catre locatia dorita
        /// </summary> 
        /// <param name="longitude">Longitudinea locatiei</param>
        /// <param name="latitude">Latitudinea locatiei</param>
        /// <returns>Link de la o imagine ce arata locatia cu pinpoint</returns>
        string getLocationImageFromCoordinates(double latitude, double longitude);
    }
}
