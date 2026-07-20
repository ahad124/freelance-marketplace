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

        // Always ensure Client wallet balance is seeded (covers pre-existing users)
        if (client.WalletBalance == 0m)
        {
            client.WalletBalance = 5000m;
            await userManager.UpdateAsync(client);
        }

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
            var job3 = new Job
            {
                ClientId = client.Id,
                Title = "Develop custom CRM dashboard",
                Description = "Build a lightweight dashboard for CRM metrics using React and ASP.NET Core.",
                Category = "Web Development",
                BudgetType = BudgetType.Fixed,
                BudgetAmount = 1500m,
                BudgetCurrency = "USD",
                Status = JobStatus.InProgress
            };
            db.Jobs.AddRange(job1, job2, job3);

            var proposal1 = new Proposal
            {
                JobId = job1.Id,
                FreelancerId = freelancer1.Id,
                CoverLetter = "I have shipped 20+ React landing pages and can deliver in a week.",
                BidAmount = 750m,
                DeliveryDate = DateTime.UtcNow.AddDays(7),
                Status = ProposalStatus.Submitted
            };
            var proposal3 = new Proposal
            {
                JobId = job3.Id,
                FreelancerId = freelancer1.Id,
                CoverLetter = "Experienced in CRM dashboard development. Let's build a clean analytics UI.",
                BidAmount = 1500m,
                DeliveryDate = DateTime.UtcNow.AddDays(14),
                Status = ProposalStatus.Accepted
            };
            db.Proposals.AddRange(proposal1, proposal3);

            // Save job/proposal IDs
            await db.SaveChangesAsync(ct);

            // Create active Contract for job3
            var contract = new Contract
            {
                JobId = job3.Id,
                ProposalId = proposal3.Id,
                ClientId = client.Id,
                FreelancerId = freelancer1.Id,
                AgreedAmount = 1500m,
                Currency = "USD",
                Status = ContractStatus.Active,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            db.Contracts.Add(contract);
            await db.SaveChangesAsync(ct);

            // Create Milestones
            var milestone1 = new Milestone
            {
                ContractId = contract.Id,
                Title = "CRM Phase 1: API Integration",
                Amount = 500m,
                DueDate = DateTime.UtcNow.AddDays(5),
                Status = MilestoneStatus.Released,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            var milestone2 = new Milestone
            {
                ContractId = contract.Id,
                Title = "CRM Phase 2: Frontend Dashboard",
                Amount = 1000m,
                DueDate = DateTime.UtcNow.AddDays(12),
                Status = MilestoneStatus.Escrowed,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            db.Milestones.AddRange(milestone1, milestone2);
            await db.SaveChangesAsync(ct);

            // Adjust wallets based on milestone status
            // Client Cathie funded 500 (Released) + 1000 (Escrowed) = 1500 debited
            client.WalletBalance = 3500m;
            // Freelancer Frank received 500 from Released milestone
            freelancer1.WalletBalance = 500m;
            db.Users.Update(client);
            db.Users.Update(freelancer1);

            // Log ledger entries
            var ledger1 = new LedgerEntry
            {
                ContractId = contract.Id,
                MilestoneId = milestone1.Id,
                FromUserId = client.Id,
                ToUserId = null,
                Amount = 500m,
                Type = LedgerEntryType.Fund,
                BalanceAfter = 4500m,
                Note = "Funded milestone 'CRM Phase 1: API Integration'",
                CreatedAt = DateTime.UtcNow.AddHours(-24)
            };
            var ledger2 = new LedgerEntry
            {
                ContractId = contract.Id,
                MilestoneId = milestone1.Id,
                FromUserId = null,
                ToUserId = freelancer1.Id,
                Amount = 500m,
                Type = LedgerEntryType.Release,
                BalanceAfter = 500m,
                Note = "Released milestone 'CRM Phase 1: API Integration'",
                CreatedAt = DateTime.UtcNow.AddHours(-23)
            };
            var ledger3 = new LedgerEntry
            {
                ContractId = contract.Id,
                MilestoneId = milestone2.Id,
                FromUserId = client.Id,
                ToUserId = null,
                Amount = 1000m,
                Type = LedgerEntryType.Fund,
                BalanceAfter = 3500m,
                Note = "Funded milestone 'CRM Phase 2: Frontend Dashboard'",
                CreatedAt = DateTime.UtcNow.AddHours(-22)
            };
            db.LedgerEntries.AddRange(ledger1, ledger2, ledger3);
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
            PreferredCurrency = currency,
            WalletBalance = role == Roles.Client ? 5000m : 0m
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
