using FluentAssertions;
using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using System.Net;
using Xunit;

namespace FreelanceMarketplace.Tests.Unit;

public class CurrencyServiceTests
{
    private readonly Mock<HttpMessageHandler> _handlerMock;
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly IOptions<CurrencyOptions> _options;
    private readonly Mock<ILogger<CurrencyService>> _loggerMock;

    public CurrencyServiceTests()
    {
        _handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        _httpClient = new HttpClient(_handlerMock.Object);
        _cache = new MemoryCache(new MemoryCacheOptions());
        
        _options = Options.Create(new CurrencyOptions
        {
            BaseUrl = "https://api.frankfurter.app",
            TimeoutSeconds = 2,
            CacheMinutes = 10
        });

        _loggerMock = new Mock<ILogger<CurrencyService>>();
    }

    [Fact]
    public async Task ConvertAsync_ValidApiResponse_ConvertsCorrectlyAndCaches()
    {
        // Arrange
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req => 
                    req.RequestUri.ToString().Contains("/latest?from=USD&to=EUR")),
                ItExpr.IsAny<CancellationToken>()
            )
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{\"amount\":1.0,\"base\":\"USD\",\"date\":\"2026-07-17\",\"rates\":{\"EUR\":0.925}}")
            })
            .Verifiable();

        var service = new CurrencyService(_httpClient, _cache, _options, _loggerMock.Object);

        // Act
        var result1 = await service.ConvertAsync(100m, "USD", "EUR");
        var result2 = await service.ConvertAsync(200m, "USD", "EUR"); // Should use cached rate

        // Assert
        result1.Should().Be(92.50m);
        result2.Should().Be(185.00m); // 200 * 0.925

        _handlerMock.Protected().Verify(
            "SendAsync",
            Times.Once(),
            ItExpr.IsAny<HttpRequestMessage>(),
            ItExpr.IsAny<CancellationToken>()
        );
    }

    [Fact]
    public async Task ConvertAsync_ApiReturnsError_GracefulFallback()
    {
        // Arrange
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            )
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.InternalServerError
            });

        var service = new CurrencyService(_httpClient, _cache, _options, _loggerMock.Object);

        // Act
        var result = await service.ConvertAsync(100m, "USD", "EUR");

        // Assert
        result.Should().Be(100m); // Falls back to original amount
    }

    [Fact]
    public async Task ConvertAsync_ApiTimesOut_GracefulFallback()
    {
        // Arrange
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            )
            .ThrowsAsync(new TaskCanceledException("Timeout"));

        var service = new CurrencyService(_httpClient, _cache, _options, _loggerMock.Object);

        // Act
        var result = await service.ConvertAsync(150m, "USD", "GBP");

        // Assert
        result.Should().Be(150m); // Falls back to original amount
    }

    [Fact]
    public async Task ConvertAsync_MatchingCurrencies_ShortCircuitsWithoutCallingApi()
    {
        // Arrange
        var service = new CurrencyService(_httpClient, _cache, _options, _loggerMock.Object);

        // Act
        var result = await service.ConvertAsync(75m, "USD", "USD");

        // Assert
        result.Should().Be(75m);
        // Handler mock should not be called at all
    }
}
