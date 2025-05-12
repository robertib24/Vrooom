using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Vrooom.Models;
using Vrooom.Models.Enum;

namespace Vrooom.Data
{
    public class DbInitializer
    {
        public static async Task Initialize(IApplicationBuilder app)
        {
            using (var scope = app.ApplicationServices.CreateScope())
            {
                var services = scope.ServiceProvider;
                var dbContext = services.GetRequiredService<VrooomDbContext>();
                var userManager = services.GetRequiredService<UserManager<User>>();
                var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
                var logger = services.GetRequiredService<ILogger<DbInitializer>>();

                try
                {
                    Console.WriteLine("Verificăm și inițializăm baza de date...");

                    bool dbExists = await dbContext.Database.CanConnectAsync();

                    if (dbExists)
                    {
                        Console.WriteLine("Baza de date există. Verificăm dacă tabelele sunt prezente...");

                        try
                        {
                            Console.WriteLine("Ștergem baza de date existentă...");
                            await dbContext.Database.EnsureDeletedAsync();
                            Console.WriteLine("Baza de date a fost ștearsă cu succes.");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Nu s-a putut șterge baza de date: {ex.Message}");
                            Console.WriteLine("Continuăm cu baza de date existentă și încercăm să populăm date noi.");
                        }
                    }

                    Console.WriteLine("Creăm sau asigurăm că baza de date există...");
                    await dbContext.Database.EnsureCreatedAsync();
                    Console.WriteLine("Baza de date a fost creată sau verificată cu succes.");

                    Console.WriteLine("Inițializăm rolurile...");
                    await InitializeRoles(roleManager);
                    Console.WriteLine("Rolurile au fost inițializate cu succes.");

                    Console.WriteLine("Adăugăm datele de test...");
                    await SeedSampleData(dbContext, userManager);
                    Console.WriteLine("Datele de test au fost adăugate cu succes.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "A apărut o eroare în timpul inițializării bazei de date.");
                    Console.WriteLine($"EROARE: {ex.Message}");

                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"InnerException: {ex.InnerException.Message}");
                    }
                }
            }
        }

        private static async Task InitializeRoles(RoleManager<IdentityRole<int>> roleManager)
        {
            foreach (var roleName in Enum.GetNames(typeof(Roles)))
            {
                var roleExists = await roleManager.RoleExistsAsync(roleName);
                if (!roleExists)
                {
                    await roleManager.CreateAsync(new IdentityRole<int>(roleName));
                }
            }
        }

