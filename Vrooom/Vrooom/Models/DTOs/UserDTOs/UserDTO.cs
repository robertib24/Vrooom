namespace ProiectMDS.Models.DTOs
{
    public class UserDTO
    {
        public string nume { get; set; }

        public string prenume { get; set; }

        public string email { get; set; }

        public string username { get; set; }

        public string nrTelefon { get; set; }

        public bool carteIdentitate { get; set; }

        public bool permis { get; set; }
        public string linkPozaProfil { get; set;}
        public DateTime dataNasterii { get; set; }

        public int puncteFidelitate { get; set; }
    }
}
