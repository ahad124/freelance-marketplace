using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using FreelanceMarketplace.Api.Controllers;
using Xunit;

namespace FreelanceMarketplace.Tests.Integration;

public class FileEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public FileEndpointsTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Upload_AsAuthenticatedUser_SucceedsAndCanBeDownloaded()
    {
        var client = await TestAuth.AuthedClientAsync(_factory, "file.uploader@test.dev", "Freelancer");

        // Prepare multipart form content
        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(System.Text.Encoding.UTF8.GetBytes("integration test file contents"));
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("text/plain");
        content.Add(fileContent, "file", "sample_doc.txt");

        // Upload
        var response = await client.PostAsync("/api/files", content);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var uploadResponse = await response.Content.ReadFromJsonAsync<UploadResponse>();
        uploadResponse.Should().NotBeNull();
        uploadResponse!.FileId.Should().NotBeNullOrEmpty();
        uploadResponse.Url.Should().Be($"/api/files/{uploadResponse.FileId}");

        // Download
        var downloadResponse = await client.GetAsync(uploadResponse.Url);
        downloadResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        downloadResponse.Content.Headers.ContentType?.ToString().Should().Be("text/plain");
        var downloadedText = await downloadResponse.Content.ReadAsStringAsync();
        downloadedText.Should().Be("integration test file contents");
    }

    [Fact]
    public async Task Upload_Anonymous_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(System.Text.Encoding.UTF8.GetBytes("unauthorized file"));
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("text/plain");
        content.Add(fileContent, "file", "secret.txt");

        var response = await client.PostAsync("/api/files", content);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_Anonymous_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/files/some-guid.txt");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Upload_InvalidExtension_ReturnsBadRequest()
    {
        var client = await TestAuth.AuthedClientAsync(_factory, "file.badext@test.dev", "Freelancer");

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(System.Text.Encoding.UTF8.GetBytes("unauthorized extension"));
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
        content.Add(fileContent, "file", "hack.exe");

        var response = await client.PostAsync("/api/files", content);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
