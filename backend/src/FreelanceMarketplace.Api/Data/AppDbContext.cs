using FreelanceMarketplace.Api.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FreelanceMarketplace.Api.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<Proposal> Proposals => Set<Proposal>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<Milestone> Milestones => Set<Milestone>();
    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AppUser>(e =>
        {
            e.Property(u => u.DisplayName).HasMaxLength(120).IsRequired();
            e.Property(u => u.PreferredCurrency).HasMaxLength(3).IsRequired();
            e.Property(u => u.AvatarPath).HasMaxLength(400);
            e.Property(u => u.WalletBalance).HasPrecision(18, 2).HasDefaultValue(0m);
        });

        builder.Entity<Contract>(e =>
        {
            e.Property(c => c.AgreedAmount).HasPrecision(18, 2);
            e.Property(c => c.Currency).HasMaxLength(3).IsRequired();
            e.HasIndex(c => c.Status);

            e.HasOne(c => c.Job)
                .WithMany()
                .HasForeignKey(c => c.JobId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Proposal)
                .WithMany()
                .HasForeignKey(c => c.ProposalId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Client)
                .WithMany()
                .HasForeignKey(c => c.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Freelancer)
                .WithMany()
                .HasForeignKey(c => c.FreelancerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Milestone>(e =>
        {
            e.Property(m => m.Title).HasMaxLength(200).IsRequired();
            e.Property(m => m.Amount).HasPrecision(18, 2);
            e.HasIndex(m => m.Status);

            e.HasOne(m => m.Contract)
                .WithMany(c => c.Milestones)
                .HasForeignKey(m => m.ContractId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<LedgerEntry>(e =>
        {
            e.Property(l => l.Amount).HasPrecision(18, 2);
            e.Property(l => l.BalanceAfter).HasPrecision(18, 2);
            e.Property(l => l.Note).HasMaxLength(1000).IsRequired();

            e.HasOne(l => l.Contract)
                .WithMany(c => c.LedgerEntries)
                .HasForeignKey(l => l.ContractId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(l => l.Milestone)
                .WithMany()
                .HasForeignKey(l => l.MilestoneId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(l => l.FromUser)
                .WithMany()
                .HasForeignKey(l => l.FromUserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(l => l.ToUser)
                .WithMany()
                .HasForeignKey(l => l.ToUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Job>(e =>
        {
            e.Property(j => j.Title).HasMaxLength(160).IsRequired();
            e.Property(j => j.Description).HasMaxLength(4000).IsRequired();
            e.Property(j => j.Category).HasMaxLength(80).IsRequired();
            e.Property(j => j.BudgetCurrency).HasMaxLength(3).IsRequired();
            e.Property(j => j.BudgetAmount).HasPrecision(18, 2);
            e.Property(j => j.AttachmentPath).HasMaxLength(400);
            e.HasIndex(j => j.Status);

            e.HasOne(j => j.Client)
                .WithMany(u => u.Jobs)
                .HasForeignKey(j => j.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Proposal>(e =>
        {
            e.Property(p => p.CoverLetter).HasMaxLength(4000).IsRequired();
            e.Property(p => p.BidAmount).HasPrecision(18, 2);
            e.HasIndex(p => new { p.JobId, p.FreelancerId });

            e.HasOne(p => p.Job)
                .WithMany(j => j.Proposals)
                .HasForeignKey(p => p.JobId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(p => p.Freelancer)
                .WithMany(u => u.Proposals)
                .HasForeignKey(p => p.FreelancerId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
