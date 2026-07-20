using System;
using System.Threading;
using System.Threading.Tasks;
using FreelanceMarketplace.Api.Dtos;

namespace FreelanceMarketplace.Api.Services;

public interface IEscrowService
{
    Task<MilestoneDto> FundAsync(Guid milestoneId, CancellationToken ct = default);
    Task<MilestoneDto> SubmitAsync(Guid milestoneId, CancellationToken ct = default);
    Task<MilestoneDto> ReleaseAsync(Guid milestoneId, CancellationToken ct = default);
    Task<MilestoneDto> RejectAsync(Guid milestoneId, CancellationToken ct = default);
}
