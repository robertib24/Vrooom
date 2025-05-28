namespace Vrooom.Models.DTOs
{
    public class PostareDTO
    {
        public int id { get; set; }
        public int userId { get; set; }
        public string titlu { get; set; }

        public string descriere { get; set; }

        public int pret { get; set; }

        public string firma { get; set; }

        public string model { get; set; }

        public int kilometraj { get; set; }

        public int anFabricatie { get; set; }

        public string talon { get; set; }

        public string carteIdentitateMasina { get; set; }

        public string asigurare { get; set; }
        public string culoare { get; set; }
        public string locatie { get; set; }
        public string? locatie_formala { get; set; }
        public string? linkMaps { get; set; }

        public List<IFormFile> imagini { get; set; }
    }
}
