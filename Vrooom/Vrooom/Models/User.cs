using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Vrooom.Models
{
    public class User:IdentityUser<int>
    {
        public string nume { get; set; }

        public string prenume { get; set; }

        public string carteIdentitate {  get; set; }

        public string? permis {  get; set; }
        public DateTime dataNasterii { get; set; }

        public string pozaProfil { get; set; }

        public int puncteFidelitate { get; set; }

        public ICollection<Card>? card {  get; set; }

        public ICollection<Review>? review {  get; set; }

        public ICollection<Postare>? postare {  get; set; }

        public ICollection<Chirie>? chirie {  get; set; }
        public bool UserNameConfirmed { get; set; }
     


    }
}
