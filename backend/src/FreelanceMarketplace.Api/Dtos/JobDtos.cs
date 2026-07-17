using FreelanceMarketplace.Api.Entities;

namespace FreelanceMarketplace.Api.Dtos;

public record JobDto(
    Guid Id,
    string Title,
    string Description,
    string Category,
    BudgetType BudgetType,
    decimal BudgetAmount,
    string BudgetCurrency,
    JobStatus Status,
    string? AttachmentPath,
    string ClientId,
    string ClientName,
    int ProposalCount,
    DateTime CreatedAt);

public record CreateJobRequest(
    string Title,
    string Description,
    string Category,
    BudgetType BudgetType,
    decimal BudgetAmount,
    string BudgetCurrency);

public record UpdateJobRequest(
    string Title,
    string Description,
    string Category,
    BudgetType BudgetType,
    decimal BudgetAmount,
    string BudgetCurrency,
    JobStatus Status);

/// <summary>Filter/search parameters for the public job listing.</summary>
public record JobQuery(
    string? Search = null,
    string? Category = null,
    decimal? MinBudget = null,
    decimal? MaxBudget = null);
