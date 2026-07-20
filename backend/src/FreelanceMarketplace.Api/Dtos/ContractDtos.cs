using System;
using System.Collections.Generic;
using FreelanceMarketplace.Api.Entities;

namespace FreelanceMarketplace.Api.Dtos;

public record ContractDto(
    Guid Id,
    Guid JobId,
    string JobTitle,
    Guid ProposalId,
    string ClientId,
    string ClientName,
    string FreelancerId,
    string FreelancerName,
    decimal AgreedAmount,
    string Currency,
    ContractStatus Status,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    List<MilestoneDto> Milestones,
    List<LedgerEntryDto> LedgerEntries);

public record MilestoneDto(
    Guid Id,
    Guid ContractId,
    string Title,
    decimal Amount,
    DateTime DueDate,
    MilestoneStatus Status,
    DateTime CreatedAt);

public record LedgerEntryDto(
    Guid Id,
    Guid ContractId,
    Guid? MilestoneId,
    string? FromUserId,
    string? FromUserName,
    string? ToUserId,
    string? ToUserName,
    decimal Amount,
    LedgerEntryType Type,
    decimal BalanceAfter,
    DateTime CreatedAt,
    string Note);

public record CreateMilestoneRequest(
    string Title,
    decimal Amount,
    DateTime DueDate);

public record WalletDto(
    decimal Balance,
    List<LedgerEntryDto> Ledger);
