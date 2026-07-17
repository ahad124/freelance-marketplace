using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Data;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FreelanceMarketplace.Api.Services;

public class AdminService : IAdminService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly AppDbContext _db;

    public AdminService(
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole> roleManager,
        AppDbContext db)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _db = db;
    }

    public async Task<IReadOnlyList<UserDto>> ListUsersAsync(CancellationToken ct = default)
    {
        var users = await _userManager.Users.OrderByDescending(u => u.CreatedAt).ToListAsync(ct);
        var dtos = new List<UserDto>();
        foreach (var u in users)
        {
            dtos.Add(await MapToDtoAsync(u));
        }
        return dtos;
    }

    public async Task<UserDto> ChangeRoleAsync(string userId, string newRole, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw AppException.NotFound("User not found.");

        newRole = char.ToUpperInvariant(newRole[0]) + newRole[1..].ToLowerInvariant();
        if (!Roles.All.Contains(newRole))
        {
            throw AppException.BadRequest($"Invalid role. Must be one of: {string.Join(", ", Roles.All)}");
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        if (currentRoles.Contains(newRole))
        {
            return await MapToDtoAsync(user);
        }

        var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
        if (!removeResult.Succeeded)
        {
            throw AppException.Validation("Failed to remove old roles.");
        }

        var addResult = await _userManager.AddToRoleAsync(user, newRole);
        if (!addResult.Succeeded)
        {
            throw AppException.Validation("Failed to add new role.");
        }

        return await MapToDtoAsync(user);
    }

    public async Task<UserDto> SetDisabledStatusAsync(string userId, bool isDisabled, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw AppException.NotFound("User not found.");

        user.IsDisabled = isDisabled;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            throw AppException.Validation("Failed to update user status.");
        }

        return await MapToDtoAsync(user);
    }

    public async Task<AdminMetricsDto> GetMetricsAsync(CancellationToken ct = default)
    {
        var totalUsers = await _db.Users.CountAsync(ct);

        var usersByRole = new Dictionary<string, int>();
        foreach (var roleName in Roles.All)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role != null)
            {
                var count = await _db.UserRoles.CountAsync(ur => ur.RoleId == role.Id, ct);
                usersByRole[roleName] = count;
            }
            else
            {
                usersByRole[roleName] = 0;
            }
        }

        var totalJobs = await _db.Jobs.CountAsync(ct);
        var openJobs = await _db.Jobs.CountAsync(j => j.Status == JobStatus.Open, ct);
        var totalProposals = await _db.Proposals.CountAsync(ct);

        var cutoff = DateTime.UtcNow.AddDays(-7);
        var recentUsers = await _db.Users
            .Where(u => u.CreatedAt >= cutoff)
            .OrderByDescending(u => u.CreatedAt)
            .Take(10)
            .ToListAsync(ct);

        var recentDtos = new List<UserDto>();
        foreach (var u in recentUsers)
        {
            recentDtos.Add(await MapToDtoAsync(u));
        }

        return new AdminMetricsDto(
            totalUsers,
            usersByRole,
            totalJobs,
            openJobs,
            totalProposals,
            recentDtos
        );
    }

    private async Task<UserDto> MapToDtoAsync(AppUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return new UserDto(
            user.Id,
            user.Email ?? string.Empty,
            user.DisplayName,
            roles.FirstOrDefault() ?? string.Empty,
            user.PreferredCurrency,
            user.AvatarPath,
            user.IsDisabled
        );
    }
}
