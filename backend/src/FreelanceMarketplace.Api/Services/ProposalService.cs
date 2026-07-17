using FreelanceMarketplace.Api.Data;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FreelanceMarketplace.Api.Services;

public interface IProposalService
{
    Task<ProposalDto> CreateAsync(string freelancerId, CreateProposalRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<ProposalDto>> ListMineAsync(string freelancerId, CancellationToken ct = default);
    Task<IReadOnlyList<ProposalDto>> ListForJobAsync(Guid jobId, CancellationToken ct = default);
    Task<ProposalDto> GetAsync(Guid id, CancellationToken ct = default);
    Task<ProposalDto> UpdateAsync(Guid id, UpdateProposalRequest request, CancellationToken ct = default);
    Task<ProposalDto> WithdrawAsync(Guid id, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public class ProposalService : IProposalService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public ProposalService(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<ProposalDto> CreateAsync(string freelancerId, CreateProposalRequest request, CancellationToken ct = default)
    {
        var job = await _db.Jobs.FirstOrDefaultAsync(j => j.Id == request.JobId, ct)
            ?? throw AppException.NotFound("Job not found.");

        if (job.Status != JobStatus.Open)
        {
            throw AppException.BadRequest("This job is no longer open for proposals.");
        }

        if (job.ClientId == freelancerId)
        {
            throw AppException.BadRequest("You cannot propose on your own job.");
        }

        var hasActive = await _db.Proposals.AnyAsync(
            p => p.JobId == request.JobId
                 && p.FreelancerId == freelancerId
                 && p.Status == ProposalStatus.Submitted, ct);
        if (hasActive)
        {
            throw AppException.Conflict("You already have an active proposal on this job.");
        }

        var proposal = new Proposal
        {
            JobId = request.JobId,
            FreelancerId = freelancerId,
            CoverLetter = request.CoverLetter.Trim(),
            BidAmount = request.BidAmount,
            DeliveryDate = request.DeliveryDate,
            Status = ProposalStatus.Submitted
        };

        _db.Proposals.Add(proposal);
        await _db.SaveChangesAsync(ct);
        return await GetAsync(proposal.Id, ct);
    }

    public async Task<IReadOnlyList<ProposalDto>> ListMineAsync(string freelancerId, CancellationToken ct = default) =>
        await _db.Proposals.AsNoTracking()
            .Where(p => p.FreelancerId == freelancerId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(ToDto)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<ProposalDto>> ListForJobAsync(Guid jobId, CancellationToken ct = default)
    {
        var job = await _db.Jobs.AsNoTracking().FirstOrDefaultAsync(j => j.Id == jobId, ct)
            ?? throw AppException.NotFound("Job not found.");

        if (!_currentUser.IsAdmin && job.ClientId != _currentUser.Id)
        {
            throw AppException.Forbidden("Only the job owner can view its proposals.");
        }

        return await _db.Proposals.AsNoTracking()
            .Where(p => p.JobId == jobId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(ToDto)
            .ToListAsync(ct);
    }

    public async Task<ProposalDto> GetAsync(Guid id, CancellationToken ct = default)
    {
        var dto = await _db.Proposals.AsNoTracking().Where(p => p.Id == id).Select(ToDto).FirstOrDefaultAsync(ct);
        return dto ?? throw AppException.NotFound("Proposal not found.");
    }

    public async Task<ProposalDto> UpdateAsync(Guid id, UpdateProposalRequest request, CancellationToken ct = default)
    {
        var proposal = await _db.Proposals.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw AppException.NotFound("Proposal not found.");
        EnsureOwner(proposal);

        if (proposal.Status != ProposalStatus.Submitted)
        {
            throw AppException.BadRequest("Only an active proposal can be edited.");
        }

        proposal.CoverLetter = request.CoverLetter.Trim();
        proposal.BidAmount = request.BidAmount;
        proposal.DeliveryDate = request.DeliveryDate;

        await _db.SaveChangesAsync(ct);
        return await GetAsync(proposal.Id, ct);
    }

    public async Task<ProposalDto> WithdrawAsync(Guid id, CancellationToken ct = default)
    {
        var proposal = await _db.Proposals.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw AppException.NotFound("Proposal not found.");
        EnsureOwner(proposal);

        proposal.Status = ProposalStatus.Withdrawn;
        await _db.SaveChangesAsync(ct);
        return await GetAsync(proposal.Id, ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var proposal = await _db.Proposals.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw AppException.NotFound("Proposal not found.");

        if (!_currentUser.IsAdmin && proposal.FreelancerId != _currentUser.Id)
        {
            throw AppException.Forbidden("You can only delete your own proposals.");
        }

        _db.Proposals.Remove(proposal);
        await _db.SaveChangesAsync(ct);
    }

    private void EnsureOwner(Proposal proposal)
    {
        if (proposal.FreelancerId != _currentUser.Id)
        {
            throw AppException.Forbidden("You can only modify your own proposals.");
        }
    }

    private static readonly System.Linq.Expressions.Expression<Func<Proposal, ProposalDto>> ToDto = p => new ProposalDto(
        p.Id,
        p.JobId,
        p.Job!.Title,
        p.FreelancerId,
        p.Freelancer!.DisplayName,
        p.CoverLetter,
        p.BidAmount,
        p.DeliveryDate,
        p.Status,
        p.CreatedAt);
}
