using FreelanceMarketplace.Api.Common;
using Microsoft.Extensions.Options;

namespace FreelanceMarketplace.Api.Services;

public class FileStorage : IFileStorage
{
    private readonly FileStorageOptions _options;

    public FileStorage(IOptions<FileStorageOptions> options)
    {
        _options = options.Value;
    }

    public async Task<string> SaveAsync(string filename, Stream stream, CancellationToken ct = default)
    {
        if (stream.Length > _options.MaxBytes)
        {
            throw AppException.BadRequest($"File exceeds maximum allowed size of {_options.MaxBytes / 1024 / 1024}MB.");
        }

        var extension = Path.GetExtension(filename).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf", ".zip", ".txt", ".docx" };
        if (!allowedExtensions.Contains(extension))
        {
            throw AppException.BadRequest("File type not allowed.");
        }

        var uniqueName = $"{Guid.NewGuid()}{extension}";
        var directory = Path.GetFullPath(_options.RootPath);
        if (!Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        var filePath = Path.Combine(directory, uniqueName);
        using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, useAsync: true);
        await stream.CopyToAsync(fileStream, ct);

        return uniqueName;
    }

    public Task<(Stream Stream, string ContentType)> GetAsync(string filePath, CancellationToken ct = default)
    {
        var directory = Path.GetFullPath(_options.RootPath);
        var fileName = Path.GetFileName(filePath); // sanitize to prevent directory traversal
        var fullPath = Path.Combine(directory, fileName);

        if (!File.Exists(fullPath))
        {
            throw AppException.NotFound("File not found.");
        }

        var ext = Path.GetExtension(fullPath).ToLowerInvariant();
        var contentType = ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".pdf" => "application/pdf",
            ".zip" => "application/zip",
            ".txt" => "text/plain",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _ => "application/octet-stream"
        };

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, useAsync: true);
        return Task.FromResult<(Stream, string)>((stream, contentType));
    }

    public Task DeleteAsync(string filePath, CancellationToken ct = default)
    {
        var directory = Path.GetFullPath(_options.RootPath);
        var fileName = Path.GetFileName(filePath);
        var fullPath = Path.Combine(directory, fileName);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
        return Task.CompletedTask;
    }
}
