namespace FreelanceMarketplace.Api.Services;

public interface IFileStorage
{
    Task<string> SaveAsync(string filename, Stream stream, CancellationToken ct = default);
    Task<(Stream Stream, string ContentType)> GetAsync(string filePath, CancellationToken ct = default);
    Task DeleteAsync(string filePath, CancellationToken ct = default);
}
