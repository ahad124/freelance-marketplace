using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Data;
using FreelanceMarketplace.Api.Dtos;
using Xunit;

namespace FreelanceMarketplace.Tests.Integration;

public class AdminEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AdminEndpointsTests(CustomWebApplicationFactory factory) => _factory = factory;

    private async Task<HttpClient> GetAdminClientAsync()
    {
        var client = _factory.CreateClient();
        var token = await TestAuth.LoginAndGetTokenAsync(client, "admin@demo.test", DbSeeder.DemoPassword);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    [Fact]
    public async Task GetMetrics_AsAdmin_ReturnsOk()
    {
        var client = await GetAdminClientAsync();

        var response = await client.GetAsync("/api/admin/metrics");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var metrics = await response.Content.ReadFromJsonAsync<AdminMetricsDto>();
        metrics.Should().NotBeNull();
        metrics!.TotalUsers.Should().BeGreaterThan(0);
        metrics.UsersByRole.Should().ContainKey(Roles.Admin);
    }

    [Fact]
    public async Task GetMetrics_AsFreelancer_ReturnsForbidden()
    {
        var client = await TestAuth.AuthedClientAsync(_factory, "normal.free@test.dev", Roles.Freelancer);

        var response = await client.GetAsync("/api/admin/metrics");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetMetrics_Anonymous_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/admin/metrics");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ListUsers_AsAdmin_ReturnsUserList()
    {
        var client = await GetAdminClientAsync();

        var response = await client.GetAsync("/api/admin/users");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var users = await response.Content.ReadFromJsonAsync<List<UserDto>>();
        users.Should().NotBeNullOrEmpty();
        users.Should().Contain(u => u.Role == Roles.Admin);
    }

    [Fact]
    public async Task ChangeRole_AsAdmin_ModifiesUserRole()
    {
        var adminClient = await GetAdminClientAsync();

        // First register a new user so we have a target
        var targetUserClient = _factory.CreateClient();
        var registerResponse = await targetUserClient.PostAsJsonAsync("/api/auth/register", 
            new RegisterRequest("role.target@test.dev", "Password123!", "Target User", Roles.Freelancer, "USD"));
        var userAuth = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>();
        var targetUserId = userAuth!.User.Id;

        // Change role
        var response = await adminClient.PostAsJsonAsync($"/api/admin/users/{targetUserId}/role", new ChangeRoleRequest(Roles.Client));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedUser = await response.Content.ReadFromJsonAsync<UserDto>();
        updatedUser!.Role.Should().Be(Roles.Client);
    }

    [Fact]
    public async Task ToggleStatus_AsAdmin_SuspendsUserAccount()
    {
        var adminClient = await GetAdminClientAsync();

        // Register a target user
        var targetUserClient = _factory.CreateClient();
        await targetUserClient.PostAsJsonAsync("/api/auth/register", 
            new RegisterRequest("status.target@test.dev", "Password123!", "Target User", Roles.Freelancer, "USD"));
        
        // Log in to retrieve target details
        var loginResponse = await targetUserClient.PostAsJsonAsync("/api/auth/login", new LoginRequest("status.target@test.dev", "Password123!"));
        var userAuth = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        var targetUserId = userAuth!.User.Id;

        // Disable target user
        var response = await adminClient.PostAsJsonAsync($"/api/admin/users/{targetUserId}/toggle-status", new SetDisabledRequest(true));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedUser = await response.Content.ReadFromJsonAsync<UserDto>();
        updatedUser!.IsDisabled.Should().BeTrue();

        // Target user login should now be blocked
        var blockedLogin = await targetUserClient.PostAsJsonAsync("/api/auth/login", new LoginRequest("status.target@test.dev", "Password123!"));
        blockedLogin.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ToggleStatus_SelfDisable_ReturnsBadRequest()
    {
        // Setup authenticated client as admin
        var adminClient = _factory.CreateClient();
        var registerResponse = await adminClient.PostAsJsonAsync("/api/auth/register", 
            new RegisterRequest("self.admin@test.dev", "Password123!", "Admin User", Roles.Freelancer, "USD"));
        var userAuth = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>();
        var adminUserId = userAuth!.User.Id;

        // Log in and upgrade to admin manually in database via integration setup or by registering as Admin (Wait, Register as Admin is blocked by selfassignable check in register)
        // Let's obtain the token of the seeded site admin "admin@demo.test" from DbSeeder
        var seededAdminToken = await TestAuth.LoginAndGetTokenAsync(_factory.CreateClient(), "admin@demo.test", DbSeeder.DemoPassword);
        adminClient.DefaultRequestHeaders.Authorization = new("Bearer", seededAdminToken);

        // Get own profile ID
        var meResponse = await adminClient.GetAsync("/api/auth/me");
        var meUser = await meResponse.Content.ReadFromJsonAsync<UserDto>();
        var meId = meUser!.Id;

        // Act - try to disable self
        var response = await adminClient.PostAsJsonAsync($"/api/admin/users/{meId}/toggle-status", new SetDisabledRequest(true));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
