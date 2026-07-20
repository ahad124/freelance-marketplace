namespace FreelanceMarketplace.Api.Entities;

public enum BudgetType
{
    Fixed = 0,
    Hourly = 1
}

public enum JobStatus
{
    Open = 0,
    InProgress = 1,
    Closed = 2
}

public enum ProposalStatus
{
    Submitted = 0,
    Withdrawn = 1,
    Accepted = 2,
    Declined = 3
}

public enum ContractStatus
{
    Active = 0,
    Completed = 1,
    Cancelled = 2
}

public enum MilestoneStatus
{
    Unfunded = 0,
    Escrowed = 1,
    Submitted = 2,
    Released = 3
}

public enum LedgerEntryType
{
    Fund = 0,
    Release = 1,
    Refund = 2
}

