using Vrooom.Models;
using Vrooom.Models.DTOs;
using Vrooom.Services.ChirieServices;
using Vrooom.Services.PostareServices;
using VrooomTestConsole;
/*
// ------------------ CHIRIE SERVICE ------------------

var chirieRepo = new DummyChirieRepo();
var chirieService = new ChirieService(chirieRepo);

// TEST 1: Adăugare chirie validă
Console.WriteLine("\n--- Test 1: AddChirie valid ---");
await chirieService.AddChirie(new ChirieDTO
{
    UserId = 1,
    PostareId = 1,
    MasinaId = 10,
    DataStart = DateTime.Today,
    DataStop = DateTime.Today.AddDays(3)
});
Console.WriteLine("Chirie adăugată.");

// TEST 2: Suprapunere chirie
Console.WriteLine("\n--- Test 2: Suprapunere chirie ---");
try
{
    await chirieService.AddChirie(new ChirieDTO
    {
        UserId = 2,
        PostareId = 2,
        MasinaId = 10,
        DataStart = DateTime.Today.AddDays(2),
        DataStop = DateTime.Today.AddDays(4)
    });
}
catch (Exception ex)
{
    Console.WriteLine($"Mesaj asteptat: {ex.Message}");
}

// TEST 3: ChirieByDataStart
var chiriiStart = await chirieService.ChirieByDataStart(DateTime.Today);
Console.WriteLine($"Chirii găsite cu DataStart = azi: {chiriiStart.Count()}");

// TEST 4: Update chirie invalidă (dată greșită)
Console.WriteLine("\n--- Test 4: UpdateChirie cu dată invalidă ---");
try
{
    await chirieService.UpdateChirie(new ChirieDTO
    {
        UserId = 1,
        PostareId = 1,
        MasinaId = 10,
        DataStart = DateTime.Today.AddDays(5),
        DataStop = DateTime.Today.AddDays(2)
    }, 1);
}
catch (Exception ex)
{
    Console.WriteLine($"Mesaj: {ex.Message}");
}

// TEST 5: Ștergere chirie
await chirieService.DeleteChirie(1);
Console.WriteLine("Chirie stearsă.");


// ------------------ POSTARE SERVICE ------------------

var postRepo = new DummyPostareRepo();
var postService = new PostareService(postRepo);

// TEST 6: Add postare
Console.WriteLine("\n--- Test 6: AddPostare ---");
var postDto = new PostareDTO
{
    UserId = 1,
    Titlu = "BMW seria 3",
    Descriere = "Masina în stare excelentă.",
    Pret = 15000,
    Firma = "BMW",
    Model = "Seria 3",
    Kilometraj = 80000,
    AnFabricatie = 2018
};
await postService.AddPostare(postDto);
Console.WriteLine("Postare adăugată.");

// TEST 7: GetAllPosts
var toatePostarile = await postService.GetAllPosts();
Console.WriteLine($"Total postări: {toatePostarile.Count()}");

// TEST 8: PostByTitle
var filtrate = await postService.PostByTitle("BMW");
Console.WriteLine($"Postări filtrate după titlu 'BMW': {filtrate.Count()}");

// TEST 9: PostNumberByUserID
var nr = await postService.PostNumberByUserID(1);
Console.WriteLine($"Număr postări utilizator 1: {nr}");

// TEST 10: Update postare
var actualizareDto = toatePostarile.First();
actualizareDto.Descriere = "Actualizare descriere!";
await postService.UpdatePostare(actualizareDto);
Console.WriteLine("Postare actualizată cu succes.");
*/

/*using Vrooom.Models.DTOs;
using Vrooom.Services.ReviewServices;
using VrooomTestConsole;

var reviewRepo = new DummyReviewRepo();
var reviewService = new ReviewService(reviewRepo);

// Adăugare review
await reviewService.AddReview(new ReviewDTO
{
    Comentariu = "Excelent!",
    Rating = 5,
    Data = DateTime.Now
}, postareID: 1, userID: 1);

// Adăugare review suplimentar
await reviewService.AddReview(new ReviewDTO
{
    Comentariu = "Slab.",
    Rating = 2,
    Data = DateTime.Now.AddDays(-1)
}, postareID: 1, userID: 2);

// Afișare după rating descrescător
var revDesc = await reviewService.ReviewByRatingDesc();
Console.WriteLine("\nReview-uri sortate descrescător după rating:");
foreach (var r in revDesc)
    Console.WriteLine($"- {r.Rating} stele: {r.Comentariu}");

// Update
await reviewService.UpdateReview(new ReviewDTO
{
    Comentariu = "Foarte bun!",
    Rating = 4,
    Data = DateTime.Now
}, id: 1);

// Ștergere
await reviewService.DeleteReview(2);

// Verificare finală
var ramase = await reviewService.GetReviewByDateAsc();
Console.WriteLine("\nReview-uri rămase:");
foreach (var r in ramase)
    Console.WriteLine($"- {r.Data:dd.MM.yyyy}: {r.Comentariu} (Rating: {r.Rating})");
*/

using Vrooom.Models.DTOs;
using Vrooom.Services.SupportServices;

// Inițializare servicii
var supportRepo = new DummySupportRepo();
var supportService = new SupportService(supportRepo);

// Test 1: Adaugă un ticket
var support1 = new SupportDTO
{
    UserId = 1,
    Subiect = "Problema la autentificare",
    Mesaj = "Nu pot să mă loghez.",
};

await supportService.AddSupport(support1);
Console.WriteLine(" Support adăugat.");

// Test 2: Afișează toate tichetele
var all = await supportService.GetAllSupports();
Console.WriteLine($"Tichete totale: {all.Count()}");

// Test 3: Caută după user
var userSupports = await supportService.GetSupportByUserID(1);
Console.WriteLine($"Tichete pentru user 1: {userSupports.Count()}");

// Test 4: Răspunde la un support
var ticket = all.First();
ticket.Raspuns = "Resetează parola.";
await supportService.ReplySupport(ticket);
await supportService.replyEmail(ticket);
Console.WriteLine(" Răspuns trimis.");

// Test 5: Confirmă actualizare
var actualizat = (await supportService.GetSupportBySupportID(ticket.Id)).FirstOrDefault();
Console.WriteLine($"Status actual: {actualizat?.Status}, Răspuns: {actualizat?.Raspuns}");
