using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProiectMDS.Models
{
    public class Chirie
    {
        [Key]
        public int ChirieId { get; set; }
        public int UserId {  get; set; }
        public int PostareId { get; set; }

        public DateTime dataStart {  get; set; }

        public DateTime dataStop {  get; set; }

        public virtual User User { get; set; }
        public virtual Postare Postare { get; set; }
    }
}
