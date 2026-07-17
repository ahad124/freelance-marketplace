using FluentValidation;
using FluentValidation.AspNetCore;
using FreelanceMarketplace.Api.Services;

namespace FreelanceMarketplace.Api.Common;

/// <summary>Central registration of application services (keeps Program.cs lean).</summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMemoryCache();
        services.AddHttpContextAccessor();

        // FluentValidation (auto-validate request DTOs on model binding)
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<AuthService>();

        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJobService, JobService>();
        services.AddScoped<IProposalService, ProposalService>();
        services.AddScoped<IFileStorage, FileStorage>();

        return services;
    }
}
