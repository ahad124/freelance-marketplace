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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AppUser>(e =>
        {
            e.Property(u => u.DisplayName).HasMaxLength(120).IsRequired();
            e.Property(u => u.PreferredCurrency).HasMaxLength(3).IsRequired();
            e.Property(u => u.AvatarPath).HasMaxLength(400);
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
