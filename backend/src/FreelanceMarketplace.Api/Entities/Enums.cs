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
