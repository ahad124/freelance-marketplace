using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FreelanceMarketplace.Api.Data;

/// <summary>Seeds roles, demo accounts, and sample marketplace data for demo/UAT.</summary>
public static class DbSeeder
{
    /// <summary>Shared password for all seeded demo accounts (documented in README/UAT).</summary>
    public const string DemoPassword = "Password123!";

    public static async Task SeedAsync(IServiceProvider services, CancellationToken ct = default)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<AppUser>>();
        var db = services.GetRequiredService<AppDbContext>();

        foreach (var role in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        var admin = await EnsureUserAsync(userManager, "admin@demo.test", "Site Admin", Roles.Admin, "USD");
        var client = await EnsureUserAsync(userManager, "client@demo.test", "Cathy Client", Roles.Client, "USD");
        var freelancer1 = await EnsureUserAsync(userManager, "freelancer1@demo.test", "Frank Freelancer", Roles.Freelancer, "EUR");
        _ = await EnsureUserAsync(userManager, "freelancer2@demo.test", "Fiona Freelancer", Roles.Freelancer, "GBP");
        _ = admin;

        if (!await db.Jobs.AnyAsync(ct))
        {
            var job1 = new Job
            {
                ClientId = client.Id,
                Title = "Build a marketing landing page",
                Description = "Responsive React landing page with a hero, features, and contact form.",
                Category = "Web Development",
                BudgetType = BudgetType.Fixed,
                BudgetAmount = 800m,
                BudgetCurrency = "USD",
                Status = JobStatus.Open
            };
            var job2 = new Job
            {
                ClientId = client.Id,
                Title = "Design a brand logo",
                Description = "Modern, minimal logo plus a small brand palette.",
                Category = "Design",
                BudgetType = BudgetType.Fixed,
                BudgetAmount = 300m,
                BudgetCurrency = "USD",
                Status = JobStatus.Open
            };
            db.Jobs.AddRange(job1, job2);

            db.Proposals.Add(new Proposal
            {
                JobId = job1.Id,
                FreelancerId = freelancer1.Id,
                CoverLetter = "I have shipped 20+ React landing pages and can deliver in a week.",
                BidAmount = 750m,
                DeliveryDate = DateTime.UtcNow.AddDays(7),
                Status = ProposalStatus.Submitted
            });

            await db.SaveChangesAsync(ct);
        }
    }

    private static async Task<AppUser> EnsureUserAsync(
        UserManager<AppUser> userManager, string email, string displayName, string role, string currency)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is not null)
        {
            return user;
        }

        user = new AppUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            DisplayName = displayName,
            PreferredCurrency = currency
        };

        var result = await userManager.CreateAsync(user, DemoPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to seed user {email}: {errors}");
        }

        await userManager.AddToRoleAsync(user, role);
        return user;
    }
}
