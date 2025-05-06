using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Vrooom.Models;

namespace Vrooom.Models
{
    public class Chirie
    {
        [Key]
        public int ChirieId { get; set; }
        public int UserId {  get; set; }
        public int PostareId { get; set; }

        public DateTime DataStop {  get; set; }

        public virtual User? User { get; set; }
        public virtual Postare? Postare { get; set; }
        public int MasinaId { get; set; }
        public DateTime DataStart { get; set; }
        public int Id { get; set; }


    }
}
