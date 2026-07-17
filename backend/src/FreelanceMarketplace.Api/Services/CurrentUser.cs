using System.Security.Claims;
using FreelanceMarketplace.Api.Common;

namespace FreelanceMarketplace.Api.Services;

public interface ICurrentUser
{
    string? Id { get; }
    bool IsInRole(string role);
    bool IsAdmin { get; }
    /// <summary>The authenticated user id, or throws 401 if unauthenticated.</summary>
    string RequireId();
}

public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUser(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    private ClaimsPrincipal? Principal => _accessor.HttpContext?.User;

    public string? Id => Principal?.FindFirstValue(ClaimTypes.NameIdentifier);

    public bool IsInRole(string role) => Principal?.IsInRole(role) ?? false;

    public bool IsAdmin => IsInRole(Roles.Admin);

    public string RequireId() =>
        Id ?? throw new AppException(StatusCodes.Status401Unauthorized, "Not authenticated.");
}
