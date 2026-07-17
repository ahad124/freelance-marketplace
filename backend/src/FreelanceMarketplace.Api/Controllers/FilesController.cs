using FreelanceMarketplace.Api.Common;
using FreelanceMarketplace.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FreelanceMarketplace.Api.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IFileStorage _storage;

    public FilesController(IFileStorage storage)
    {
        _storage = storage;
    }

    [HttpPost]
    [ProducesResponseType(typeof(UploadResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<UploadResponse>> Upload(IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
        {
            throw AppException.BadRequest("No file was uploaded.");
        }

        using var stream = file.OpenReadStream();
        var fileId = await _storage.SaveAsync(file.FileName, stream, ct);
        var url = $"/api/files/{fileId}";

        return Ok(new UploadResponse(fileId, url));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, CancellationToken ct)
    {
        var (stream, contentType) = await _storage.GetAsync(id, ct);
        return File(stream, contentType, id);
    }
}

public record UploadResponse(string FileId, string Url);
