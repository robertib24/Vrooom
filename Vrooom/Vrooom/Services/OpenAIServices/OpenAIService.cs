using Azure.Core;
using OpenAI;
using OpenAI.Assistants;
using OpenAI.Models;
using OpenAI.Chat;
using System.Text.Json;
using Vrooom.Exceptions;
using Vrooom.Models.DTOs;
using Vrooom.Repos.PostareRepo;
using SendGrid.Helpers.Mail;

namespace Vrooom.Services.OpenAIServices
{
    public class OpenAIService : IOpenAIService
    {

        OpenAIClient client;
        IPostareRepo _postareRepository;

        public OpenAIService(IPostareRepo postareRepository)
        {
            client = new OpenAIClient();
            _postareRepository = postareRepository;
        }

        public async Task<OpenAIDTO> profilePictureFilter(IFormFile file)
        {
            using (var ms = new MemoryStream())
            {
                file.CopyTo(ms);
                var fileBytes = ms.ToArray();
                string s = $"data:image/jpeg;base64,{Convert.ToBase64String(fileBytes)}";
                ImageUrl img = new ImageUrl(s);
                var messages = new List<Message>()
               {
                   new Message(Role.System,"You're an assistant that filters submitted profile pictures. " +
                   "Reply with 'Yes.' if the picture is SFW, and with " +
                   "'NSFW profile picture.' followed by a brief summary why otherwise." +
                   " Remember, no alcohol reference, drugs, etc."),
                   new Message(Role.User, new List<OpenAI.Content>
                    {
                        "This is the profile picture I want.",
                        img
                    })
               };
                var chatRequest = new ChatRequest(messages, model: Model.GPT4_Turbo);
                var response = await client.ChatEndpoint.GetCompletionAsync(chatRequest);
                var choice = response.FirstChoice;
                return new OpenAIDTO() { prompt = choice.Message };
            }
        }

        /// <summary>
        /// Elimina ultimul caracter dintr-un substring
        /// </summary>
        private static string ultCaract(string originalString, string substring)
        {
            int index = originalString.LastIndexOf(substring);
            if (index == -1)
                return originalString;
            return originalString.Remove(index, substring.Length);
        }

