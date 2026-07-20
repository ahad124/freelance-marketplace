using System;
using System.Threading;
using System.Threading.Tasks;
using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FreelanceMarketplace.Api.Controllers;

[ApiController]
[Route("api/milestones")]
[Authorize]
public class MilestonesController : ControllerBase
{
    private readonly IEscrowService _escrow;

    public MilestonesController(IEscrowService escrow)
    {
        _escrow = escrow;
    }

    [HttpPost("{id:guid}/fund")]
    [Authorize(Roles = Roles.Client)]
    public async Task<ActionResult<MilestoneDto>> Fund(Guid id, CancellationToken ct)
    {
        var result = await _escrow.FundAsync(id, ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/submit")]
    [Authorize(Roles = Roles.Freelancer)]
    public async Task<ActionResult<MilestoneDto>> Submit(Guid id, CancellationToken ct)
    {
        var result = await _escrow.SubmitAsync(id, ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/release")]
    [Authorize(Roles = Roles.Client)]
    public async Task<ActionResult<MilestoneDto>> Release(Guid id, CancellationToken ct)
    {
        var result = await _escrow.ReleaseAsync(id, ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = Roles.Client)]
    public async Task<ActionResult<MilestoneDto>> Reject(Guid id, CancellationToken ct)
    {
        var result = await _escrow.RejectAsync(id, ct);
        return Ok(result);
    }
}
