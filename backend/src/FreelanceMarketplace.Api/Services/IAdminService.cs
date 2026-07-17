using FreelanceMarketplace.Api.Dtos;

namespace FreelanceMarketplace.Api.Services;

public interface IAdminService
{
    Task<IReadOnlyList<UserDto>> ListUsersAsync(CancellationToken ct = default);
    Task<UserDto> ChangeRoleAsync(string userId, string newRole, CancellationToken ct = default);
    Task<UserDto> SetDisabledStatusAsync(string userId, bool isDisabled, CancellationToken ct = default);
    Task<AdminMetricsDto> GetMetricsAsync(CancellationToken ct = default);
}
