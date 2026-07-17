using FreelanceMarketplace.Api.Data;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FreelanceMarketplace.Api.Services;

public interface IJobService
{
    Task<IReadOnlyList<JobDto>> ListOpenAsync(JobQuery query, CancellationToken ct = default);
    Task<IReadOnlyList<JobDto>> ListMineAsync(string clientId, CancellationToken ct = default);
    Task<JobDto> GetAsync(Guid id, CancellationToken ct = default);
    Task<JobDto> CreateAsync(string clientId, CreateJobRequest request, CancellationToken ct = default);
    Task<JobDto> UpdateAsync(Guid id, UpdateJobRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public class JobService : IJobService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public JobService(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<JobDto>> ListOpenAsync(JobQuery query, CancellationToken ct = default)
    {
        var q = _db.Jobs.AsNoTracking().Where(j => j.Status == JobStatus.Open);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            q = q.Where(j => EF.Functions.Like(j.Title, $"%{term}%")
                          || EF.Functions.Like(j.Description, $"%{term}%"));
        }

        if (!string.IsNullOrWhiteSpace(query.Category))
        {
            q = q.Where(j => j.Category == query.Category);
        }

        if (query.MinBudget is { } min)
        {
            q = q.Where(j => j.BudgetAmount >= min);
        }

        if (query.MaxBudget is { } max)
        {
            q = q.Where(j => j.BudgetAmount <= max);
        }

        return await q.OrderByDescending(j => j.CreatedAt).Select(ToDto).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<JobDto>> ListMineAsync(string clientId, CancellationToken ct = default) =>
        await _db.Jobs.AsNoTracking()
            .Where(j => j.ClientId == clientId)
            .OrderByDescending(j => j.CreatedAt)
            .Select(ToDto)
            .ToListAsync(ct);

    public async Task<JobDto> GetAsync(Guid id, CancellationToken ct = default)
    {
        var dto = await _db.Jobs.AsNoTracking().Where(j => j.Id == id).Select(ToDto).FirstOrDefaultAsync(ct);
        return dto ?? throw AppException.NotFound("Job not found.");
    }

    public async Task<JobDto> CreateAsync(string clientId, CreateJobRequest request, CancellationToken ct = default)
    {
        var job = new Job
        {
            ClientId = clientId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Category = request.Category.Trim(),
            BudgetType = request.BudgetType,
            BudgetAmount = request.BudgetAmount,
            BudgetCurrency = request.BudgetCurrency.ToUpperInvariant(),
            Status = JobStatus.Open
        };

        _db.Jobs.Add(job);
        await _db.SaveChangesAsync(ct);
        return await GetAsync(job.Id, ct);
    }

    public async Task<JobDto> UpdateAsync(Guid id, UpdateJobRequest request, CancellationToken ct = default)
    {
        var job = await _db.Jobs.FirstOrDefaultAsync(j => j.Id == id, ct)
            ?? throw AppException.NotFound("Job not found.");
        EnsureCanModify(job);

        job.Title = request.Title.Trim();
        job.Description = request.Description.Trim();
        job.Category = request.Category.Trim();
        job.BudgetType = request.BudgetType;
        job.BudgetAmount = request.BudgetAmount;
        job.BudgetCurrency = request.BudgetCurrency.ToUpperInvariant();
        job.Status = request.Status;

        await _db.SaveChangesAsync(ct);
        return await GetAsync(job.Id, ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var job = await _db.Jobs.FirstOrDefaultAsync(j => j.Id == id, ct)
            ?? throw AppException.NotFound("Job not found.");
        EnsureCanModify(job);

        _db.Jobs.Remove(job);
        await _db.SaveChangesAsync(ct);
    }

    /// <summary>Only the owning client or an admin may mutate a job.</summary>
    private void EnsureCanModify(Job job)
    {
        if (!_currentUser.IsAdmin && job.ClientId != _currentUser.Id)
        {
            throw AppException.Forbidden("You can only modify your own jobs.");
        }
    }

    // Projected in SQL — must remain an expression (no method calls EF can't translate).
    private static readonly System.Linq.Expressions.Expression<Func<Job, JobDto>> ToDto = job => new JobDto(
        job.Id,
        job.Title,
        job.Description,
        job.Category,
        job.BudgetType,
        job.BudgetAmount,
        job.BudgetCurrency,
        job.Status,
        job.AttachmentPath,
        job.ClientId,
        job.Client!.DisplayName,
        job.Proposals.Count,
        job.CreatedAt);
}
