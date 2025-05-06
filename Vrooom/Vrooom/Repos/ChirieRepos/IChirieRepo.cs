using Vrooom.Models;
namespace Vrooom.Repos.ChirieRepos
{
    public interface IChirieRepo // to do: implementati 
    // fiecare metoda din fiecare interfata prezenta in repos, aveti ca exemplu clasele ICardRepo si CardRepo din folderul precedent
    {
        Task AddChirie(Chirie c);
        Task DeleteChirie(int id);
        Task<Chirie> ChirieByID(int id);
        Task UpdateChirie(Chirie c);
        Task<IEnumerable<Chirie>> ChiriiByDataStart(DateTime dataStart);
        Task<IEnumerable<Chirie>> ChiriiByDataStop(DateTime dataStop);
        Task<IEnumerable<Chirie>> ChiriiByData(DateTime dataStart, DateTime dataStop);
        Task<User> UserByID(int id);
        Task UpdatePuncteFid(User u);
        Task<int> UserByPostareID(int idPost);
        Task<Postare> PostareByID(int id);
    }
}
