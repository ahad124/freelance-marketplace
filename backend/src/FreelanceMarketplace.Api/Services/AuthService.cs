using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Entities;
using Microsoft.AspNetCore.Identity;

namespace FreelanceMarketplace.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<UserDto> GetProfileAsync(string userId, CancellationToken ct = default);
    Task<UserDto> UpdateProfileAsync(string userId, UpdateProfileRequest request, CancellationToken ct = default);
}

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IJwtTokenService _tokens;
    private readonly ILogger<AuthService> _logger;

    public AuthService(UserManager<AppUser> userManager, IJwtTokenService tokens, ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _tokens = tokens;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var role = NormalizeRole(request.Role);
        if (!Roles.SelfAssignable.Contains(role))
        {
            throw AppException.BadRequest($"Role must be one of: {string.Join(", ", Roles.SelfAssignable)}.");
        }

        if (await _userManager.FindByEmailAsync(request.Email) is not null)
        {
            throw AppException.Conflict("An account with this email already exists.");
        }

        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName,
            PreferredCurrency = (request.PreferredCurrency ?? "USD").ToUpperInvariant(),
            EmailConfirmed = true
        };

        var created = await _userManager.CreateAsync(user, request.Password);
        if (!created.Succeeded)
        {
            throw AppException.Validation(string.Join(" ", created.Errors.Select(e => e.Description)));
        }

        await _userManager.AddToRoleAsync(user, role);
        _logger.LogInformation("Registered user {Email} as {Role}", user.Email, role);

        return await BuildAuthResponseAsync(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            throw new AppException(StatusCodes.Status401Unauthorized, "Invalid email or password.");
        }

        if (user.IsDisabled)
        {
            throw AppException.Forbidden("This account has been disabled.");
        }

        return await BuildAuthResponseAsync(user);
    }

    public async Task<UserDto> GetProfileAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw AppException.NotFound("User not found.");
        return await ToDtoAsync(user);
    }

    public async Task<UserDto> UpdateProfileAsync(string userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw AppException.NotFound("User not found.");

        user.DisplayName = request.DisplayName.Trim();
        user.PreferredCurrency = request.PreferredCurrency.ToUpperInvariant().Trim();
        user.AvatarPath = request.AvatarPath;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            throw AppException.Validation(string.Join(" ", result.Errors.Select(e => e.Description)));
        }

        return await ToDtoAsync(user);
    }

    private async Task<AuthResponse> BuildAuthResponseAsync(AppUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var (token, expiresAt) = _tokens.CreateToken(user, roles);
        var dto = ToDto(user, roles);
        return new AuthResponse(token, expiresAt, dto);
    }

    private async Task<UserDto> ToDtoAsync(AppUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return ToDto(user, roles);
    }

    private static UserDto ToDto(AppUser user, IEnumerable<string> roles) => new(
        user.Id,
        user.Email ?? string.Empty,
        user.DisplayName,
        roles.FirstOrDefault() ?? string.Empty,
        user.PreferredCurrency,
        user.AvatarPath,
        user.IsDisabled);

    private static string NormalizeRole(string role) =>
        string.IsNullOrWhiteSpace(role) ? string.Empty
        : char.ToUpperInvariant(role[0]) + role[1..].ToLowerInvariant();
}
