using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Vrooom.Models;
namespace Vrooom.Data
{
    public class VrooomDbContext : IdentityDbContext<User, IdentityRole<int>, int>
    {
        public VrooomDbContext(DbContextOptions dbContextOptions) : base(dbContextOptions)
        {
        }
        public DbSet<User> User { get; set; }

        public DbSet<Card> Card { get; set; }

        public DbSet<Postare> Postare { get; set; }

        public DbSet<Review> Review { get; set; }

        public DbSet<Chirie> Chirie { get; set; }
        public object CardDTO { get; internal set; }
        public DbSet<Support> Support { get; set; }

        public DbSet<Postare> Postari { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Support>();
            modelBuilder.Entity<Chirie>()
                .HasKey(c => c.ChirieId);

            modelBuilder.Entity<Chirie>()
                .HasOne(c => c.User)
                .WithMany(u => u.chirie)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Chirie>()
                .HasOne(c => c.Postare)
                .WithMany(p => p.chirie)
                .HasForeignKey(c => c.PostareId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Review>()
                .HasKey(r => r.ReviewId);

            modelBuilder.Entity<Review>()
                .HasOne(r => r.User)
                .WithMany(u => u.review)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Postare)
                .WithMany(p => p.review)
                .HasForeignKey(r => r.PostareId)
                .OnDelete(DeleteBehavior.Restrict);

            base.OnModelCreating(modelBuilder);
        }
    }
}