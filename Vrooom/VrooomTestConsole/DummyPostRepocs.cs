using Vrooom.Models;
using Vrooom.Repos.PostareRepo;

public class DummyPostareRepo : IPostareRepo
{
    private readonly List<Postare> _postari = new();

    public Task AddPostare(Postare p)
    {
        p.Id = _postari.Count + 1;
        _postari.Add(p);
        return Task.CompletedTask;
    }

    public Task DeletePostare(int id)
    {
        _postari.RemoveAll(p => p.Id == id);
        return Task.CompletedTask;
    }

    public Task<Postare> GetPostareByID(int postId)
        => Task.FromResult(_postari.FirstOrDefault(p => p.Id == postId));

    public Task<IEnumerable<Postare>> GetPostare()
        => Task.FromResult(_postari.AsEnumerable());

    public Task<int> CountPostare()
        => Task.FromResult(_postari.Count);

    public Task<int> NrPostareByUserID(int userId)
        => Task.FromResult(_postari.Count(p => p.UserId == userId));

    public Task UpdatePost(Postare p)
    {
        var index = _postari.FindIndex(x => x.Id == p.Id);
        if (index != -1)
        {
            _postari[index] = p;
        }
        return Task.CompletedTask;
    }

    public Task<IEnumerable<Postare>> GetPostByTitle(string title)
        => Task.FromResult(_postari.Where(p => p.Titlu.Contains(title)).AsEnumerable());

    public Task<IEnumerable<Postare>> GetPostByModel(string model)
        => Task.FromResult(_postari.Where(p => p.Model.Contains(model)).AsEnumerable());

    public Task<IEnumerable<Postare>> GetPostByPrice(int minPrice, int maxPrice)
        => Task.FromResult(_postari.Where(p => p.Pret >= minPrice && p.Pret <= maxPrice).AsEnumerable());

    public Task<IEnumerable<Postare>> GetPostByKM(int minKM, int maxKM)
        => Task.FromResult(_postari.Where(p => p.Kilometraj >= minKM && p.Kilometraj <= maxKM).AsEnumerable());

    public Task<IEnumerable<Postare>> GetPostByYear(int minYear, int maxYear)
        => Task.FromResult(_postari.Where(p => p.AnFabricatie >= minYear && p.AnFabricatie <= maxYear).AsEnumerable());

    public Task<IEnumerable<Postare>> GetPostByFirm(string firm)
        => Task.FromResult(_postari.Where(p => p.Firma.Contains(firm)).AsEnumerable());

    public Task<IEnumerable<Postare>> GetPostByUserID(int userId)
        => Task.FromResult(_postari.Where(p => p.UserId == userId).AsEnumerable());

    public Task<IEnumerable<Postare>> ExecQuery(string query)
        => Task.FromResult(Enumerable.Empty<Postare>());
}
