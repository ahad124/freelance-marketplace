using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FreelanceMarketplace.Api.Controllers;

[ApiController]
[Route("api/jobs")]
public class JobsController : ControllerBase
{
    private readonly IJobService _jobs;
    private readonly ICurrentUser _currentUser;

    public JobsController(IJobService jobs, ICurrentUser currentUser)
    {
        _jobs = jobs;
        _currentUser = currentUser;
    }

    /// <summary>Public listing of open jobs with optional search/filter.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<JobDto>>> List([FromQuery] JobQuery query, CancellationToken ct)
        => Ok(await _jobs.ListOpenAsync(query, ct));

    /// <summary>The current client's own jobs (any status).</summary>
    [HttpGet("mine")]
    [Authorize(Roles = Roles.Client)]
    public async Task<ActionResult<IReadOnlyList<JobDto>>> Mine(CancellationToken ct)
        => Ok(await _jobs.ListMineAsync(_currentUser.RequireId(), ct));

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<JobDto>> Get(Guid id, CancellationToken ct)
        => Ok(await _jobs.GetAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = Roles.Client)]
    public async Task<ActionResult<JobDto>> Create(CreateJobRequest request, CancellationToken ct)
    {
        var job = await _jobs.CreateAsync(_currentUser.RequireId(), request, ct);
        return CreatedAtAction(nameof(Get), new { id = job.Id }, job);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{Roles.Client},{Roles.Admin}")]
    public async Task<ActionResult<JobDto>> Update(Guid id, UpdateJobRequest request, CancellationToken ct)
        => Ok(await _jobs.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{Roles.Client},{Roles.Admin}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _jobs.DeleteAsync(id, ct);
        return NoContent();
    }
}
