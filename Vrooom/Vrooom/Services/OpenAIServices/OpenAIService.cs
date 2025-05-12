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
        /// </summary

        private static string ultCaract(string originalString, string substring)
        {
            int index = originalString.LastIndexOf(substring);
            if (index == -1)
                return originalString;
            return originalString.Remove(index, substring.Length);
        }
        /// <summary>
        /// Functie apelata de Tool,ce trimite toti parametri pe care i-a extras din prompt-ul userului
        /// Parseaza si returneaz un query SSMS ce va extrage ceea ce vrea userul
        /// </summary>
        private async Task<string> CreateCarQuery(dynamic parameters)
        {
            string query = "SELECT * FROM [dbo].[postare] WHERE 1=1";
            Console.WriteLine(parameters);
            Console.WriteLine(parameters.GetType());
            if (parameters.TryGetProperty("brand", out JsonElement brand) && brand.ValueKind != JsonValueKind.Null)
                query += $" AND firma = '{brand.GetString()}'";
            if (parameters.TryGetProperty("model", out JsonElement model) && model.ValueKind != JsonValueKind.Null)
                query += $" AND model = '{model.GetString()}'";
            if (parameters.TryGetProperty("color", out JsonElement color) && color.ValueKind == JsonValueKind.Array && color.GetArrayLength() > 0)
            {
                query += " AND (";
                foreach (var colorElement in color.EnumerateArray())
                {
                    if (colorElement.ValueKind != JsonValueKind.Null)
                        query += $" culoare LIKE '{colorElement.GetString()}' OR";
                }
                query = ultCaract(query, " OR") + ")";
            }
            if (parameters.TryGetProperty("minMakeYear", out JsonElement minYear) && minYear.ValueKind != JsonValueKind.Null)
                query += $" AND anFabricatie >= {minYear.GetInt32()}";
            if (parameters.TryGetProperty("maxMakeYear", out JsonElement maxYear) && maxYear.ValueKind != JsonValueKind.Null)
                query += $" AND anFabricatie <= {maxYear.GetInt32()}";
            if (parameters.TryGetProperty("mileage", out JsonElement mileage) && mileage.ValueKind != JsonValueKind.Null)
                query += $" AND kilometraj <= {mileage.GetInt32()}";
            if (parameters.TryGetProperty("price", out JsonElement price) && price.ValueKind != JsonValueKind.Null)
                query += $" AND pret <= {price.GetDecimal()}";
            if (parameters.TryGetProperty("minprice", out JsonElement minPrice) && minPrice.ValueKind != JsonValueKind.Null)
                query += $" AND pret >= {minPrice.GetDecimal()}";

            return query;
        }

        public async Task<IEnumerable<PostareDTO>> GetInfo(string prompt)
        {
            var messages = new List<Message>
            {
                new Message(Role.System,"You are a helpful assistant that will help users find their dream car. The user can mention anything about it from just the make or the model, to any specific details they might want."),
                new Message(Role.User, prompt)
            };
            Tool.ClearRegisteredTools();
            var tools = new List<Tool>
            {
                Tool.FromFunc<Dictionary<string, object>, Task<string>>("create_car_query", CreateCarQuery,"Create a SQL SSMS query that gets all the cars with the criteria specified by the user."+
                           "The user might speak other languages other than English. Convert any colors in English. The parameters are: price(number),minprice(number),brand(string),model(string),mileage(number),minMakeYear(number),maxMakeYear(number),color(array of strings).")
            };

            var chatRequest = new ChatRequest(messages, tools: tools, toolChoice: "auto");
            var response = await client.ChatEndpoint.GetCompletionAsync(chatRequest);

            if (response.FirstChoice.Message.ToolCalls != null)
            {
                foreach (var toolCall in response.FirstChoice.Message.ToolCalls)
                {
                    Console.WriteLine($"{response.FirstChoice.Message.Role}: {toolCall.Function.Name} | Finish Reason: {response.FirstChoice.FinishReason}");
                    Console.WriteLine($"{toolCall.Function.Arguments}");

                    var functionResult = await toolCall.InvokeFunctionAsync<string>();
                    messages.Add(new Message(Role.Tool, functionResult));
                    Console.WriteLine($"{Role.Tool}: {functionResult}");
                    var rez = await _postareRepository.execQuery(functionResult);
                    if (rez == null)
                        throw new Exception("No cars found");
                    return rez.Select(po => new PostareDTO
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
                        asigurare = po.asigurare
                    });
                }
            }
            else
            {
                throw new Exception("I can only help you find cars");
            }
            throw new Exception("Please give me more details");
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
