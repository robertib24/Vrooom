using Microsoft.AspNetCore.Identity;
using Vrooom.Models.Enum;

namespace Vrooom.Data
{
    public class Seed
    {

        public static async Task InitializeRoles(IApplicationBuilder app)
        {
            using (var scope = app.ApplicationServices.CreateScope())
            {
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();
                foreach (var roleName in Enum.GetNames(typeof(Roles)))
                {
                    var roleExist = await roleManager.RoleExistsAsync(roleName);
                    if (!roleExist)
                        await roleManager.CreateAsync(new IdentityRole<int>(roleName));
                }
            }
        }
    }
}
