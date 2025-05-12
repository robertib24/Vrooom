    using Google.Cloud.Translation.V2;
    using Newtonsoft.Json;
    using System.Net.Http;

namespace Vrooom.Services.GoogleServices
{
    public class GoogleService : IGoogleService
    {
        AdvancedTranslationClient client;
        private HashSet<string> knownColors;
        private string apiKey;
        private readonly HttpClient _httpClient;
        public GoogleService(IConfiguration configuration, HttpClient httpClient)
        {
            apiKey = configuration["Google:ApiKey"];
            client = AdvancedTranslationClient.CreateFromApiKey(apiKey);
            _httpClient = httpClient;
            knownColors = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "black", "white", "gray", "silver", "red", "blue", "brown",
            "green", "yellow", "gold", "orange", "beige", "maroon", "purple",
            "pink", "cyan", "navy", "teal", "lime", "olive", "aqua", "fuchsia",
            "bronze", "charcoal", "ivory", "pearl", "tan"
        };
        }
        public async Task<string> check(string text)
        {
            TranslationResult result = await client.TranslateTextAsync(text, LanguageCodes.English);
            string translatedText = result.TranslatedText.ToLowerInvariant();
            if (knownColors.Contains(translatedText))
            {
                return translatedText.ToLower();
            }
            throw new Exception("Invalid color");
        }
        public async Task<(double Latitude, double Longitude)> GetCoordinatesAsync(string location)
        {
            var url = $"https://maps.googleapis.com/maps/api/geocode/json?address={Uri.EscapeUriString(location)}&key={apiKey}";
            Console.WriteLine($"url= {url}");
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                string json = await response.Content.ReadAsStringAsync();
                dynamic result = JsonConvert.DeserializeObject(json);
                if (result.status == "OK")
                {
                    var locationData = result.results[0].geometry.location;
                    double latitude = locationData.lat;
                    double longitude = locationData.lng;

                    return (latitude, longitude);
                }
            }
            throw new Exception("Failed to get coordinates from Google Maps API.");
        }
        public async Task<string> GetIdfromLocationAsync(string location)
        {
            var url = $"https://maps.googleapis.com/maps/api/geocode/json?address={Uri.EscapeUriString(location)}&key={apiKey}";
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                string json = await response.Content.ReadAsStringAsync();
                dynamic result = JsonConvert.DeserializeObject(json);
                if (result.status == "OK")
                    return result.results[0].place_id;
            }
            throw new Exception("Failed to get coordinates from Google Maps API.");
        }
        public async Task<string> getLocationFromCoordinates(double latitude, double longitude)
        {
            var url = $"https://maps.googleapis.com/maps/api/geocode/json?latlng={latitude},{longitude}&key={apiKey}";
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                string json = await response.Content.ReadAsStringAsync();
                dynamic result = JsonConvert.DeserializeObject(json);
                if (result.status == "OK")
                {
                    var location = result.results[0].place_id;
                    return $"{result.results[0].formatted_address}";
                }
            }
            throw new Exception("Failed to get coordinates from Google Maps API.");
        }
        public string getLocationURL(string location)
        {
            return $"https://www.google.com/maps/embed/v1/place?q=${location}&key={apiKey}";
        }
        public string getLocationImageFromCoordinates(double latitude, double longitude)
        {
            return $"https://maps.googleapis.com/maps/api/staticmap?center={latitude},{longitude}&zoom=13&size=600x300&maptype=roadmap&markers=color:red%7Clabel:C%7C{latitude},{longitude}&key={apiKey}";
        }
    }
}
