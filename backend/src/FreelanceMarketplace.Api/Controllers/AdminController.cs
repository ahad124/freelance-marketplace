using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FreelanceMarketplace.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = Roles.Admin)]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ICurrentUser _currentUser;

    public AdminController(IAdminService adminService, ICurrentUser currentUser)
    {
        _adminService = adminService;
        _currentUser = currentUser;
    }

    [HttpGet("users")]
    [ProducesResponseType(typeof(IReadOnlyList<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> ListUsers(CancellationToken ct)
        => Ok(await _adminService.ListUsersAsync(ct));

    [HttpPost("users/{id}/role")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserDto>> ChangeRole(string id, ChangeRoleRequest request, CancellationToken ct)
        => Ok(await _adminService.ChangeRoleAsync(id, request.Role, ct));

    [HttpPost("users/{id}/toggle-status")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserDto>> SetDisabledStatus(string id, SetDisabledRequest request, CancellationToken ct)
    {
        if (_currentUser.Id == id)
        {
            throw AppException.BadRequest("You cannot disable or enable your own account.");
        }
        return Ok(await _adminService.SetDisabledStatusAsync(id, request.IsDisabled, ct));
    }

    [HttpGet("metrics")]
    [ProducesResponseType(typeof(AdminMetricsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminMetricsDto>> GetMetrics(CancellationToken ct)
        => Ok(await _adminService.GetMetricsAsync(ct));
}
