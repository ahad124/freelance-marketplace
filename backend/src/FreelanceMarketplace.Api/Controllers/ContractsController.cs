using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FreelanceMarketplace.Api.Controllers;

[ApiController]
[Route("api/contracts")]
[Authorize]
public class ContractsController : ControllerBase
{
    private readonly IContractService _contracts;

    public ContractsController(IContractService contracts)
    {
        _contracts = contracts;
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<ContractDto>>> Mine(CancellationToken ct)
    {
        var result = await _contracts.ListMineAsync(ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContractDto>> Get(Guid id, CancellationToken ct)
    {
        var result = await _contracts.GetAsync(id, ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/milestones")]
    [Authorize(Roles = Roles.Client)]
    public async Task<ActionResult<MilestoneDto>> AddMilestone(Guid id, CreateMilestoneRequest request, CancellationToken ct)
    {
        var result = await _contracts.AddMilestoneAsync(id, request, ct);
        return Ok(result);
    }
}