        private static async Task SeedSampleData(VrooomDbContext dbContext, UserManager<User> userManager)
        {
            if (!dbContext.Users.Any())
            {
                var placeholderUrl = "https://vrooom1224.s3.eu-central-1.amazonaws.com/placeholder.png";

                var adminUser = new User
                {
                    UserName = "admin",
                    Email = "admin@vrooom.com",
                    EmailConfirmed = true,
                    nume = "Administrator",
                    prenume = "Sistem",
                    PhoneNumber = "0723456789",
                    PhoneNumberConfirmed = true,
                    carteIdentitate = "N/A",
                    permis = "N/A",
                    dataNasterii = new DateTime(1990, 1, 1),
                    pozaProfil = placeholderUrl,
                    puncteFidelitate = 0
                };

                var result = await userManager.CreateAsync(adminUser, "Admin123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, Roles.Admin.ToString());
                }

                var ownerUser = new User
                {
                    UserName = "proprietar",
                    Email = "proprietar@vrooom.com",
                    EmailConfirmed = true,
                    nume = "Popescu",
                    prenume = "Ion",
                    PhoneNumber = "0734567890",
                    PhoneNumberConfirmed = true,
                    carteIdentitate = placeholderUrl,
                    permis = "N/A",
                    dataNasterii = new DateTime(1985, 5, 15),
                    pozaProfil = placeholderUrl,
                    puncteFidelitate = 0
                };

                result = await userManager.CreateAsync(ownerUser, "Proprietar123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(ownerUser, Roles.Proprietar.ToString());
                }

                var renterUser = new User
                {
                    UserName = "chirias",
                    Email = "chirias@vrooom.com",
                    EmailConfirmed = true,
                    nume = "Ionescu",
                    prenume = "Maria",
                    PhoneNumber = "0745678901",
                    PhoneNumberConfirmed = true,
                    carteIdentitate = "N/A",
                    permis = placeholderUrl,
                    dataNasterii = new DateTime(1992, 8, 20),
                    pozaProfil = placeholderUrl,
                    puncteFidelitate = 25
                };

                result = await userManager.CreateAsync(renterUser, "Chirias123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(renterUser, Roles.Chirias.ToString());
                }

                if (!dbContext.Postare.Any())
                {
                    var ownerId = dbContext.Users.FirstOrDefault(u => u.UserName == "proprietar")?.Id ?? 0;

                    if (ownerId > 0)
                    {
                        var carListings = new List<Postare>
                        {
                            new Postare
                            {
                                UserId = ownerId,
                                titlu = "Dacia Logan 2022 - Mașină economică și fiabilă",
                                descriere = "Dacia Logan model 2022, perfectă pentru deplasări în oraș sau călătorii. Consum redus de combustibil, spațioasă și întreținută excelent. Disponibilă pentru închiriere cu prețuri accesibile. Rezervă acum pentru o experiență de condus fără griji!",
                                pret = 30,
                                firma = "Dacia",
                                model = "Logan",
                                kilometraj = 25000,
                                anFabricatie = 2022,
                                talon = placeholderUrl,
                                culoare = "white",
                                carteIdentitateMasina = placeholderUrl,
                                asigurare = placeholderUrl,
                                nrImagini = 4,
                                latitudine = 46.7712,
                                longitudine = 23.6236,
                                adresa_user = "Cluj-Napoca, Romania",
                                adresa_formala = "Strada Memorandumului 28, Cluj-Napoca 400114, Romania"
                            },
                            new Postare
                            {
                                UserId = ownerId,
                                titlu = "Mercedes-Benz S-Class - Lux și confort suprem",
                                descriere = "Cel mai recent model Mercedes-Benz S-Class, mașina perfectă pentru evenimente speciale sau călătorii de afaceri. Interior din piele, sistem audio premium Burmester, scaune cu masaj și toate dotările de lux. Impresionează-ți partenerii de afaceri sau bucură-te de un weekend special!",
                                pret = 150,
                                firma = "Mercedes-Benz",
                                model = "S-Class",
                                kilometraj = 15000,
                                anFabricatie = 2023,
                                talon = placeholderUrl,
                                culoare = "black",
                                carteIdentitateMasina = placeholderUrl,
                                asigurare = placeholderUrl,
                                nrImagini = 6,
                                latitudine = 46.7674,
                                longitudine = 23.5907,
                                adresa_user = "Cluj-Napoca, Romania",
                                adresa_formala = "Strada Horea 68, Cluj-Napoca 400275, Romania"
                            },
                            new Postare
                            {
                                UserId = ownerId,
                                titlu = "Ferrari 488 - Simte adrenalina unui supercar italian",
                                descriere = "Ferrari 488 roșu, experiența supremă pentru iubitorii de mașini sport. Motor V8 twin-turbo, 670 CP, 0-100 km/h în 3 secunde. Disponibil pentru închiriere pe perioade scurte pentru evenimente speciale sau weekenduri. Permis de conducere cu minimum 5 ani experiență necesar. Trăiește visul italian!",
                                pret = 500,
                                firma = "Ferrari",
                                model = "488",
                                kilometraj = 8000,
                                anFabricatie = 2021,
                                talon = placeholderUrl,
                                culoare = "red",
                                carteIdentitateMasina = placeholderUrl,
                                asigurare = placeholderUrl,
                                nrImagini = 8,
                                latitudine = 46.7722,
                                longitudine = 23.6216,
                                adresa_user = "Cluj-Napoca, Romania",
                                adresa_formala = "Piața Unirii, Cluj-Napoca 400313, Romania"
                            },
                            new Postare
                            {
                                UserId = ownerId,
                                titlu = "Volkswagen Golf - Mașina ideală pentru orașul aglomerat",
                                descriere = "Volkswagen Golf, compactă, economică și ușor de parcat în oraș. Consum de doar 5.5L/100km în regim mixt, perfectă pentru studenți sau cei cu buget limitat. Interior curat și bine întreținut, sistem multimedia cu Android Auto și Apple CarPlay. Disponibilă pentru închiriere imediată!",
                                pret = 40,
                                firma = "Volkswagen",
                                model = "Golf",
                                kilometraj = 45000,
                                anFabricatie = 2020,
                                talon = placeholderUrl,
                                culoare = "blue",
                                carteIdentitateMasina = placeholderUrl,
                                asigurare = placeholderUrl,
                                nrImagini = 3,
                                latitudine = 46.7680,
                                longitudine = 23.5880,
                                adresa_user = "Cluj-Napoca, Romania",
                                adresa_formala = "Strada Napoca 8, Cluj-Napoca 400026, Romania"
                            },
                            new Postare
                            {
                                UserId = ownerId,
                                titlu = "Tesla Model 3 - Viitorul mobilității fără emisii",
                                descriere = "Tesla Model 3 electrică, cu autonomie de peste 450 km. Zero emisii, zero zgomot, accelerație uluitoare. Dotată cu Autopilot, ecran touch central de 15\", internet wireless și actualizări software periodice. Stații de încărcare disponibile în toată țara. Experimentează viitorul mobilității!",
                                pret = 100,
                                firma = "Tesla",
                                model = "Model 3",
                                kilometraj = 20000,
                                anFabricatie = 2022,
                                talon = placeholderUrl,
                                culoare = "white",
                                carteIdentitateMasina = placeholderUrl,
                                asigurare = placeholderUrl,
                                nrImagini = 5,
                                latitudine = 46.7733,
                                longitudine = 23.6172,
                                adresa_user = "Cluj-Napoca, Romania",
                                adresa_formala = "Bulevardul 21 Decembrie 1989 67, Cluj-Napoca 400124, Romania"
                            },
                            new Postare
                            {
                                UserId = ownerId,
                                titlu = "Jeep Wrangler - Aventură off-road garantată",
                                descriere = "Jeep Wrangler Rubicon, pregătit pentru orice aventură off-road. Tracțiune 4x4, suspensie ridicată, anvelope de teren și tot ce ai nevoie pentru a explora trasee montane sau zone cu acces dificil. Disponibil pentru închiriere cu sfaturi despre cele mai bune trasee off-road din zonă. Rezervă acum pentru weekend-ul tău aventuros!",
                                pret = 120,
                                firma = "Jeep",
                                model = "Wrangler",
                                kilometraj = 35000,
                                anFabricatie = 2021,
                                talon = placeholderUrl,
                                culoare = "green",
                                carteIdentitateMasina = placeholderUrl,
                                asigurare = placeholderUrl,
                                nrImagini = 7,
                                latitudine = 46.7690,
                                longitudine = 23.5950,
                                adresa_user = "Cluj-Napoca, Romania",
                                adresa_formala = "Strada Cardinal Iuliu Hossu 1, Cluj-Napoca 400029, Romania"
                            },
                            new Postare
                            {
                                UserId = ownerId,
                                titlu = "Trabant 601 - Nostalgie pură din era comunistă",
                                descriere = "Trabant 601 din 1980, complet restaurat și funcțional. O experiență unică de a conduce un vehicul iconic al epocii comuniste. Perfect pentru evenimente tematice, ședințe foto retro sau pur și simplu pentru a trăi o experiență autentică. Nu rata ocazia de a încerca această mașină simbol al istoriei!",
                                pret = 55,
                                firma = "Trabant",
                                model = "601",
                                kilometraj = 95000,
                                anFabricatie = 1980,
                                talon = placeholderUrl,
                                culoare = "beige",
                                carteIdentitateMasina = placeholderUrl,
                                asigurare = placeholderUrl,
                                nrImagini = 4,
                                latitudine = 46.7650,
                                longitudine = 23.5890,
                                adresa_user = "Cluj-Napoca, Romania",
                                adresa_formala = "Strada Iuliu Maniu 3, Cluj-Napoca 400095, Romania"
                            }
                        };

                        await dbContext.Postare.AddRangeAsync(carListings);
                        await dbContext.SaveChangesAsync();
                    }
                }

                if (!dbContext.Review.Any())
                {
                    var renterId = dbContext.Users.FirstOrDefault(u => u.UserName == "chirias")?.Id ?? 0;
                    var ferrariId = dbContext.Postare.FirstOrDefault(p => p.model == "488")?.PostareId ?? 0;
                    var teslaId = dbContext.Postare.FirstOrDefault(p => p.model == "Model 3")?.PostareId ?? 0;
                    var trabantId = dbContext.Postare.FirstOrDefault(p => p.model == "601")?.PostareId ?? 0;

                    if (renterId > 0)
                    {
                        var reviews = new List<Review>();

                        if (ferrariId > 0)
                        {
                            reviews.Add(new Review
                            {
                                UserId = renterId,
                                PostareId = ferrariId,
                                titlu = "Experiență de neuitat!",
                                comentariu = "Am închiriat Ferrari-ul pentru ziua mea de naștere și a fost cea mai bună decizie! Mașina este impecabilă, performanța este uluitoare, iar proprietarul a fost foarte amabil și profesionist. Recomand cu încredere!",
                                rating = 5,
                                dataReview = DateTime.Now.AddDays(-15)
                            });
                        }

                        if (teslaId > 0)
                        {
                            reviews.Add(new Review
                            {
                                UserId = renterId,
                                PostareId = teslaId,
                                titlu = "Prima mea experiență cu o mașină electrică",
                                comentariu = "A fost prima dată când am condus o mașină electrică și pot spune că Tesla Model 3 m-a convins să-mi schimb următoarea mașină. Accelerație instantanee, silențioasă și foarte tehnologizată. Autopilot-ul funcționează excelent pe autostradă!",
                                rating = 5,
                                dataReview = DateTime.Now.AddDays(-8)
                            });
                        }

                        if (trabantId > 0)
                        {
                            reviews.Add(new Review
                            {
                                UserId = renterId,
                                PostareId = trabantId,
                                titlu = "O călătorie în timp nostalgică",
                                comentariu = "Am închiriat Trabantul pentru o sesiune foto tematică și toată lumea a fost încântată. Mașina este bine întreținută pentru vârsta ei, dar fiți pregătiți pentru o experiență autentică - fără servodirecție, fără aer condiționat, doar nostalgie pură!",
                                rating = 4,
                                dataReview = DateTime.Now.AddDays(-3)
                            });
                        }

                        if (reviews.Any())
                        {
                            await dbContext.Review.AddRangeAsync(reviews);
                            await dbContext.SaveChangesAsync();
                        }
                    }
                }

                if (!dbContext.Chirie.Any())
                {
                    var renterId = dbContext.Users.FirstOrDefault(u => u.UserName == "chirias")?.Id ?? 0;
                    var teslaId = dbContext.Postare.FirstOrDefault(p => p.model == "Model 3")?.PostareId ?? 0;
                    var mercedesId = dbContext.Postare.FirstOrDefault(p => p.model == "S-Class")?.PostareId ?? 0;

                    if (renterId > 0)
                    {
                        var rentals = new List<Chirie>();

                        if (teslaId > 0)
                        {
                            rentals.Add(new Chirie
                            {
                                UserId = renterId,
                                PostareId = teslaId,
                                dataStart = DateTime.Now.AddDays(3),
                                dataStop = DateTime.Now.AddDays(7)
                            });
                        }

                        if (mercedesId > 0)
                        {
                            rentals.Add(new Chirie
                            {
                                UserId = renterId,
                                PostareId = mercedesId,
                                dataStart = DateTime.Now.AddDays(15),
                                dataStop = DateTime.Now.AddDays(17)
                            });
                        }

                        if (rentals.Any())
                        {
                            await dbContext.Chirie.AddRangeAsync(rentals);
                            await dbContext.SaveChangesAsync();
                        }
                    }
                }

                if (!dbContext.Support.Any())
                {
                    var renterId = dbContext.Users.FirstOrDefault(u => u.UserName == "chirias")?.Id ?? 0;
                    var ownerId = dbContext.Users.FirstOrDefault(u => u.UserName == "proprietar")?.Id ?? 0;

                    var supportTickets = new List<Support>();

                    if (renterId > 0)
                    {
                        supportTickets.Add(new Support
                        {
                            SupportId = 1,
                            UserId = renterId,
                            titlu = "Întrebare despre metode de plată",
                            comentariu = "Bună ziua, aș dori să știu dacă puteți introduce și alte metode de plată, cum ar fi Revolut sau PayPal? Mulțumesc!"
                        });
                    }

                    if (ownerId > 0)
                    {
                        supportTickets.Add(new Support
                        {
                            SupportId = 2,
                            UserId = ownerId,
                            titlu = "Problemă la încărcarea imaginilor",
                            comentariu = "Bună ziua, încerc să adaug mai multe imagini pentru mașina mea nouă, dar primesc o eroare la încărcare. Puteți să mă ajutați cu această problemă?"
                        });
                    }

                    if (supportTickets.Any())
                    {
                        await dbContext.Support.AddRangeAsync(supportTickets);
                        await dbContext.SaveChangesAsync();
                    }
                }
            }
        }
    }
}