        /// <summary>
        /// Functie apelata de Tool, ce trimite toti parametrii pe care i-a extras din prompt-ul userului
        /// Parseaza si returneaza un query SSMS ce va extrage ceea ce vrea userul
        /// </summary>
        private async Task<string> CreateCarQuery(string parametersJson)
        {
            try
            {
                string query = "SELECT * FROM [dbo].[postare] WHERE 1=1";
                string orderBy = "";

                Console.WriteLine($"Parameters JSON received: {parametersJson}");

                // Parse JSON manually
                var parameters = JsonDocument.Parse(parametersJson).RootElement;

                // Parse brand - cu mapări mai precise
                if (parameters.TryGetProperty("brand", out JsonElement brand) &&
                    brand.ValueKind != JsonValueKind.Null &&
                    !string.IsNullOrEmpty(brand.GetString()))
                {
                    string brandValue = brand.GetString().Trim();
                    Console.WriteLine($"Original brand: {brandValue}");

                    // Mapări exacte pentru tipurile de mașini (English + Romanian)
                    brandValue = brandValue.ToLower() switch
                    {
                        "sports" or "sport" or "sports car" or "sportcar" or
                        "mașină sport" or "masina sport" or "mașina sport" => "Ferrari",

                        "luxury" or "luxury car" or "lux" or
                        "mașină de lux" or "masina de lux" or "mașina de lux" => "Mercedes-Benz",

                        "electric" or "electric car" or "electrică" or "electrica" or
                        "mășină electrică" or "masina electrica" or "mașina electrică" => "Tesla",

                        "economy" or "economic" or "economy car" or "economică" or "economica" or
                        "mașină economică" or "masina economica" or "mașina economică" => "Dacia",

                        "suv" or "off-road" => "Jeep",

                        var b when b.Contains("ferrari") => "Ferrari",
                        var b when b.Contains("mercedes") => "Mercedes-Benz",
                        var b when b.Contains("tesla") => "Tesla",
                        var b when b.Contains("dacia") => "Dacia",
                        var b when b.Contains("jeep") => "Jeep",
                        var b when b.Contains("volkswagen") => "Volkswagen",
                        var b when b.Contains("trabant") => "Trabant",
                        _ => char.ToUpper(brandValue[0]) + brandValue.Substring(1).ToLower()
                    };

                    Console.WriteLine($"Mapped brand: {brandValue}");
                    query += $" AND firma = '{brandValue}'";
                }

                // Parse model
                if (parameters.TryGetProperty("model", out JsonElement model) &&
                    model.ValueKind != JsonValueKind.Null &&
                    !string.IsNullOrEmpty(model.GetString()))
                {
                    string modelValue = model.GetString().Trim();
                    Console.WriteLine($"Model filter: {modelValue}");
                    query += $" AND model LIKE '%{modelValue}%'";
                }

                // Parse color array - cu suport pentru română
                if (parameters.TryGetProperty("color", out JsonElement color) &&
                    color.ValueKind == JsonValueKind.Array &&
                    color.GetArrayLength() > 0)
                {
                    Console.WriteLine("Processing color filters...");
                    query += " AND (";
                    bool hasColorFilter = false;

                    foreach (var colorElement in color.EnumerateArray())
                    {
                        if (colorElement.ValueKind != JsonValueKind.Null &&
                            !string.IsNullOrEmpty(colorElement.GetString()))
                        {
                            string colorValue = colorElement.GetString().Trim().ToLower();
                            Console.WriteLine($"Original color: {colorValue}");

                            // Mapare culori română → engleză (inclusiv diacritice)
                            colorValue = colorValue switch
                            {
                                "roșu" or "rosu" => "red",
                                "alb" or "albă" or "alba" => "white",
                                "negru" or "neagră" or "neagra" => "black",
                                "albastru" or "albastră" or "albastra" => "blue",
                                "verde" => "green",
                                "galben" or "galbena" or "galbenă" => "yellow",
                                "gri" or "cenușiu" or "cenusiu" => "grey",
                                "argintiu" or "argintie" or "argintiu" => "silver",
                                "portocaliu" or "portocalie" => "orange",
                                "roz" or "pink" => "pink",
                                "mov" or "violet" or "purple" => "purple",
                                _ => colorValue
                            };

                            Console.WriteLine($"Mapped color: {colorValue}");
                            query += $" culoare = '{colorValue}' OR";
                            hasColorFilter = true;
                        }
                    }

                    if (hasColorFilter)
                    {
                        query = ultCaract(query, " OR") + ")";
                    }
                    else
                    {
                        query = query.Replace(" AND (", ""); // Remove the incomplete AND clause
                    }
                }

                // Parse min year
                if (parameters.TryGetProperty("minMakeYear", out JsonElement minYear) &&
                    minYear.ValueKind != JsonValueKind.Null)
                {
                    if (minYear.TryGetInt32(out int minYearValue))
                    {
                        Console.WriteLine($"Min year filter: {minYearValue}");
                        query += $" AND anFabricatie >= {minYearValue}";
                    }
                }

                // Parse max year
                if (parameters.TryGetProperty("maxMakeYear", out JsonElement maxYear) &&
                    maxYear.ValueKind != JsonValueKind.Null)
                {
                    if (maxYear.TryGetInt32(out int maxYearValue))
                    {
                        Console.WriteLine($"Max year filter: {maxYearValue}");
                        query += $" AND anFabricatie <= {maxYearValue}";
                    }
                }

                // Parse mileage
                if (parameters.TryGetProperty("mileage", out JsonElement mileage) &&
                    mileage.ValueKind != JsonValueKind.Null)
                {
                    if (mileage.TryGetInt32(out int mileageValue))
                    {
                        Console.WriteLine($"Max mileage filter: {mileageValue}");
                        query += $" AND kilometraj <= {mileageValue}";
                    }
                }

                // Parse max price
                if (parameters.TryGetProperty("price", out JsonElement price) &&
                    price.ValueKind != JsonValueKind.Null)
                {
                    if (price.TryGetDecimal(out decimal priceValue))
                    {
                        Console.WriteLine($"Max price filter: {priceValue}");
                        query += $" AND pret <= {priceValue}";
                    }
                }

                // Parse min price
                if (parameters.TryGetProperty("minprice", out JsonElement minPrice) &&
                    minPrice.ValueKind != JsonValueKind.Null)
                {
                    if (minPrice.TryGetDecimal(out decimal minPriceValue))
                    {
                        Console.WriteLine($"Min price filter: {minPriceValue}");
                        query += $" AND pret >= {minPriceValue}";
                    }
                }

                // Adaugă ORDER BY pentru cereri speciale
                if (parameters.TryGetProperty("minprice", out JsonElement minPriceForSort) &&
                    minPriceForSort.ValueKind != JsonValueKind.Null &&
                    minPriceForSort.TryGetDecimal(out decimal minPriceSort) && minPriceSort >= 400)
                {
                    orderBy = " ORDER BY pret DESC"; // Cea mai scumpă
                    Console.WriteLine("Sorting by price DESC (most expensive first)");
                }
                else if (parameters.TryGetProperty("price", out JsonElement maxPriceForSort) &&
                         maxPriceForSort.ValueKind != JsonValueKind.Null &&
                         maxPriceForSort.TryGetDecimal(out decimal maxPriceSort) && maxPriceSort <= 100)
                {
                    orderBy = " ORDER BY pret ASC"; // Cea mai ieftină
                    Console.WriteLine("Sorting by price ASC (cheapest first)");
                }
                else if (parameters.TryGetProperty("maxMakeYear", out JsonElement maxYearForSort) &&
                         maxYearForSort.ValueKind != JsonValueKind.Null &&
                         maxYearForSort.TryGetInt32(out int maxYearSortValue) && maxYearSortValue <= 2000)
                {
                    orderBy = " ORDER BY anFabricatie ASC"; // Cea mai veche
                    Console.WriteLine("Sorting by year ASC (oldest first)");
                }
                else if (parameters.TryGetProperty("minMakeYear", out JsonElement minYearForSort) &&
                         minYearForSort.ValueKind != JsonValueKind.Null &&
                         minYearForSort.TryGetInt32(out int minYearSortValue) && minYearSortValue >= 2020)
                {
                    orderBy = " ORDER BY anFabricatie DESC"; // Cea mai nouă
                    Console.WriteLine("Sorting by year DESC (newest first)");
                }

                string finalQuery = query + orderBy;
                Console.WriteLine($"Final SQL Query: {finalQuery}");
                return finalQuery;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CreateCarQuery: {ex.Message}");
                throw new Exception($"Error processing search parameters: {ex.Message}");
            }
        }

