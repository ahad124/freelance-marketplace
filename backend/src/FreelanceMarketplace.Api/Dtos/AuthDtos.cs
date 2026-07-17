namespace FreelanceMarketplace.Api.Dtos;

public record RegisterRequest(
    string Email,
    string Password,
    string DisplayName,
    string Role,
    string? PreferredCurrency);

public record LoginRequest(string Email, string Password);

public record AuthResponse(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    UserDto User);

public record UserDto(
    string Id,
    string Email,
    string DisplayName,
    string Role,
    string PreferredCurrency,
    string? AvatarPath,
    bool IsDisabled);
