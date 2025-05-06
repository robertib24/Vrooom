using System.ComponentModel.DataAnnotations;

namespace Vrooom.Models
{
    public class Postare
    {
        [Key]
        public int Id { get; set; }

        public int PostareId { get; set; }
        public int UserId {  get; set; }

        public string Titlu {  get; set; }

        public string Descriere { get; set; }

        public int Pret {  get; set; }

        public string Firma {  get; set; }

        public string Model {  get; set; }

        public int Kilometraj { get; set; }

        public int AnFabricatie {  get; set; }

        public string Talon {  get; set; }
        public string Culoare { get; set; }

        public string CarteIdentitateMasina { get; set; }

        public string Asigurare {  get; set; }
        public int NrImagini { get; set; }
        public double Latitudine { get; set; }
        public double Longitudine { get; set; }
        public string Adresa_user { get; set; }
        public string Adresa_formala { get; set; }

        public virtual User User {  get; set; }

        public ICollection<Chirie>? Chirie {  get; set; }

        public ICollection<Review>? Review {  get; set; }
    }
}
