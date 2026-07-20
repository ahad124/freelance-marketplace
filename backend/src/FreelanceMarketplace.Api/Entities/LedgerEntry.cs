using System;

namespace FreelanceMarketplace.Api.Entities;

public class LedgerEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ContractId { get; set; }
    public Contract? Contract { get; set; }

    public Guid? MilestoneId { get; set; }
    public Milestone? Milestone { get; set; }

    public string? FromUserId { get; set; }
    public AppUser? FromUser { get; set; }

    public string? ToUserId { get; set; }
    public AppUser? ToUser { get; set; }

    public decimal Amount { get; set; }
    public LedgerEntryType Type { get; set; }
    public decimal BalanceAfter { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Note { get; set; } = string.Empty;
}
