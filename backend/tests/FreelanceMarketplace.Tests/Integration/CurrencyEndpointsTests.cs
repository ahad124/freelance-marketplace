using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using FreelanceMarketplace.Api.Controllers;
using Xunit;

namespace FreelanceMarketplace.Tests.Integration;

public class CurrencyEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CurrencyEndpointsTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Convert_AsAuthenticatedUser_ReturnsConvertedAmount()
    {
        var client = await TestAuth.AuthedClientAsync(_factory, "currency.user@test.dev", "Freelancer");

        var response = await client.GetAsync("/api/currency/convert?amount=100&from=USD&to=EUR");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<CurrencyConversionResponse>();
        body.Should().NotBeNull();
        body!.Amount.Should().Be(100m);
        body.From.Should().Be("USD");
        body.To.Should().Be("EUR");
        body.ConvertedAmount.Should().Be(125m); // 100 * 1.25 (from mock)
    }

    [Fact]
    public async Task Convert_Anonymous_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/currency/convert?amount=100&from=USD&to=EUR");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
