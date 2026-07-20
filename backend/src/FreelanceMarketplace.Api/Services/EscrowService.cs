using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FreelanceMarketplace.Api.Data;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FreelanceMarketplace.Api.Services;

public class EscrowService : IEscrowService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public EscrowService(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<MilestoneDto> FundAsync(Guid milestoneId, CancellationToken ct = default)
    {
        var milestone = await _db.Milestones
            .Include(m => m.Contract)
            .FirstOrDefaultAsync(m => m.Id == milestoneId, ct)
            ?? throw AppException.NotFound("Milestone not found.");

        var contract = milestone.Contract!;
        if (contract.Status != ContractStatus.Active)
        {
            throw AppException.BadRequest("Contract is not active.");
        }

        if (contract.ClientId != _currentUser.Id)
        {
            throw AppException.Forbidden("Only the client can fund milestones.");
        }

        if (milestone.Status != MilestoneStatus.Unfunded)
        {
            throw AppException.BadRequest("Milestone is already funded.");
        }

        var client = await _db.Users.FirstOrDefaultAsync(u => u.Id == contract.ClientId, ct)
            ?? throw AppException.NotFound("Client not found.");

        if (client.WalletBalance < milestone.Amount)
        {
            throw AppException.Validation("Insufficient wallet balance to fund this milestone.");
        }

        // Debit client
        client.WalletBalance -= milestone.Amount;
        milestone.Status = MilestoneStatus.Escrowed;

        var ledger = new LedgerEntry
        {
            ContractId = contract.Id,
            MilestoneId = milestone.Id,
            FromUserId = client.Id,
            ToUserId = null,
            Amount = milestone.Amount,
            Type = LedgerEntryType.Fund,
            BalanceAfter = client.WalletBalance,
            Note = $"Funded milestone '{milestone.Title}'",
            CreatedAt = DateTime.UtcNow
        };

        _db.LedgerEntries.Add(ledger);
        await _db.SaveChangesAsync(ct);

        return MapMilestone(milestone);
    }

    public async Task<MilestoneDto> SubmitAsync(Guid milestoneId, CancellationToken ct = default)
    {
        var milestone = await _db.Milestones
            .Include(m => m.Contract)
            .FirstOrDefaultAsync(m => m.Id == milestoneId, ct)
            ?? throw AppException.NotFound("Milestone not found.");

        var contract = milestone.Contract!;
        if (contract.Status != ContractStatus.Active)
        {
            throw AppException.BadRequest("Contract is not active.");
        }

        if (contract.FreelancerId != _currentUser.Id)
        {
            throw AppException.Forbidden("Only the assigned freelancer can submit work.");
        }

        if (milestone.Status != MilestoneStatus.Escrowed)
        {
            throw AppException.BadRequest("Milestone must be funded/escrowed to submit work.");
        }

        milestone.Status = MilestoneStatus.Submitted;
        await _db.SaveChangesAsync(ct);

        return MapMilestone(milestone);
    }

    public async Task<MilestoneDto> ReleaseAsync(Guid milestoneId, CancellationToken ct = default)
    {
        var milestone = await _db.Milestones
            .Include(m => m.Contract)
            .FirstOrDefaultAsync(m => m.Id == milestoneId, ct)
            ?? throw AppException.NotFound("Milestone not found.");

        var contract = milestone.Contract!;
        if (contract.Status != ContractStatus.Active)
        {
            throw AppException.BadRequest("Contract is not active.");
        }

        if (contract.ClientId != _currentUser.Id)
        {
            throw AppException.Forbidden("Only the client can release milestones.");
        }

        if (milestone.Status != MilestoneStatus.Submitted)
        {
            throw AppException.BadRequest("Milestone must be submitted to be released.");
        }

        var freelancer = await _db.Users.FirstOrDefaultAsync(u => u.Id == contract.FreelancerId, ct)
            ?? throw AppException.NotFound("Freelancer not found.");

        // Credit freelancer
        freelancer.WalletBalance += milestone.Amount;
        milestone.Status = MilestoneStatus.Released;

        var ledger = new LedgerEntry
        {
            ContractId = contract.Id,
            MilestoneId = milestone.Id,
            FromUserId = null,
            ToUserId = freelancer.Id,
            Amount = milestone.Amount,
            Type = LedgerEntryType.Release,
            BalanceAfter = freelancer.WalletBalance,
            Note = $"Released milestone '{milestone.Title}'",
            CreatedAt = DateTime.UtcNow
        };

        _db.LedgerEntries.Add(ledger);

        // Check if all milestones are released
        var allReleased = await _db.Milestones
            .Where(m => m.ContractId == contract.Id && m.Id != milestone.Id)
            .AllAsync(m => m.Status == MilestoneStatus.Released, ct);

        if (allReleased)
        {
            contract.Status = ContractStatus.Completed;
            contract.CompletedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        return MapMilestone(milestone);
    }

    public async Task<MilestoneDto> RejectAsync(Guid milestoneId, CancellationToken ct = default)
    {
        var milestone = await _db.Milestones
            .Include(m => m.Contract)
            .FirstOrDefaultAsync(m => m.Id == milestoneId, ct)
            ?? throw AppException.NotFound("Milestone not found.");

        var contract = milestone.Contract!;
        if (contract.Status != ContractStatus.Active)
        {
            throw AppException.BadRequest("Contract is not active.");
        }

        if (contract.ClientId != _currentUser.Id)
        {
            throw AppException.Forbidden("Only the client can reject submitted milestones.");
        }

        if (milestone.Status != MilestoneStatus.Submitted)
        {
            throw AppException.BadRequest("Only submitted milestones can be rejected.");
        }

        milestone.Status = MilestoneStatus.Escrowed;
        await _db.SaveChangesAsync(ct);

        return MapMilestone(milestone);
    }

    private static MilestoneDto MapMilestone(Milestone m)
    {
        return new MilestoneDto(
            m.Id,
            m.ContractId,
            m.Title,
            m.Amount,
            m.DueDate,
            m.Status,
            m.CreatedAt);
    }
}
