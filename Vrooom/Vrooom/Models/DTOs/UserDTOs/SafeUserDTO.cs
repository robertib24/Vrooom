namespace ProiectMDS.Models.DTOs.UserDTOs
{
    public class SafeUserDTO
    {
        public int id { get; set; }
        public string nume { get; set; }

        public string prenume { get; set; }

        public string username { get; set; }

        public string nrTelefon { get; set; }

        public string linkPozaProfil { get; set; }
        public DateTime dataNasterii { get; set; }

        public int nrPostari { get; set; }
    }
}
