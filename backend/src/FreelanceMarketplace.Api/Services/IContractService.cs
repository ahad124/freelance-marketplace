using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FreelanceMarketplace.Api.Dtos;

namespace FreelanceMarketplace.Api.Services;

public interface IContractService
{
    Task<List<ContractDto>> ListMineAsync(CancellationToken ct = default);
    Task<ContractDto> GetAsync(Guid id, CancellationToken ct = default);
    Task<MilestoneDto> AddMilestoneAsync(Guid contractId, CreateMilestoneRequest request, CancellationToken ct = default);
}
