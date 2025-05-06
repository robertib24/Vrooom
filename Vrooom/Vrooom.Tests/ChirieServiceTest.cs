using Vrooom.Services.ChirieServices;
using Vrooom.Models.DTOs;
using Vrooom.Repos.ChirieRepos;
using Vrooom.Models;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Linq;
using System.Collections.Generic;

public class DummyChirieRepo : IChirieRepo
{
    private readonly List<Chirie> _chirii = new();
    public Task AddChirie(Chirie c) { c.Id = _chirii.Count + 1; _chirii.Add(c); return Task.CompletedTask; }
    public Task DeleteChirie(int id) { _chirii.RemoveAll(c => c.Id == id); return Task.CompletedTask; }
    public Task<Chirie> ChirieByID(int id) => Task.FromResult(_chirii.FirstOrDefault(c => c.Id == id));
    public Task UpdateChirie(Chirie c) { var index = _chirii.FindIndex(x => x.Id == c.Id); if (index != -1) _chirii[index] = c; return Task.CompletedTask; }
    public Task<IEnumerable<Chirie>> ChiriiByDataStart(DateTime d) => Task.FromResult(_chirii.Where(c => c.DataStart.Date == d.Date).AsEnumerable());
    public Task<IEnumerable<Chirie>> ChiriiByDataStop(DateTime d) => Task.FromResult(_chirii.Where(c => c.DataStop.Date == d.Date).AsEnumerable());
    public Task<IEnumerable<Chirie>> ChiriiByData(DateTime d1, DateTime d2) => Task.FromResult(_chirii.Where(c => c.DataStart >= d1 && c.DataStop <= d2).AsEnumerable());
    public Task<User> UserByID(int id) => Task.FromResult(new User { Id = id, Email = "x@y.com" });
    public Task UpdatePuncteFid(User u) => Task.CompletedTask;
    public Task<int> UserByPostareID(int idPost) => Task.FromResult(1);
    public Task<Postare> PostareByID(int id) => Task.FromResult(new Postare { Id = id });
}

public class ChirieServiceTests
{
    [Fact]
    public async Task AddChirie_ShouldStoreChirieInMemory()
    {
        // Arrange
        var repo = new DummyChirieRepo();
        var service = new ChirieService(repo);
        var dto = new ChirieDTO
        {
            UserId = 1,
            PostareId = 2,
            DataStart = DateTime.Today,
            DataStop = DateTime.Today.AddDays(2)
        };

        // Act
        await service.AddChirie(dto);
        var result = await repo.ChirieByID(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.UserId);
        Assert.Equal(2, result.PostareId);
    }
}
