using System.Data;
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
                    Console.WriteLine("🗄️ Verificăm și inițializăm baza de date...");

                    // Verificăm dacă baza de date există
                    bool dbExists = await dbContext.Database.CanConnectAsync();

                    if (dbExists)
                    {
                        Console.WriteLine("🗑️ Baza de date există. O ștergem pentru a o recrea cu structura corectă...");
                        try
                        {
                            await dbContext.Database.EnsureDeletedAsync();
                            Console.WriteLine("✅ Baza de date ștearsă cu succes.");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"⚠️ Nu s-a putut șterge baza de date: {ex.Message}");
                            Console.WriteLine("Continuăm cu baza de date existentă...");
                        }
                    }

                    Console.WriteLine("🏗️ Creăm baza de date cu structura corectă...");
                    await dbContext.Database.EnsureCreatedAsync();
                    Console.WriteLine("✅ Baza de date creată cu succes.");

                    // Verificăm dacă tabelul Support are structura corectă
                    await EnsureSupportTableStructure(dbContext);

                    Console.WriteLine("🔑 Inițializăm rolurile...");
                    await InitializeRoles(roleManager);
                    Console.WriteLine("✅ Rolurile au fost inițializate cu succes.");

                    Console.WriteLine("📊 Adăugăm datele de test...");
                    await SeedSampleData(dbContext, userManager);
                    Console.WriteLine("✅ Datele de test au fost adăugate cu succes.");

                    Console.WriteLine("🎉 Baza de date a fost inițializată complet!");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "❌ A apărut o eroare în timpul inițializării bazei de date.");
                    Console.WriteLine($"EROARE: {ex.Message}");

                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"InnerException: {ex.InnerException.Message}");
                    }
                    throw;
                }
            }
        }

        private static async Task EnsureSupportTableStructure(VrooomDbContext dbContext)
        {
            try
            {
                Console.WriteLine("🔧 Verificăm structura tabelei Support...");

                // Verificăm dacă tabela Support există și are structura corectă
                var connection = dbContext.Database.GetDbConnection();
                await connection.OpenAsync();

                using var command = connection.CreateCommand();
                command.CommandText = @"
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'Support' AND TABLE_SCHEMA = 'dbo'";

                var existingColumns = new List<string>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    existingColumns.Add(reader.GetString("COLUMN_NAME"));
                }
                reader.Close();

                var requiredColumns = new[] { "dummyId", "SupportId", "UserId", "titlu", "comentariu", "Status", "CreatedAt", "ResolvedAt", "ResolvedByUserId" };
                var missingColumns = requiredColumns.Except(existingColumns).ToList();

                if (missingColumns.Any())
                {
                    Console.WriteLine($"⚠️ Lipsesc coloanele: {string.Join(", ", missingColumns)}");
                    Console.WriteLine("🔨 Adăugăm coloanele lipsă...");

                    // Adăugăm coloanele lipsă
                    foreach (var column in missingColumns)
                    {
                        var alterCommand = connection.CreateCommand();
                        alterCommand.CommandText = column switch
                        {
                            "Status" => "ALTER TABLE Support ADD Status NVARCHAR(50) NOT NULL DEFAULT 'Open'",
                            "CreatedAt" => "ALTER TABLE Support ADD CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()",
                            "ResolvedAt" => "ALTER TABLE Support ADD ResolvedAt DATETIME2 NULL",
                            "ResolvedByUserId" => "ALTER TABLE Support ADD ResolvedByUserId INT NULL",
                            _ => null
                        };

                        if (alterCommand.CommandText != null)
                        {
                            try
                            {
                                await alterCommand.ExecuteNonQueryAsync();
                                Console.WriteLine($"✅ Coloana {column} adăugată cu succes.");
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"⚠️ Nu s-a putut adăuga coloana {column}: {ex.Message}");
                            }
                        }
                    }

                    // Adăugăm foreign key constraint pentru ResolvedByUserId dacă nu există
                    try
                    {
                        var fkCommand = connection.CreateCommand();
                        fkCommand.CommandText = @"
                            IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Support_ResolvedByUser')
                            BEGIN
                                ALTER TABLE Support 
                                ADD CONSTRAINT FK_Support_ResolvedByUser 
                                FOREIGN KEY (ResolvedByUserId) 
                                REFERENCES AspNetUsers(Id) 
                                ON DELETE SET NULL
                            END";
                        await fkCommand.ExecuteNonQueryAsync();
                        Console.WriteLine("✅ Foreign key constraint adăugat pentru ResolvedByUserId.");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠️ Nu s-a putut adăuga foreign key constraint: {ex.Message}");
                    }
                }
                else
                {
                    Console.WriteLine("✅ Tabela Support are structura corectă.");
                }

                await connection.CloseAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Eroare la verificarea structurii tabelei Support: {ex.Message}");
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
                    Console.WriteLine($"✅ Rol creat: {roleName}");
                }
            }
        }

        private static async Task SeedSampleData(VrooomDbContext dbContext, UserManager<User> userManager)
        {
            if (!dbContext.Users.Any())
            {
                var placeholderUrl = "https://vrooom1224.s3.eu-central-1.amazonaws.com/placeholder.png";

                Console.WriteLine("👥 Creăm utilizatorii de test...");

                // Admin User
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
                    Console.WriteLine("✅ Admin user creat cu succes.");
                }

                // Owner User
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
                    Console.WriteLine("✅ Owner user creat cu succes.");
                }

                // Renter User
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
                    Console.WriteLine("✅ Renter user creat cu succes.");
                }

                // Adăugăm vehicule
                await SeedVehicles(dbContext, ownerUser.Id);

                // Adăugăm review-uri
                await SeedReviews(dbContext, renterUser.Id);

                // Adăugăm închirieri
                await SeedBookings(dbContext, renterUser.Id);

                // Adăugăm ticket-uri de support cu structura corectă
                await SeedSupportTickets(dbContext, renterUser.Id, ownerUser.Id, adminUser.Id);
            }
        }

        private static async Task SeedVehicles(VrooomDbContext dbContext, int ownerId)
        {
            if (!dbContext.Postare.Any())
            {
                Console.WriteLine("🚗 Adăugăm vehicule de test...");

                var carListings = new List<Postare>
                {
                    new Postare
                    {
                        UserId = ownerId,
                        titlu = "Dacia Logan 2022 - Mașină economică și fiabilă",
                        descriere = "Dacia Logan model 2022, perfectă pentru deplasări în oraș sau călătorii. Consum redus de combustibil, spațioasă și întreținută excelent.",
                        pret = 30,
                        firma = "Dacia",
                        model = "Logan",
                        kilometraj = 25000,
                        anFabricatie = 2022,
                        talon = "https://vrooom1224.s3.eu-central-1.amazonaws.com/placeholder.png",
                        culoare = "grey",
                        carteIdentitateMasina = "https://vrooom1224.s3.eu-central-1.amazonaws.com/placeholder.png",
                        asigurare = "https://vrooom1224.s3.eu-central-1.amazonaws.com/placeholder.png",
                        nrImagini = 4,
                        latitudine = 46.7712,
                        longitudine = 23.6236,
                        adresa_user = "Cluj-Napoca, Romania",
                        adresa_formala = "Strada Memorandumului 28, Cluj-Napoca 400114, Romania"
                    },
                    new Postare
                    {
                        UserId = ownerId,
                        titlu = "Tesla Model 3 - Viitorul mobilității fără emisii",
                        descriere = "Tesla Model 3 electrică, cu autonomie de peste 450 km. Zero emisii, zero zgomot, accelerație uluitoare.",
                        pret = 100,
                        firma = "Tesla",
                        model = "Model 3",
                        kilometraj = 20000,
                        anFabricatie = 2022,
                        talon = "https://vrooom1224.s3.eu-central-1.amazonaws.com/placeholder.png",
                        culoare = "white",
                        carteIdentitateMasina = "https://vrooom1224.s3.eu-central-1.amazonaws.com/placeholder.png",
                        asigurare = "https://vrooom1224.s3.eu-central-1.amazonaws.com/placeholder.png",
                        nrImagini = 5,
                        latitudine = 46.7733,
                        longitudine = 23.6172,
                        adresa_user = "Cluj-Napoca, Romania",
                        adresa_formala = "Bulevardul 21 Decembrie 1989 67, Cluj-Napoca 400124, Romania"
                    }
                };

                await dbContext.Postare.AddRangeAsync(carListings);
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"✅ {carListings.Count} vehicule adăugate cu succes.");
            }
        }

        private static async Task SeedReviews(VrooomDbContext dbContext, int userId)
        {
            if (!dbContext.Review.Any())
            {
                Console.WriteLine("⭐ Adăugăm review-uri de test...");

                var teslaId = dbContext.Postare.FirstOrDefault(p => p.model == "Model 3")?.PostareId ?? 0;

                if (teslaId > 0)
                {
                    var reviews = new List<Review>
                    {
                        new Review
                        {
                            UserId = userId,
                            PostareId = teslaId,
                            titlu = "Prima mea experiență cu o mașină electrică",
                            comentariu = "A fost prima dată când am condus o mașină electrică și pot spune că Tesla Model 3 m-a convins să-mi schimb următoarea mașină.",
                            rating = 5,
                            dataReview = DateTime.Now.AddDays(-8)
                        }
                    };

                    await dbContext.Review.AddRangeAsync(reviews);
                    await dbContext.SaveChangesAsync();
                    Console.WriteLine($"✅ {reviews.Count} review-uri adăugate cu succes.");
                }
            }
        }

        private static async Task SeedBookings(VrooomDbContext dbContext, int userId)
        {
            if (!dbContext.Chirie.Any())
            {
                Console.WriteLine("📅 Adăugăm închirieri de test...");

                var teslaId = dbContext.Postare.FirstOrDefault(p => p.model == "Model 3")?.PostareId ?? 0;

                if (teslaId > 0)
                {
                    var rentals = new List<Chirie>
                    {
                        new Chirie
                        {
                            UserId = userId,
                            PostareId = teslaId,
                            dataStart = DateTime.Now.AddDays(3),
                            dataStop = DateTime.Now.AddDays(7)
                        }
                    };

                    await dbContext.Chirie.AddRangeAsync(rentals);
                    await dbContext.SaveChangesAsync();
                    Console.WriteLine($"✅ {rentals.Count} închirieri adăugate cu succes.");
                }
            }
        }

        private static async Task SeedSupportTickets(VrooomDbContext dbContext, int renterId, int ownerId, int adminId)
        {
            if (!dbContext.Support.Any())
            {
                Console.WriteLine("🎫 Adăugăm ticket-uri de support de test...");

                var supportTickets = new List<Support>
                {
                    // Ticket de la renter
                    new Support
                    {
                        SupportId = 1,
                        UserId = renterId,
                        titlu = "Întrebare despre metode de plată",
                        comentariu = "Bună ziua, aș dori să știu dacă puteți introduce și alte metode de plată, cum ar fi Revolut sau PayPal? Mulțumesc!",
                        Status = "Open",
                        CreatedAt = DateTime.Now.AddDays(-2)
                    },
                    // Răspuns admin la primul ticket
                    new Support
                    {
                        SupportId = 1,
                        UserId = adminId,
                        titlu = "Admin Reply",
                        comentariu = "Bună ziua! Mulțumim pentru sugestie. Suntem în proces de adăugare a mai multor metode de plată, inclusiv Revolut și PayPal. Vă vom ține la curent când vor fi disponibile.",
                        Status = "InProgress",
                        CreatedAt = DateTime.Now.AddDays(-1)
                    },
                    // Ticket de la owner
                    new Support
                    {
                        SupportId = 2,
                        UserId = ownerId,
                        titlu = "Problemă la încărcarea imaginilor",
                        comentariu = "Bună ziua, încerc să adaug mai multe imagini pentru mașina mea nouă, dar primesc o eroare la încărcare. Puteți să mă ajutați cu această problemă?",
                        Status = "Open",
                        CreatedAt = DateTime.Now.AddDays(-3)
                    },
                    // Ticket rezolvat
                    new Support
                    {
                        SupportId = 3,
                        UserId = renterId,
                        titlu = "Probleme cu aplicația mobile",
                        comentariu = "Aplicația se închide când încerc să fac o rezervare.",
                        Status = "Resolved",
                        CreatedAt = DateTime.Now.AddDays(-7),
                        ResolvedAt = DateTime.Now.AddDays(-5),
                        ResolvedByUserId = adminId
                    }
                };

                await dbContext.Support.AddRangeAsync(supportTickets);
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"✅ {supportTickets.Count} ticket-uri de support adăugate cu succes.");
            }
        }
    }
}