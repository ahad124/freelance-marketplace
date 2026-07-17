namespace FreelanceMarketplace.Api.Common;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 60;
}

public class CurrencyOptions
{
    public const string SectionName = "Currency";

    public string BaseUrl { get; set; } = "https://api.frankfurter.app";
    public int TimeoutSeconds { get; set; } = 5;
    public int CacheMinutes { get; set; } = 60;
}

public class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    public string RootPath { get; set; } = "uploads";
    public long MaxBytes { get; set; } = 5 * 1024 * 1024;
}