        public async Task<IEnumerable<PostareDTO>> GetInfo(string prompt)
        {
            try
            {
                var messages = new List<Message>
                {
                    new Message(Role.System, "You are a multilingual car search assistant. You understand both English and Romanian. " +
                        "Extract car search criteria from user requests in ANY language. " +

                        "IMPORTANT MAPPINGS: " +
                        "CAR TYPES (English/Romanian): " +
                        "- 'sports car'/'sport'/'mașină sport'/'mașina sport' → brand: 'Ferrari' " +
                        "- 'luxury car'/'mașină de lux'/'mașina de lux' → brand: 'Mercedes-Benz' " +
                        "- 'electric car'/'mașină electrică'/'mașina electrica' → brand: 'Tesla' " +
                        "- 'economy car'/'mașină economică'/'mașina economica' → brand: 'Dacia' " +
                        "- 'SUV'/'off-road' → brand: 'Jeep' " +

                        "COLORS (Romanian → English): " +
                        "- 'roșu'/'rosu' → 'red' " +
                        "- 'alb'/'albă'/'alba' → 'white' " +
                        "- 'negru'/'neagră'/'neagra' → 'black' " +
                        "- 'albastru'/'albastră'/'albastra' → 'blue' " +
                        "- 'verde' → 'green' " +
                        "- 'galben'/'galbena' → 'yellow' " +
                        "- 'gri'/'cenușiu'/'cenusiu' → 'grey' " +
                        "- 'argintiu'/'argintie' → 'silver' " +

                        "MULTIPLE COLORS: " +
                        "- When user mentions multiple colors with 'sau'/'or'/'și'/'and', put ALL colors in the color array " +
                        "- Examples: 'roșie sau verde' → color: ['red', 'green'] " +
                        "- 'red or blue or white' → color: ['red', 'blue', 'white'] " +
                        "- 'albastră și verde' → color: ['blue', 'green'] " +

                        "SPECIAL REQUESTS (Romanian): " +
                        "- 'cea mai veche'/'mai veche'/'oldest' → set maxMakeYear to current year - 20 " +
                        "- 'cea mai nouă'/'mai nouă'/'newest'/'recent' → set minMakeYear to current year - 5 " +
                        "- 'cea mai scumpă'/'mai scumpă'/'most expensive' → sort by price DESC, set minprice high " +
                        "- 'cea mai ieftină'/'mai ieftină'/'cheapest' → set maxprice low " +
                        "- 'cu kilometraj mic'/'few kilometers' → set mileage low " +
                        "- 'cu kilometraj mare'/'many kilometers' → set mileage high " +

                        "ALWAYS: " +
                        "- Convert ALL colors to English lowercase " +
                        "- Extract ALL mentioned colors into the color array " +
                        "- If user mentions color + car type, extract BOTH color AND brand " +
                        "- Handle Romanian diacritics (ă, â, î, ș, ț) " +
                        "- Be precise with extracted parameters " +
                        "- For 'most expensive', set minprice to 400 " +
                        "- For 'cheapest', set maxprice to 100 " +
                        "- For 'oldest', set maxMakeYear to 2000 " +
                        "- For 'newest', set minMakeYear to 2020"),
                    new Message(Role.User, prompt)
                };

                Tool.ClearRegisteredTools();

                var tools = new List<Tool>
                {
                    Tool.FromFunc<string, Task<string>>("create_car_query", CreateCarQuery,
                        "Extract car search parameters from user request in any language and create SQL query. " +
                        "Handle both English and Romanian requests. " +
                        "IMPORTANT: When user mentions multiple colors (with 'sau'/'or'/'și'/'and'), extract ALL colors into the color array. " +
                        "Parameters: " +
                        "- brand (string): car manufacturer (Ferrari, Mercedes-Benz, Tesla, Dacia, Volkswagen, Jeep, Trabant) " +
                        "- model (string): specific car model " +
                        "- color (array of strings): ALL mentioned colors in English lowercase. Examples: ['red'], ['red','green'], ['blue','white','black'] " +
                        "- price (number): maximum price " +
                        "- minprice (number): minimum price " +
                        "- mileage (number): maximum mileage " +
                        "- minMakeYear (number): minimum year " +
                        "- maxMakeYear (number): maximum year " +
                        "For special requests: " +
                        "- 'most expensive' → minprice: 400 " +
                        "- 'cheapest' → maxprice: 100 " +
                        "- 'oldest' → maxMakeYear: 2000 " +
                        "- 'newest' → minMakeYear: 2020")
                };

                var chatRequest = new ChatRequest(messages, tools: tools, toolChoice: "auto");
                var response = await client.ChatEndpoint.GetCompletionAsync(chatRequest);

                if (response.FirstChoice.Message.ToolCalls != null && response.FirstChoice.Message.ToolCalls.Count > 0)
                {
                    foreach (var toolCall in response.FirstChoice.Message.ToolCalls)
                    {
                        Console.WriteLine($"{response.FirstChoice.Message.Role}: {toolCall.Function.Name} | Finish Reason: {response.FirstChoice.FinishReason}");
                        Console.WriteLine($"Tool arguments: {toolCall.Function.Arguments}");

                        try
                        {
                            var functionResult = await toolCall.InvokeFunctionAsync<string>();
                            Console.WriteLine($"SQL Query result: {functionResult}");

                            var rezultat = await _postareRepository.execQuery(functionResult);
                            Console.WriteLine($"Query returned {rezultat?.Count() ?? 0} results");

                            if (rezultat == null || !rezultat.Any())
                            {
                                Console.WriteLine("No results found with specific criteria, trying fallback...");
                                // Încearcă o căutare mai largă dacă nu găsește rezultate
                                var fallbackQuery = "SELECT * FROM [dbo].[postare] WHERE 1=1";
                                rezultat = await _postareRepository.execQuery(fallbackQuery);
                                Console.WriteLine($"Fallback query returned {rezultat?.Count() ?? 0} results");
                            }

                            if (rezultat == null || !rezultat.Any())
                            {
                                throw new Exception("No cars found matching your criteria");
                            }

                            return rezultat.Select(po => new PostareDTO
                            {
                                id = po.PostareId,
                                userId = po.UserId,
                                titlu = po.titlu,
                                descriere = po.descriere,
                                pret = po.pret,
                                firma = po.firma,
                                model = po.model,
                                kilometraj = po.kilometraj,
                                anFabricatie = po.anFabricatie,
                                talon = po.talon,
                                carteIdentitateMasina = po.carteIdentitateMasina,
                                culoare = po.culoare,
                                asigurare = po.asigurare,
                                locatie = po.adresa_user,
                                locatie_formala = po.adresa_formala
                            });
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error invoking function: {ex.Message}");
                            throw new Exception($"Error processing search: {ex.Message}");
                        }
                    }
                }
                else
                {
                    Console.WriteLine("No tool calls found in response");
                    throw new Exception("I can only help you find cars. Please describe what kind of car you're looking for.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetInfo: {ex.Message}");
                throw new Exception($"Search failed: {ex.Message}");
            }

            throw new Exception("Please provide more details about the car you're looking for");
        }

        public async Task<OpenAIDTO> GetDescription(OpenAIDTO prompt)
        {
            var messages = new List<Message>
            {
                new Message(Role.System, "You are a helpful assistant that will help users better format their content. " +
                "The user wants to advertise their car rental and wants to enhance their description. " +
                "Reply with just the description the user might want to use. Enhance the description in the requested language." +
                " Make the description as presentable as possible, including bullet points (where possible)," +
                " new lines, missing details you think the owner might want to include, or any other enhancements you can think of."+
                "If the user specifies just the car and the year, come up with details of the car buyers might want to know of."+
                "Reply with 'I don't know how to respond' if you think what the user said doesn't look like a car advertisal description."+
                "The users are always people, not companies."),
                new Message(Role.User, prompt.prompt)
            };
            var chatRequest = new ChatRequest(messages, Model.GPT3_5_Turbo);
            var response = await client.ChatEndpoint.GetCompletionAsync(chatRequest);
            var choice = response.FirstChoice;
            if (choice == null)
            {
                throw new NotFoundException("No response from OpenAI");
            }
            return new OpenAIDTO { prompt = choice.Message };
        }
    }
}