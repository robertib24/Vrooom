using Vrooom.Models;
using Vrooom.Models.DTOs;
using Vrooom.Repos.PostareRepo;
using Vrooom.Exceptions;

namespace Vrooom.Services.PostareServices
{
    public class PostareService : IPostareService
    {
        private readonly IPostareRepo _postareRepo;

        public PostareService(IPostareRepo postareRepo)
        {
            _postareRepo = postareRepo;
        }

        public async Task<int> AddPostare(PostareDTO postareDTO)
        {
            var postare = new Postare
            {
                UserId = postareDTO.UserId,
                Titlu = postareDTO.Titlu,
                Descriere = postareDTO.Descriere,
                Pret = postareDTO.Pret,
                Firma = postareDTO.Firma,
                Model = postareDTO.Model,
                Kilometraj = postareDTO.Kilometraj,
                AnFabricatie = postareDTO.AnFabricatie
            };

            await _postareRepo.AddPostare(postare);
            return postare.Id;
        }

        public async Task DeletePostare(int id)
        {
            await _postareRepo.DeletePostare(id);
        }

        public async Task UpdatePostare(PostareDTO postareDTO)
        {
            var postare = await _postareRepo.GetPostareByID(postareDTO.Id);
            if (postare == null)
            {
                throw new NotFoundException($"Postarea cu ID {postareDTO.Id} nu a fost găsită.");
            }

            postare.Titlu = postareDTO.Titlu;
            postare.Descriere = postareDTO.Descriere;
            postare.Pret = postareDTO.Pret;
            postare.Firma = postareDTO.Firma;
            postare.Model = postareDTO.Model;
            postare.Kilometraj = postareDTO.Kilometraj;
            postare.AnFabricatie = postareDTO.AnFabricatie;

            await _postareRepo.UpdatePost(postare);
        }

        public async Task<IEnumerable<PostareDTO>> GetAllPosts()
        {
            var postari = await _postareRepo.GetPostare();
            return Map(postari);
        }

        public async Task<IEnumerable<PostareDTO>> PostByTitle(string title)
        {
            var postari = await _postareRepo.GetPostByTitle(title);
            return Map(postari);
        }

        public async Task<IEnumerable<PostareDTO>> PostByPrice(int minPrice, int maxPrice)
        {
            var postari = await _postareRepo.GetPostByPrice(minPrice, maxPrice);
            return Map(postari);
        }

        public async Task<IEnumerable<PostareDTO>> PostByKM(int minKM, int maxKM)
        {
            var postari = await _postareRepo.GetPostByKM(minKM, maxKM);
            return Map(postari);
        }

        public async Task<IEnumerable<PostareDTO>> PostByYear(int minYear, int maxYear)
        {
            var postari = await _postareRepo.GetPostByYear(minYear, maxYear);
            return Map(postari);
        }

        public async Task<IEnumerable<PostareDTO>> PostByModel(string model)
        {
            var postari = await _postareRepo.GetPostByModel(model);
            return Map(postari);
        }

        public async Task<IEnumerable<PostareDTO>> PostByUserID(int userID)
        {
            var postari = await _postareRepo.GetPostByUserID(userID);
            return Map(postari);
        }

        public async Task<IEnumerable<PostareDTO>> PostByFirma(string firma)
        {
            var postari = await _postareRepo.GetPostByFirm(firma);
            return Map(postari);
        }

        public async Task<int> PostNumberByUserID(int userID)
        {
            return await _postareRepo.NrPostareByUserID(userID);
        }

        public async Task<PostareDTO> PostByID(int id)
        {
            var p = await _postareRepo.GetPostareByID(id);
            if (p == null)
                throw new NotFoundException($"Postarea cu ID {id} nu există.");

            return new PostareDTO
            {
                Id = p.Id,
                UserId = p.UserId,
                Titlu = p.Titlu,
                Descriere = p.Descriere,
                Pret = p.Pret,
                Firma = p.Firma,
                Model = p.Model,
                Kilometraj = p.Kilometraj,
                AnFabricatie = p.AnFabricatie
            };
        }

        private static IEnumerable<PostareDTO> Map(IEnumerable<Postare> postari)
        {
            return postari.Select(p => new PostareDTO
            {
                Id = p.Id,
                UserId = p.UserId,
                Titlu = p.Titlu,
                Descriere = p.Descriere,
                Pret = p.Pret,
                Firma = p.Firma,
                Model = p.Model,
                Kilometraj = p.Kilometraj,
                AnFabricatie = p.AnFabricatie
            });
        }
    }
}
