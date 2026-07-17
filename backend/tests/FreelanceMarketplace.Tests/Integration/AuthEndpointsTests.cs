using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using FreelanceMarketplace.Api.Data;
using FreelanceMarketplace.Api.Dtos;
using Xunit;

namespace FreelanceMarketplace.Tests.Integration;

public class AuthEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AuthEndpointsTests(CustomWebApplicationFactory factory) => _factory = factory;

    private static RegisterRequest NewRegistration(string email, string role = "Freelancer") =>
        new(email, "Password123!", "Test User", role, "USD");

    [Fact]
    public async Task Register_ValidFreelancer_ReturnsTokenAndUser()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", NewRegistration("new.freelancer@test.dev"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrWhiteSpace();
        body.User.Role.Should().Be("Freelancer");
        body.User.Email.Should().Be("new.freelancer@test.dev");
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsConflict()
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/auth/register", NewRegistration("dupe@test.dev"));

        var second = await client.PostAsJsonAsync("/api/auth/register", NewRegistration("dupe@test.dev"));

        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Register_NonSelfAssignableRole_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", NewRegistration("admin.wannabe@test.dev", "Admin"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WeakPassword_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        var weak = new RegisterRequest("weak@test.dev", "abc", "Test", "Freelancer", "USD");

        var response = await client.PostAsJsonAsync("/api/auth/register", weak);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_ValidSeededCredentials_ReturnsToken()
    {
        var client = _factory.CreateClient();
        var request = new LoginRequest("client@demo.test", DbSeeder.DemoPassword);

        var response = await client.PostAsJsonAsync("/api/auth/login", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        body!.User.Role.Should().Be("Client");
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var request = new LoginRequest("client@demo.test", "Wrong-Password-1!");

        var response = await client.PostAsJsonAsync("/api/auth/login", request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_WithToken_ReturnsProfile()
    {
        var client = _factory.CreateClient();
        var token = await TestAuth.RegisterAndGetTokenAsync(client, "me.user@test.dev");
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var response = await client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        user!.Email.Should().Be("me.user@test.dev");
    }
}
