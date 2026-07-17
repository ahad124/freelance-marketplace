using System.Net.Http.Json;
using FreelanceMarketplace.Api.Dtos;

namespace FreelanceMarketplace.Tests.Integration;

/// <summary>Helpers for obtaining authenticated clients in integration tests.</summary>
public static class TestAuth
{
    public static async Task<string> RegisterAndGetTokenAsync(
        HttpClient client, string email, string role = "Freelancer", string currency = "USD")
    {
        var request = new RegisterRequest(email, "Password123!", "Test User", role, currency);
        var response = await client.PostAsJsonAsync("/api/auth/register", request);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        return body!.AccessToken;
    }

    public static async Task<string> LoginAndGetTokenAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        return body!.AccessToken;
    }

    public static async Task<HttpClient> AuthedClientAsync(
        CustomWebApplicationFactory factory, string email, string role = "Freelancer", string currency = "USD")
    {
        var client = factory.CreateClient();
        var token = await RegisterAndGetTokenAsync(client, email, role, currency);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }
}
