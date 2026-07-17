namespace FreelanceMarketplace.Api.Common;

/// <summary>Application role names used for authorization.</summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string Client = "Client";
    public const string Freelancer = "Freelancer";

    public static readonly string[] All = { Admin, Client, Freelancer };

    /// <summary>Roles a visitor may self-assign at registration.</summary>
    public static readonly string[] SelfAssignable = { Client, Freelancer };
}
