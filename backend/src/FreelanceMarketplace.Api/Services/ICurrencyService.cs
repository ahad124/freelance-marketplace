namespace FreelanceMarketplace.Api.Services;

public interface ICurrencyService
{
    Task<decimal> ConvertAsync(decimal amount, string from, string to, CancellationToken ct = default);
}
