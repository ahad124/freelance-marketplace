using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FreelanceMarketplace.Api.Data;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FreelanceMarketplace.Api.Services;

public class ContractService : IContractService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public ContractService(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<ContractDto>> ListMineAsync(CancellationToken ct = default)
    {
        var currentUserId = _currentUser.Id;

        var contracts = await _db.Contracts.AsNoTracking()
            .Include(c => c.Job)
            .Include(c => c.Client)
            .Include(c => c.Freelancer)
            .Where(c => c.ClientId == currentUserId || c.FreelancerId == currentUserId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);

        var dtoList = new List<ContractDto>();
        foreach (var c in contracts)
        {
            dtoList.Add(await MapContractAsync(c, ct));
        }

        return dtoList;
    }

    public async Task<ContractDto> GetAsync(Guid id, CancellationToken ct = default)
    {
        var contract = await _db.Contracts.AsNoTracking()
            .Include(c => c.Job)
            .Include(c => c.Client)
            .Include(c => c.Freelancer)
            .FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw AppException.NotFound("Contract not found.");

        if (!_currentUser.IsAdmin && contract.ClientId != _currentUser.Id && contract.FreelancerId != _currentUser.Id)
        {
            throw AppException.Forbidden("You are not a party to this contract.");
        }

        return await MapContractAsync(contract, ct);
    }

    public async Task<MilestoneDto> AddMilestoneAsync(Guid contractId, CreateMilestoneRequest request, CancellationToken ct = default)
    {
        var contract = await _db.Contracts.FirstOrDefaultAsync(c => c.Id == contractId, ct)
            ?? throw AppException.NotFound("Contract not found.");

        if (contract.ClientId != _currentUser.Id)
        {
            throw AppException.Forbidden("Only the client can add milestones.");
        }

        if (contract.Status != ContractStatus.Active)
        {
            throw AppException.BadRequest("Milestones can only be added to active contracts.");
        }

        var milestone = new Milestone
        {
            ContractId = contract.Id,
            Title = request.Title.Trim(),
            Amount = request.Amount,
            DueDate = request.DueDate,
            Status = MilestoneStatus.Unfunded,
            CreatedAt = DateTime.UtcNow
        };

        _db.Milestones.Add(milestone);
        await _db.SaveChangesAsync(ct);

        return new MilestoneDto(
            milestone.Id,
            milestone.ContractId,
            milestone.Title,
            milestone.Amount,
            milestone.DueDate,
            milestone.Status,
            milestone.CreatedAt);
    }

    private async Task<ContractDto> MapContractAsync(Contract c, CancellationToken ct)
    {
        var milestones = await _db.Milestones.AsNoTracking()
            .Where(m => m.ContractId == c.Id)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new MilestoneDto(
                m.Id,
                m.ContractId,
                m.Title,
                m.Amount,
                m.DueDate,
                m.Status,
                m.CreatedAt))
            .ToListAsync(ct);

        var ledgerEntries = await _db.LedgerEntries.AsNoTracking()
            .Include(l => l.FromUser)
            .Include(l => l.ToUser)
            .Where(l => l.ContractId == c.Id)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new LedgerEntryDto(
                l.Id,
                l.ContractId,
                l.MilestoneId,
                l.FromUserId,
                l.FromUser != null ? l.FromUser.DisplayName : null,
                l.ToUserId,
                l.ToUser != null ? l.ToUser.DisplayName : null,
                l.Amount,
                l.Type,
                l.BalanceAfter,
                l.CreatedAt,
                l.Note))
            .ToListAsync(ct);

        return new ContractDto(
            c.Id,
            c.JobId,
            c.Job != null ? c.Job.Title : string.Empty,
            c.ProposalId,
            c.ClientId,
            c.Client != null ? c.Client.DisplayName : string.Empty,
            c.FreelancerId,
            c.Freelancer != null ? c.Freelancer.DisplayName : string.Empty,
            c.AgreedAmount,
            c.Currency,
            c.Status,
            c.CreatedAt,
            c.CompletedAt,
            milestones,
            ledgerEntries);
    }
}
