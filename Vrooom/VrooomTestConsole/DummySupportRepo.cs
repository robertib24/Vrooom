using Vrooom.Models;
using Vrooom.Repos.SupportRepo;

public class DummySupportRepo : ISupportRepo
{
    private readonly List<Support> _supports = new();
    private int _nextId = 1;

    public Task AddSupport(Support support)
    {
        support.Id = _nextId++;
        _supports.Add(support);
        return Task.CompletedTask;
    }

    public Task<IEnumerable<Support>> GetAllSupports()
    {
        return Task.FromResult<IEnumerable<Support>>(_supports);
    }

    public Task<IEnumerable<Support>> GetSupportsByUserID(int userID)
    {
        var result = _supports.Where(s => s.UserId == userID);
        return Task.FromResult(result);
    }

    public Task<Support?> GetSupportByID(int supportID)
    {
        return Task.FromResult(_supports.FirstOrDefault(s => s.Id == supportID));
    }

    public Task UpdateSupport(Support updated)
    {
        var index = _supports.FindIndex(s => s.Id == updated.Id);
        if (index != -1)
        {
            _supports[index] = updated;
        }
        return Task.CompletedTask;
    }
}
