namespace FreelanceMarketplace.Api.Entities;

/// <summary>A job posted by a Client for Freelancers to propose on.</summary>
public class Job
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string ClientId { get; set; } = string.Empty;
    public AppUser? Client { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

    public BudgetType BudgetType { get; set; }
    public decimal BudgetAmount { get; set; }

    /// <summary>ISO 4217 currency the budget is expressed in (e.g. "USD").</summary>
    public string BudgetCurrency { get; set; } = "USD";

    public JobStatus Status { get; set; } = JobStatus.Open;

    /// <summary>Relative path/key of an optional attachment in local file storage.</summary>
    public string? AttachmentPath { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Proposal> Proposals { get; set; } = new List<Proposal>();
}
