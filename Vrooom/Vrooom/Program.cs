using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using Amazon.S3;
using SendGrid.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Identity;
using Vrooom.Data;
using Vrooom.Models;
using Vrooom.Services;
using Vrooom.Repos.CardRepos;
using Vrooom.Services.CardServices;
using Vrooom.Services.ChirieServices;
using Vrooom.Services.GoogleServices;
using Vrooom.Services.OpenAIServices;
using Vrooom.Services.PostareServices;
using Vrooom.Services.ReviewServices;
using Vrooom.Services.S3Services;
using Vrooom.Services.SupportServices;
using Vrooom.Repos;
using Vrooom.Repos.ChirieRepos;
using Vrooom.Repos.ChirieRepo;
using Vrooom.Repos.PostareRepo;
using Vrooom.Repos.PostareRepos;
using Vrooom.Repos.ReviewRepo;
using Vrooom.Repos.ReviewRepos;
using Vrooom.Repos.SupportRepo;
using Vrooom.Repos.SupportRepos;
using Vrooom.Services.UserServices;

var builder = WebApplication.CreateBuilder(args);

// Enhanced logging configuration
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Set minimum log level for better debugging
if (builder.Environment.IsDevelopment())
{
    builder.Logging.SetMinimumLevel(LogLevel.Information);
}

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Load configuration files
builder.Configuration.AddJsonFile("env.json", optional: true);

// Database context
builder.Services.AddDbContext<VrooomDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("AzureConnectionString")));

// Repository services
builder.Services.AddScoped<ICardRepo, CardRepo>();
builder.Services.AddScoped<ICardService, CardService>();

builder.Services.AddScoped<IChirieRepo, ChirieRepo>();
builder.Services.AddScoped<IChirieService, ChirieService>();

builder.Services.AddScoped<IPostareRepo, PostareRepo>();
builder.Services.AddScoped<IPostareService, PostareService>();

builder.Services.AddScoped<IReviewRepo, ReviewRepo>();
builder.Services.AddScoped<IReviewService, ReviewService>();

builder.Services.AddScoped<ISupportRepo, SupportRepo>();
builder.Services.AddScoped<ISupportService, SupportService>();

builder.Services.AddScoped<IOpenAIService, OpenAIService>();
builder.Services.AddScoped<IGoogleService, GoogleService>();

// SendGrid configuration
builder.Services.Configure<SendGridSettings>(builder.Configuration.GetSection("SendGridSettings"));
builder.Services.AddSendGrid(options =>
    options.ApiKey = builder.Configuration.GetSection("SendGridSettings").GetValue<string>("SendGridKey")
);

// Identity configuration with enhanced settings
builder.Services.AddIdentity<User, IdentityRole<int>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.User.RequireUniqueEmail = true;

    // Email confirmation settings
    options.SignIn.RequireConfirmedEmail = true;
    options.SignIn.RequireConfirmedAccount = false;

    // Token settings
    options.Tokens.EmailConfirmationTokenProvider = TokenOptions.DefaultEmailProvider;
})
.AddEntityFrameworkStores<VrooomDbContext>()
.AddDefaultTokenProviders();

// Configure token lifespan
builder.Services.Configure<DataProtectionTokenProviderOptions>(opt =>
    opt.TokenLifespan = TimeSpan.FromHours(24)); // Email confirmation tokens valid for 24 hours

builder.Services.AddScoped<IUserService, UserService>();

// AWS S3 configuration
builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
builder.Services.AddAWSService<IAmazonS3>();
builder.Services.AddScoped<IS3Service, S3Service>(provider =>
{
    var s3Client = provider.GetRequiredService<IAmazonS3>();
    var bucketName = "vrooom1224";
    return new S3Service(s3Client, bucketName);
});

// Email sender
builder.Services.AddScoped<IEmailSender, EmailSender>();

// Swagger configuration
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Name = "Authorization",
        Description = "Bearer Authentication with JWT Token",
        Type = SecuritySchemeType.Http
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Id = "Bearer",
                    Type = ReferenceType.SecurityScheme
                }
            },
            new List<string>()
        }
    });
});

// JWT Authentication
builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateActor = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),
        RoleClaimType = ClaimTypes.Role
    };
});

// Authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

var app = builder.Build();

// CORS configuration
app.UseCors(builder =>
{
    builder
        .WithOrigins("http://localhost:4200")
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowAnyOrigin();
});

app.Use(async (context, next) =>
{
    context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
    await next.Invoke();
});

await Seed.InitializeRoles(app);
// Uncomment the line below to seed sample data (only run once)
// await DbInitializer.Initialize(app);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("🚀 Application starting in Development mode");
    logger.LogInformation($"📧 SendGrid API Key configured: {!string.IsNullOrEmpty(builder.Configuration.GetSection("SendGridSettings").GetValue<string>("SendGridKey"))}");
    logger.LogInformation($"🗄️ Database connection: {builder.Configuration.GetConnectionString("AzureConnectionString")?.Substring(0, 50)}...");
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
startupLogger.LogInformation("✅ Vrooom application started successfully");
startupLogger.LogInformation($"🌐 Environment: {app.Environment.EnvironmentName}");
startupLogger.LogInformation($"🔧 Configuration loaded from: appsettings.{app.Environment.EnvironmentName}.json");

app.Run();