using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Entities;
using FreelanceMarketplace.Api.Services;
using Microsoft.Extensions.Options;
using Xunit;

namespace FreelanceMarketplace.Tests.Unit;

public class JwtTokenServiceTests
{
    private static JwtTokenService CreateService(int minutes = 60)
    {
        var options = Options.Create(new JwtOptions
        {
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            SigningKey = "test-signing-key-that-is-long-enough-32b+",
            AccessTokenMinutes = minutes
        });
        return new JwtTokenService(options);
    }

    private static AppUser SampleUser() => new()
    {
        Id = "user-123",
        Email = "user@test.dev",
        DisplayName = "Test User"
    };

    [Fact]
    public void CreateToken_EmbedsUserClaimsAndRoles()
    {
        var service = CreateService();

        var (token, _) = service.CreateToken(SampleUser(), new[] { Roles.Freelancer });

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Issuer.Should().Be("TestIssuer");
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == "user-123");
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == Roles.Freelancer);
    }

    [Fact]
    public void CreateToken_SetsExpiryFromOptions()
    {
        var service = CreateService(minutes: 30);
        var before = DateTimeOffset.UtcNow;

        var (_, expiresAt) = service.CreateToken(SampleUser(), Array.Empty<string>());

        expiresAt.Should().BeCloseTo(before.AddMinutes(30), TimeSpan.FromMinutes(1));
    }

    [Fact]
    public void CreateToken_MultipleRoles_AllPresent()
    {
        var service = CreateService();

        var (token, _) = service.CreateToken(SampleUser(), new[] { Roles.Admin, Roles.Client });

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        var roles = jwt.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();
        roles.Should().BeEquivalentTo(new[] { Roles.Admin, Roles.Client });
    }
}
