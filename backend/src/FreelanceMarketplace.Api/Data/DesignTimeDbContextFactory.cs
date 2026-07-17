using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FreelanceMarketplace.Api.Data;

/// <summary>
/// Used only by the EF Core CLI (migrations/scaffolding). Keeps design-time isolated
/// from the app's startup pipeline. The connection string is not contacted when
/// generating migrations.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? "Server=localhost,1433;Database=FreelanceMarketplace;User Id=sa;Password=Your_password123;TrustServerCertificate=True;Encrypt=False";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(connection)
            .Options;

        return new AppDbContext(options);
    }
}
