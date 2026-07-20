using System;

namespace FreelanceMarketplace.Api.Entities;

public class Milestone
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ContractId { get; set; }
    public Contract? Contract { get; set; }

    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }

    public MilestoneStatus Status { get; set; } = MilestoneStatus.Unfunded;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
