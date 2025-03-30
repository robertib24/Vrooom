using System.ComponentModel.DataAnnotations;

namespace ProiectMDS.Models
{
    public class Postare
    {
        [Key]
        public int PostareId { get; set; }
        public int UserId {  get; set; }

        public string titlu {  get; set; }

        public string descriere { get; set; }

        public int pret {  get; set; }

        public string firma {  get; set; }

        public string model {  get; set; }

        public int kilometraj { get; set; }

        public int anFabricatie {  get; set; }

        public string talon {  get; set; }
        public string culoare { get; set; }

        public string carteIdentitateMasina { get; set; }

        public string asigurare {  get; set; }
        public int nrImagini { get; set; }
        public double latitudine { get; set; }
        public double longitudine { get; set; }
        public string adresa_user { get; set; }
        public string adresa_formala { get; set; }

        public virtual User User {  get; set; }

        public ICollection<Chirie>? chirie {  get; set; }

        public ICollection<Review>? review {  get; set; }
    }
}
