using Microsoft.AspNetCore.Http;

namespace FreelanceMarketplace.Api.Services;

/// <summary>
/// A domain error carrying the HTTP status the API should return.
/// Services throw these; <c>ExceptionHandlingMiddleware</c> renders them as ProblemDetails.
/// </summary>
public class AppException : Exception
{
    public int StatusCode { get; }

    public AppException(int statusCode, string message) : base(message)
    {
        StatusCode = statusCode;
    }

    public static AppException NotFound(string message) => new(StatusCodes.Status404NotFound, message);
    public static AppException Forbidden(string message) => new(StatusCodes.Status403Forbidden, message);
    public static AppException Conflict(string message) => new(StatusCodes.Status409Conflict, message);
    public static AppException BadRequest(string message) => new(StatusCodes.Status400BadRequest, message);
    public static AppException Validation(string message) => new(StatusCodes.Status422UnprocessableEntity, message);
}
