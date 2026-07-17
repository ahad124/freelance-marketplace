using FreelanceMarketplace.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FreelanceMarketplace.Api.Controllers;

[ApiController]
[Route("api/currency")]
[Authorize]
public class CurrencyController : ControllerBase
{
    private readonly ICurrencyService _currencyService;

    public CurrencyController(ICurrencyService currencyService)
    {
        _currencyService = currencyService;
    }

    [HttpGet("convert")]
    [ProducesResponseType(typeof(CurrencyConversionResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CurrencyConversionResponse>> Convert(
        [FromQuery] decimal amount,
        [FromQuery] string from,
        [FromQuery] string to,
        CancellationToken ct)
    {
        var convertedAmount = await _currencyService.ConvertAsync(amount, from, to, ct);
        return Ok(new CurrencyConversionResponse(amount, from, to, convertedAmount));
    }
}

public record CurrencyConversionResponse(decimal Amount, string From, string To, decimal ConvertedAmount);
