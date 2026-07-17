namespace FreelanceMarketplace.Api.Common;

/// <summary>Central registration of application services (keeps Program.cs lean).</summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMemoryCache();
        services.AddHttpContextAccessor();

        // Application services are registered here as they are added:
        // (auth, jobs, proposals, files, currency, admin)
        return services;
    }
}
