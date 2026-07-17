using FluentAssertions;
using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Data;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Entities;
using FreelanceMarketplace.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace FreelanceMarketplace.Tests.Unit;

public class AdminServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly ServiceProvider _provider;
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly AdminService _adminService;

    public AdminServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
        services.AddIdentityCore<AppUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
            })
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<AppDbContext>();

        _provider = services.BuildServiceProvider();
        _db = _provider.GetRequiredService<AppDbContext>();
        _db.Database.EnsureCreated();

        _userManager = _provider.GetRequiredService<UserManager<AppUser>>();
        _roleManager = _provider.GetRequiredService<RoleManager<IdentityRole>>();

        // Seed Roles
        foreach (var role in Roles.All)
        {
            _roleManager.CreateAsync(new IdentityRole(role)).GetAwaiter().GetResult();
        }

        _adminService = new AdminService(_userManager, _roleManager, _db);
    }

    [Fact]
    public async Task ChangeRoleAsync_ValidRole_UpdatesUserRole()
    {
        // Arrange
        var user = new AppUser { UserName = "test@user.dev", Email = "test@user.dev", DisplayName = "Test" };
        await _userManager.CreateAsync(user, "Password123!");
        await _userManager.AddToRoleAsync(user, Roles.Freelancer);

        // Act
        var updated = await _adminService.ChangeRoleAsync(user.Id, Roles.Client);

        // Assert
        updated.Role.Should().Be(Roles.Client);
        
        var roles = await _userManager.GetRolesAsync(user);
        roles.Should().ContainSingle().Which.Should().Be(Roles.Client);
    }

    [Fact]
    public async Task ChangeRoleAsync_InvalidRole_ThrowsBadRequest()
    {
        // Arrange
        var user = new AppUser { UserName = "test2@user.dev", Email = "test2@user.dev", DisplayName = "Test" };
        await _userManager.CreateAsync(user, "Password123!");

        // Act
        var action = () => _adminService.ChangeRoleAsync(user.Id, "SuperAdmin");

        // Assert
        await action.Should().ThrowAsync<AppException>()
            .Where(e => e.StatusCode == 400);
    }

    [Fact]
    public async Task SetDisabledStatusAsync_ToggleStatus_SavesToDb()
    {
        // Arrange
        var user = new AppUser { UserName = "test3@user.dev", Email = "test3@user.dev", DisplayName = "Test" };
        await _userManager.CreateAsync(user, "Password123!");

        // Act
        var disabled = await _adminService.SetDisabledStatusAsync(user.Id, true);
        var enabled = await _adminService.SetDisabledStatusAsync(user.Id, false);

        // Assert
        disabled.IsDisabled.Should().BeTrue();
        enabled.IsDisabled.Should().BeFalse();

        var refreshed = await _userManager.FindByIdAsync(user.Id);
        refreshed!.IsDisabled.Should().BeFalse();
    }

    [Fact]
    public async Task GetMetricsAsync_AggregatesCorrectTotals()
    {
        // Arrange
        var user1 = new AppUser { UserName = "client@metrics.dev", Email = "client@metrics.dev", DisplayName = "Client", CreatedAt = DateTime.UtcNow };
        var user2 = new AppUser { UserName = "free@metrics.dev", Email = "free@metrics.dev", DisplayName = "Freelancer", CreatedAt = DateTime.UtcNow };
        await _userManager.CreateAsync(user1, "Password123!");
        await _userManager.AddToRoleAsync(user1, Roles.Client);
        await _userManager.CreateAsync(user2, "Password123!");
        await _userManager.AddToRoleAsync(user2, Roles.Freelancer);

        var job = new Job
        {
            ClientId = user1.Id,
            Title = "Job for metrics",
            Description = "description",
            Category = "Metrics",
            BudgetAmount = 500m,
            BudgetCurrency = "USD",
            Status = JobStatus.Open,
            CreatedAt = DateTime.UtcNow
        };
        _db.Jobs.Add(job);

        var proposal = new Proposal
        {
            JobId = job.Id,
            FreelancerId = user2.Id,
            CoverLetter = "bid cover",
            BidAmount = 450m,
            DeliveryDate = DateTime.UtcNow.AddDays(5),
            Status = ProposalStatus.Submitted,
            CreatedAt = DateTime.UtcNow
        };
        _db.Proposals.Add(proposal);

        await _db.SaveChangesAsync();

        // Act
        var metrics = await _adminService.GetMetricsAsync();

        // Assert
        metrics.TotalUsers.Should().Be(2);
        metrics.UsersByRole[Roles.Client].Should().Be(1);
        metrics.UsersByRole[Roles.Freelancer].Should().Be(1);
        metrics.TotalJobs.Should().Be(1);
        metrics.OpenJobs.Should().Be(1);
        metrics.TotalProposals.Should().Be(1);
        metrics.RecentSignups.Should().HaveCount(2);
    }

    public void Dispose()
    {
        _provider.Dispose();
        _connection.Dispose();
    }
}
