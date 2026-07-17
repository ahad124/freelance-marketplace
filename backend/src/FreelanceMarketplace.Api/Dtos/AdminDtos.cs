namespace FreelanceMarketplace.Api.Dtos;

public record AdminMetricsDto(
    int TotalUsers,
    Dictionary<string, int> UsersByRole,
    int TotalJobs,
    int OpenJobs,
    int TotalProposals,
    IReadOnlyList<UserDto> RecentSignups);

public record ChangeRoleRequest(string Role);

public record SetDisabledRequest(bool IsDisabled);
