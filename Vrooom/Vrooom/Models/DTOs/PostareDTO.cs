namespace Vrooom.Models.DTOs
{
    public class PostareDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Titlu { get; set; }

        public string Descriere { get; set; }

        public int Pret { get; set; }

        public string Firma { get; set; }

        public string Model { get; set; }

        public int Kilometraj { get; set; }

        public int AnFabricatie { get; set; }

        public string Talon { get; set; }

        public string CarteIdentitateMasina { get; set; }

        public string Asigurare { get; set; }
        public string Culoare { get; set; }
        public string locatie { get; set; }
        public string Locatie_formala { get; set; }
        public string LinkMaps { get; set; }

        public List<IFormFile> Imagini { get; set; }
    }
}
