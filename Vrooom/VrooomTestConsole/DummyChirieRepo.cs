using Vrooom.Models;
using Vrooom.Repos.ChirieRepos;

namespace VrooomTestConsole
{
    public class DummyChirieRepo : IChirieRepo
    {
        private readonly List<Chirie> _chirii = new();

        public Task AddChirie(Chirie c)
        {
            c.Id = _chirii.Count + 1;
            _chirii.Add(c);
            Console.WriteLine($"Chirie cu ID {c.Id} adăugată.");
            return Task.CompletedTask;
        }

        public Task DeleteChirie(int id)
        {
            _chirii.RemoveAll(c => c.Id == id);
            Console.WriteLine($"Chirie cu ID {id} ștearsă.");
            return Task.CompletedTask;
        }

        public Task<Chirie> ChirieByID(int id)
        {
            return Task.FromResult(_chirii.FirstOrDefault(c => c.Id == id));
        }

        public Task UpdateChirie(Chirie c)
        {
            var index = _chirii.FindIndex(x => x.Id == c.Id);
            if (index != -1)
            {
                _chirii[index] = c;
                Console.WriteLine($"Chirie cu ID {c.Id} actualizată.");
            }
            return Task.CompletedTask;
        }

        public Task<IEnumerable<Chirie>> ChiriiByDataStart(DateTime dataStart) =>
            Task.FromResult(_chirii.Where(c => c.DataStart.Date == dataStart.Date).AsEnumerable());

        public Task<IEnumerable<Chirie>> ChiriiByDataStop(DateTime dataStop) =>
            Task.FromResult(_chirii.Where(c => c.DataStop.Date == dataStop.Date).AsEnumerable());

        public Task<IEnumerable<Chirie>> ChiriiByData(DateTime dataStart, DateTime dataStop) =>
            Task.FromResult(_chirii.Where(c => c.DataStart >= dataStart && c.DataStop <= dataStop).AsEnumerable());

        public Task<User> UserByID(int id) =>
            Task.FromResult(new User { Id = id, Email = "mock@email.com" });

        public Task UpdatePuncteFid(User u) => Task.CompletedTask;

        public Task<int> UserByPostareID(int idPost) => Task.FromResult(1);

        public Task<Postare> PostareByID(int id) =>
            Task.FromResult(new Postare { Id = id });
    }
}
