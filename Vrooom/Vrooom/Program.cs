using Microsoft.EntityFrameworkCore;
using Vrooom.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<VrooomDbContext>(options =>
options.UseSqlServer(builder.Configuration.GetConnectionString("VrooomDbConnectionString")));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(policy =>
{
    policy
        .AllowAnyMethod()
        .AllowAnyHeader() 
        .AllowAnyOrigin();
});

app.UseAuthorization();

app.MapControllers();

app.Run();
