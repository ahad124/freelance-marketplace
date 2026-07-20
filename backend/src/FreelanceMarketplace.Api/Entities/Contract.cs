using System;
using System.Collections.Generic;

namespace FreelanceMarketplace.Api.Entities;

public class Contract
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid JobId { get; set; }
    public Job? Job { get; set; }

    public Guid ProposalId { get; set; }
    public Proposal? Proposal { get; set; }

    public string ClientId { get; set; } = string.Empty;
    public AppUser? Client { get; set; }

    public string FreelancerId { get; set; } = string.Empty;
    public AppUser? Freelancer { get; set; }

    public decimal AgreedAmount { get; set; }
    public string Currency { get; set; } = "USD";

    public ContractStatus Status { get; set; } = ContractStatus.Active;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public ICollection<Milestone> Milestones { get; set; } = new List<Milestone>();
    public ICollection<LedgerEntry> LedgerEntries { get; set; } = new List<LedgerEntry>();
}
