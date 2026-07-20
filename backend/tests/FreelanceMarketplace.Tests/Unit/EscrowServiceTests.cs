using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using FreelanceMarketplace.Api.Data;
using FreelanceMarketplace.Api.Entities;
using FreelanceMarketplace.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace FreelanceMarketplace.Tests.Unit;

public class EscrowServiceTests
{
    private (AppDbContext db, SqliteConnection connection) CreateDbContext()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
        var db = new AppDbContext(options);
        db.Database.EnsureCreated();
        return (db, connection);
    }

    [Fact]
    public async Task FundAsync_DebitsClient_EscrowsMilestone_WritesLedger()
    {
        var (db, conn) = CreateDbContext();
        try
        {
            var client = new AppUser { Id = "client-1", UserName = "client@t.dev", DisplayName = "Client", WalletBalance = 1000m };
            var freelancer = new AppUser { Id = "free-1", UserName = "free@t.dev", DisplayName = "Freelancer", WalletBalance = 0m };
            db.Users.AddRange(client, freelancer);

            var job = new Job { Id = Guid.NewGuid(), ClientId = client.Id, Title = "Job", Category = "Web", Description = "Desc" };
            db.Jobs.Add(job);

            var proposal = new Proposal { Id = Guid.NewGuid(), JobId = job.Id, FreelancerId = freelancer.Id, CoverLetter = "Cover" };
            db.Proposals.Add(proposal);

            var contract = new Contract
            {
                Id = Guid.NewGuid(),
                JobId = job.Id,
                ProposalId = proposal.Id,
                ClientId = client.Id,
                FreelancerId = freelancer.Id,
                AgreedAmount = 500m,
                Status = ContractStatus.Active
            };
            db.Contracts.Add(contract);

            var milestone = new Milestone
            {
                Id = Guid.NewGuid(),
                ContractId = contract.Id,
                Title = "Milestone 1",
                Amount = 300m,
                Status = MilestoneStatus.Unfunded
            };
            db.Milestones.Add(milestone);
            await db.SaveChangesAsync();

            var currentUserMock = new Mock<ICurrentUser>();
            currentUserMock.Setup(u => u.Id).Returns(client.Id);

            var escrowService = new EscrowService(db, currentUserMock.Object);
            var result = await escrowService.FundAsync(milestone.Id);

            // Assert
            result.Status.Should().Be(MilestoneStatus.Escrowed);

            var updatedClient = await db.Users.FindAsync(client.Id);
            updatedClient!.WalletBalance.Should().Be(700m); // 1000 - 300

            var ledger = await db.LedgerEntries.FirstOrDefaultAsync(l => l.MilestoneId == milestone.Id);
            ledger.Should().NotBeNull();
            ledger!.Amount.Should().Be(300m);
            ledger.Type.Should().Be(LedgerEntryType.Fund);
            ledger.FromUserId.Should().Be(client.Id);
            ledger.ToUserId.Should().BeNull();
            ledger.BalanceAfter.Should().Be(700m);
        }
        finally
        {
            conn.Close();
        }
    }

    [Fact]
    public async Task FundAsync_InsufficientBalance_Throws422()
    {
        var (db, conn) = CreateDbContext();
        try
        {
            var client = new AppUser { Id = "client-1", UserName = "client@t.dev", DisplayName = "Client", WalletBalance = 100m };
            var freelancer = new AppUser { Id = "free-1", UserName = "free@t.dev", DisplayName = "Freelancer", WalletBalance = 0m };
            db.Users.AddRange(client, freelancer);

            var job = new Job { Id = Guid.NewGuid(), ClientId = client.Id, Title = "Job", Category = "Web", Description = "Desc" };
            db.Jobs.Add(job);

            var proposal = new Proposal { Id = Guid.NewGuid(), JobId = job.Id, FreelancerId = freelancer.Id, CoverLetter = "Cover" };
            db.Proposals.Add(proposal);

            var contract = new Contract
            {
                Id = Guid.NewGuid(),
                JobId = job.Id,
                ProposalId = proposal.Id,
                ClientId = client.Id,
                FreelancerId = freelancer.Id,
                AgreedAmount = 500m,
                Status = ContractStatus.Active
            };
            db.Contracts.Add(contract);

            var milestone = new Milestone
            {
                Id = Guid.NewGuid(),
                ContractId = contract.Id,
                Title = "Milestone 1",
                Amount = 300m,
                Status = MilestoneStatus.Unfunded
            };
            db.Milestones.Add(milestone);
            await db.SaveChangesAsync();

            var currentUserMock = new Mock<ICurrentUser>();
            currentUserMock.Setup(u => u.Id).Returns(client.Id);

            var escrowService = new EscrowService(db, currentUserMock.Object);

            var act = () => escrowService.FundAsync(milestone.Id);
            await act.Should().ThrowAsync<AppException>()
                .Where(e => e.StatusCode == 422);
        }
        finally
        {
            conn.Close();
        }
    }

    [Fact]
    public async Task FundAsync_NonClient_ThrowsForbidden()
    {
        var (db, conn) = CreateDbContext();
        try
        {
            var client = new AppUser { Id = "client-1", UserName = "client@t.dev", DisplayName = "Client", WalletBalance = 1000m };
            var freelancer = new AppUser { Id = "free-1", UserName = "free@t.dev", DisplayName = "Freelancer", WalletBalance = 0m };
            db.Users.AddRange(client, freelancer);

            var job = new Job { Id = Guid.NewGuid(), ClientId = client.Id, Title = "Job", Category = "Web", Description = "Desc" };
            db.Jobs.Add(job);

            var proposal = new Proposal { Id = Guid.NewGuid(), JobId = job.Id, FreelancerId = freelancer.Id, CoverLetter = "Cover" };
            db.Proposals.Add(proposal);

            var contract = new Contract
            {
                Id = Guid.NewGuid(),
                JobId = job.Id,
                ProposalId = proposal.Id,
                ClientId = client.Id,
                FreelancerId = freelancer.Id,
                AgreedAmount = 500m,
                Status = ContractStatus.Active
            };
            db.Contracts.Add(contract);

            var milestone = new Milestone
            {
                Id = Guid.NewGuid(),
                ContractId = contract.Id,
                Title = "Milestone 1",
                Amount = 300m,
                Status = MilestoneStatus.Unfunded
            };
            db.Milestones.Add(milestone);
            await db.SaveChangesAsync();

            var currentUserMock = new Mock<ICurrentUser>();
            currentUserMock.Setup(u => u.Id).Returns(freelancer.Id); // freelancer tries to fund

            var escrowService = new EscrowService(db, currentUserMock.Object);

            var act = () => escrowService.FundAsync(milestone.Id);
            await act.Should().ThrowAsync<AppException>()
                .Where(e => e.StatusCode == 403);
        }
        finally
        {
            conn.Close();
        }
    }

    [Fact]
    public async Task SubmitAsync_UpdatesStatus()
    {
        var (db, conn) = CreateDbContext();
        try
        {
            var client = new AppUser { Id = "client-1", WalletBalance = 1000m };
            var freelancer = new AppUser { Id = "free-1", WalletBalance = 0m };
            db.Users.AddRange(client, freelancer);

            var job = new Job { Id = Guid.NewGuid(), ClientId = client.Id, Category = "Web", Description = "Desc", Title = "Job" };
            db.Jobs.Add(job);

            var proposal = new Proposal { Id = Guid.NewGuid(), JobId = job.Id, FreelancerId = freelancer.Id, CoverLetter = "Cover" };
            db.Proposals.Add(proposal);

            var contract = new Contract
            {
                Id = Guid.NewGuid(),
                JobId = job.Id,
                ProposalId = proposal.Id,
                ClientId = client.Id,
                FreelancerId = freelancer.Id,
                Status = ContractStatus.Active
            };
            db.Contracts.Add(contract);

            var milestone = new Milestone
            {
                Id = Guid.NewGuid(),
                ContractId = contract.Id,
                Status = MilestoneStatus.Escrowed
            };
            db.Milestones.Add(milestone);
            await db.SaveChangesAsync();

            var currentUserMock = new Mock<ICurrentUser>();
            currentUserMock.Setup(u => u.Id).Returns(freelancer.Id);

            var escrowService = new EscrowService(db, currentUserMock.Object);
            var result = await escrowService.SubmitAsync(milestone.Id);

            result.Status.Should().Be(MilestoneStatus.Submitted);
        }
        finally
        {
            conn.Close();
        }
    }

    [Fact]
    public async Task ReleaseAsync_CreditsFreelancer_CompletesContractWhenAllReleased()
    {
        var (db, conn) = CreateDbContext();
        try
        {
            var client = new AppUser { Id = "client-1", WalletBalance = 1000m };
            var freelancer = new AppUser { Id = "free-1", WalletBalance = 100m };
            db.Users.AddRange(client, freelancer);

            var job = new Job { Id = Guid.NewGuid(), ClientId = client.Id, Category = "Web", Description = "Desc", Title = "Job" };
            db.Jobs.Add(job);

            var proposal = new Proposal { Id = Guid.NewGuid(), JobId = job.Id, FreelancerId = freelancer.Id, CoverLetter = "Cover" };
            db.Proposals.Add(proposal);

            var contract = new Contract
            {
                Id = Guid.NewGuid(),
                JobId = job.Id,
                ProposalId = proposal.Id,
                ClientId = client.Id,
                FreelancerId = freelancer.Id,
                Status = ContractStatus.Active
            };
            db.Contracts.Add(contract);

            var milestone1 = new Milestone
            {
                Id = Guid.NewGuid(),
                ContractId = contract.Id,
                Amount = 200m,
                Status = MilestoneStatus.Submitted
            };
            var milestone2 = new Milestone
            {
                Id = Guid.NewGuid(),
                ContractId = contract.Id,
                Amount = 300m,
                Status = MilestoneStatus.Released
            };
            db.Milestones.AddRange(milestone1, milestone2);
            await db.SaveChangesAsync();

            var currentUserMock = new Mock<ICurrentUser>();
            currentUserMock.Setup(u => u.Id).Returns(client.Id);

            var escrowService = new EscrowService(db, currentUserMock.Object);
            var result = await escrowService.ReleaseAsync(milestone1.Id);

            result.Status.Should().Be(MilestoneStatus.Released);

            var updatedFreelancer = await db.Users.FindAsync(freelancer.Id);
            updatedFreelancer!.WalletBalance.Should().Be(300m); // 100 + 200

            var updatedContract = await db.Contracts.FindAsync(contract.Id);
            updatedContract!.Status.Should().Be(ContractStatus.Completed);
            updatedContract.CompletedAt.Should().NotBeNull();
        }
        finally
        {
            conn.Close();
        }
    }
}
