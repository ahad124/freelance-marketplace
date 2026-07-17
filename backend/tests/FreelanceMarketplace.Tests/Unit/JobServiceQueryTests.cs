using FluentAssertions;
using FreelanceMarketplace.Api.Data;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Entities;
using FreelanceMarketplace.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace FreelanceMarketplace.Tests.Unit;

public class JobServiceQueryTests
{
    [Fact]
    public async Task ListOpen_ProjectsAndOrders()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
        using var db = new AppDbContext(options);
        db.Database.EnsureCreated();

        var user = new AppUser { UserName = "c@t.dev", Email = "c@t.dev", DisplayName = "Client" };
        db.Users.Add(user);
        db.Jobs.Add(new Job
        {
            ClientId = user.Id,
            Title = "Alpha",
            Description = "desc",
            Category = "Web",
            BudgetAmount = 100m,
            BudgetCurrency = "USD",
            Status = JobStatus.Open
        });
        await db.SaveChangesAsync();

        var service = new JobService(db, Mock.Of<ICurrentUser>());
        var result = await service.ListOpenAsync(new JobQuery());

        result.Should().ContainSingle();
        result[0].ClientName.Should().Be("Client");
    }
}
