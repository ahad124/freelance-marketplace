using FluentAssertions;
using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Services;
using Microsoft.Extensions.Options;
using Xunit;

namespace FreelanceMarketplace.Tests.Unit;

public class FileStorageTests : IDisposable
{
    private readonly string _tempDirectory;
    private readonly FileStorage _storage;

    public FileStorageTests()
    {
        _tempDirectory = Path.Combine(Path.GetTempPath(), "freelance_test_" + Guid.NewGuid().ToString());
        Directory.CreateDirectory(_tempDirectory);

        var options = Options.Create(new FileStorageOptions
        {
            RootPath = _tempDirectory,
            MaxBytes = 100 // 100 bytes limit for unit testing
        });

        _storage = new FileStorage(options);
    }

    [Fact]
    public async Task SaveAsync_ValidFile_SavesToDisk()
    {
        var content = "Hello world from tests";
        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));

        var fileName = await _storage.SaveAsync("test.txt", stream);

        fileName.Should().EndWith(".txt");
        var filePath = Path.Combine(_tempDirectory, fileName);
        File.Exists(filePath).Should().BeTrue();
        File.ReadAllText(filePath).Should().Be(content);
    }

    [Fact]
    public async Task SaveAsync_TooLargeFile_ThrowsBadRequest()
    {
        var content = new byte[101]; // exceeds the 100 bytes limit
        using var stream = new MemoryStream(content);

        var action = () => _storage.SaveAsync("test.txt", stream);

        await action.Should().ThrowAsync<AppException>()
            .Where(e => e.StatusCode == 400);
    }

    [Fact]
    public async Task SaveAsync_InvalidExtension_ThrowsBadRequest()
    {
        var content = "Hello world";
        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));

        var action = () => _storage.SaveAsync("test.exe", stream);

        await action.Should().ThrowAsync<AppException>()
            .Where(e => e.StatusCode == 400 && e.Message.Contains("type not allowed"));
    }

    [Fact]
    public async Task GetAsync_ExistingFile_ReturnsStreamAndContentType()
    {
        var content = "text content";
        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));
        var fileName = await _storage.SaveAsync("doc.pdf", stream);

        var (resultStream, contentType) = await _storage.GetAsync(fileName);

        contentType.Should().Be("application/pdf");
        using var reader = new StreamReader(resultStream);
        var text = await reader.ReadToEndAsync();
        text.Should().Be(content);
    }

    [Fact]
    public async Task GetAsync_NonExistentFile_ThrowsNotFound()
    {
        var action = () => _storage.GetAsync("non-existent-guid.pdf");

        await action.Should().ThrowAsync<AppException>()
            .Where(e => e.StatusCode == 404);
    }

    [Fact]
    public async Task DeleteAsync_ExistingFile_RemovesFromDisk()
    {
        var content = "delete me";
        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));
        var fileName = await _storage.SaveAsync("test.png", stream);
        var filePath = Path.Combine(_tempDirectory, fileName);
        File.Exists(filePath).Should().BeTrue();

        await _storage.DeleteAsync(fileName);

        File.Exists(filePath).Should().BeFalse();
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempDirectory))
        {
            Directory.Delete(_tempDirectory, true);
        }
    }
}
