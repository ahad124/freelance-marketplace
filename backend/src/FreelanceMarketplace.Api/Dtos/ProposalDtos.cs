using FreelanceMarketplace.Api.Entities;

namespace FreelanceMarketplace.Api.Dtos;

public record ProposalDto(
    Guid Id,
    Guid JobId,
    string JobTitle,
    string FreelancerId,
    string FreelancerName,
    string CoverLetter,
    decimal BidAmount,
    DateTime DeliveryDate,
    ProposalStatus Status,
    DateTime CreatedAt);

public record CreateProposalRequest(
    Guid JobId,
    string CoverLetter,
    decimal BidAmount,
    DateTime DeliveryDate);

public record UpdateProposalRequest(
    string CoverLetter,
    decimal BidAmount,
    DateTime DeliveryDate);
