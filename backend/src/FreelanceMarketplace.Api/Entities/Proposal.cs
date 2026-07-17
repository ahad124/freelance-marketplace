namespace FreelanceMarketplace.Api.Entities;

/// <summary>A Freelancer's bid on a Job.</summary>
public class Proposal
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid JobId { get; set; }
    public Job? Job { get; set; }

    public string FreelancerId { get; set; } = string.Empty;
    public AppUser? Freelancer { get; set; }

    public string CoverLetter { get; set; } = string.Empty;
    public decimal BidAmount { get; set; }
    public DateTime DeliveryDate { get; set; }

    public ProposalStatus Status { get; set; } = ProposalStatus.Submitted;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
