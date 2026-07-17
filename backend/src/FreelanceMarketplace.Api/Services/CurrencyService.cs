using FreelanceMarketplace.Api.Common;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace FreelanceMarketplace.Api.Services;

public class CurrencyService : ICurrencyService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly CurrencyOptions _options;
    private readonly ILogger<CurrencyService> _logger;

    public CurrencyService(
        HttpClient httpClient,
        IMemoryCache cache,
        IOptions<CurrencyOptions> options,
        ILogger<CurrencyService> logger)
    {
        _httpClient = httpClient;
        _cache = cache;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<decimal> ConvertAsync(decimal amount, string from, string to, CancellationToken ct = default)
    {
        from = from.ToUpperInvariant().Trim();
        to = to.ToUpperInvariant().Trim();

        if (from == to || amount == 0)
        {
            return amount;
        }

        var cacheKey = $"rate_{from}_{to}";

        if (!_cache.TryGetValue(cacheKey, out decimal rate))
        {
            try
            {
                rate = await FetchRateFromApiAsync(from, to, ct);
                
                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(_options.CacheMinutes));
                
                _cache.Set(cacheKey, rate, cacheEntryOptions);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch exchange rate from {From} to {To}. Falling back to 1.0 (no conversion).", from, to);
                // Return original amount as fallback, i.e. conversion rate is 1.0
                return amount;
            }
        }

        return Math.Round(amount * rate, 2);
    }

    private async Task<decimal> FetchRateFromApiAsync(string from, string to, CancellationToken ct)
    {
        var baseUrl = _options.BaseUrl.TrimEnd('/');
        var url = $"{baseUrl}/latest?from={from}&to={to}";

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(_options.TimeoutSeconds));

        var response = await _httpClient.GetAsync(url, cts.Token);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        
        if (root.TryGetProperty("rates", out var ratesElement) && 
            ratesElement.TryGetProperty(to, out var rateElement))
        {
            return rateElement.GetDecimal();
        }

        throw new InvalidOperationException($"Currency rate for target {to} was not found in response.");
    }
}
