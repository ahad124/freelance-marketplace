using Microsoft.AspNetCore.Identity;

namespace FreelanceMarketplace.Api.Entities;

/// <summary>Application user; extends ASP.NET Core Identity with marketplace profile fields.</summary>
public class AppUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>ISO 4217 currency the user prefers to see amounts in (e.g. "USD").</summary>
    public string PreferredCurrency { get; set; } = "USD";

    /// <summary>Relative path/key of the user's avatar in local file storage, if any.</summary>
    public string? AvatarPath { get; set; }

    /// <summary>When true the account is blocked from authenticating.</summary>
    public bool IsDisabled { get; set; }

    /// <summary>Simulated wallet balance for escrow transactions.</summary>
    public decimal WalletBalance { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Job> Jobs { get; set; } = new List<Job>();
    public ICollection<Proposal> Proposals { get; set; } = new List<Proposal>();
}
