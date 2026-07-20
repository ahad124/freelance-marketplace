using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FreelanceMarketplace.Api.Data;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FreelanceMarketplace.Api.Controllers;

[ApiController]
[Route("api/wallet")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public WalletController(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<WalletDto>> GetWallet(CancellationToken ct)
    {
        var userId = _currentUser.Id;

        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw AppException.NotFound("User not found.");

        var ledger = await _db.LedgerEntries.AsNoTracking()
            .Include(l => l.FromUser)
            .Include(l => l.ToUser)
            .Where(l => l.FromUserId == userId || l.ToUserId == userId)
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

        return Ok(new WalletDto(user.WalletBalance, ledger));
    }
}
