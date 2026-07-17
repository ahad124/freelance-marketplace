using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FreelanceMarketplace.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ProposalsController : ControllerBase
{
    private readonly IProposalService _proposals;
    private readonly ICurrentUser _currentUser;

    public ProposalsController(IProposalService proposals, ICurrentUser currentUser)
    {
        _proposals = proposals;
        _currentUser = currentUser;
    }

    [HttpPost("proposals")]
    [Authorize(Roles = Roles.Freelancer)]
    public async Task<ActionResult<ProposalDto>> Create(CreateProposalRequest request, CancellationToken ct)
    {
        var proposal = await _proposals.CreateAsync(_currentUser.RequireId(), request, ct);
        return CreatedAtAction(nameof(Get), new { id = proposal.Id }, proposal);
    }

    [HttpGet("proposals/mine")]
    [Authorize(Roles = Roles.Freelancer)]
    public async Task<ActionResult<IReadOnlyList<ProposalDto>>> Mine(CancellationToken ct)
        => Ok(await _proposals.ListMineAsync(_currentUser.RequireId(), ct));

    /// <summary>Proposals for a job — visible to the owning client or an admin.</summary>
    [HttpGet("jobs/{jobId:guid}/proposals")]
    [Authorize(Roles = $"{Roles.Client},{Roles.Admin}")]
    public async Task<ActionResult<IReadOnlyList<ProposalDto>>> ForJob(Guid jobId, CancellationToken ct)
        => Ok(await _proposals.ListForJobAsync(jobId, ct));

    [HttpGet("proposals/{id:guid}")]
    public async Task<ActionResult<ProposalDto>> Get(Guid id, CancellationToken ct)
        => Ok(await _proposals.GetAsync(id, ct));

    [HttpPut("proposals/{id:guid}")]
    [Authorize(Roles = Roles.Freelancer)]
    public async Task<ActionResult<ProposalDto>> Update(Guid id, UpdateProposalRequest request, CancellationToken ct)
        => Ok(await _proposals.UpdateAsync(id, request, ct));

    [HttpPost("proposals/{id:guid}/withdraw")]
    [Authorize(Roles = Roles.Freelancer)]
    public async Task<ActionResult<ProposalDto>> Withdraw(Guid id, CancellationToken ct)
        => Ok(await _proposals.WithdrawAsync(id, ct));

    [HttpPost("proposals/{id:guid}/accept")]
    [Authorize(Roles = $"{Roles.Client},{Roles.Admin}")]
    public async Task<ActionResult<ProposalDto>> Accept(Guid id, CancellationToken ct)
        => Ok(await _proposals.AcceptAsync(id, ct));

    [HttpPost("proposals/{id:guid}/decline")]
    [Authorize(Roles = $"{Roles.Client},{Roles.Admin}")]
    public async Task<ActionResult<ProposalDto>> Decline(Guid id, CancellationToken ct)
        => Ok(await _proposals.DeclineAsync(id, ct));

    [HttpDelete("proposals/{id:guid}")]
    [Authorize(Roles = $"{Roles.Freelancer},{Roles.Admin}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _proposals.DeleteAsync(id, ct);
        return NoContent();
    }
}
