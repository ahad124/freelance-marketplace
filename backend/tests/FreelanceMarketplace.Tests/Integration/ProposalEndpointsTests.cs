using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Entities;
using Xunit;

namespace FreelanceMarketplace.Tests.Integration;

public class ProposalEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ProposalEndpointsTests(CustomWebApplicationFactory factory) => _factory = factory;

    private static CreateJobRequest NewJob(string title) =>
        new(title, "A detailed job description.", "Web Development", BudgetType.Fixed, 500m, "USD");

    private static CreateProposalRequest NewProposal(Guid jobId) =>
        new(jobId, "I can deliver this quickly and well.", 450m, DateTime.UtcNow.AddDays(10));

    private async Task<(HttpClient client, JobDto job)> CreateJobAsync(string clientEmail, string title)
    {
        var client = await TestAuth.AuthedClientAsync(_factory, clientEmail, "Client");
        var response = await client.PostAsJsonAsync("/api/jobs", NewJob(title));
        var job = await response.Content.ReadFromJsonAsync<JobDto>();
        return (client, job!);
    }

    [Fact]
    public async Task Create_AsFreelancer_OnOpenJob_ReturnsCreated()
    {
        var (_, job) = await CreateJobAsync("prop.client1@test.dev", "Job for proposals");
        var freelancer = await TestAuth.AuthedClientAsync(_factory, "prop.free1@test.dev", "Freelancer");

        var response = await freelancer.PostAsJsonAsync("/api/proposals", NewProposal(job.Id));

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var proposal = await response.Content.ReadFromJsonAsync<ProposalDto>();
        proposal!.Status.Should().Be(ProposalStatus.Submitted);
        proposal.JobId.Should().Be(job.Id);
    }

    [Fact]
    public async Task Create_Duplicate_ReturnsConflict()
    {
        var (_, job) = await CreateJobAsync("prop.client2@test.dev", "Job dup");
        var freelancer = await TestAuth.AuthedClientAsync(_factory, "prop.free2@test.dev", "Freelancer");
        await freelancer.PostAsJsonAsync("/api/proposals", NewProposal(job.Id));

        var second = await freelancer.PostAsJsonAsync("/api/proposals", NewProposal(job.Id));

        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Create_OnClosedJob_ReturnsBadRequest()
    {
        var (owner, job) = await CreateJobAsync("prop.client3@test.dev", "Job to close");
        var close = new UpdateJobRequest(job.Title, job.Description, job.Category,
            job.BudgetType, job.BudgetAmount, job.BudgetCurrency, JobStatus.Closed);
        await owner.PutAsJsonAsync($"/api/jobs/{job.Id}", close);

        var freelancer = await TestAuth.AuthedClientAsync(_factory, "prop.free3@test.dev", "Freelancer");
        var response = await freelancer.PostAsJsonAsync("/api/proposals", NewProposal(job.Id));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_AsClient_ReturnsForbidden()
    {
        var (_, job) = await CreateJobAsync("prop.client4@test.dev", "Job client-propose");
        var otherClient = await TestAuth.AuthedClientAsync(_factory, "prop.client4b@test.dev", "Client");

        var response = await otherClient.PostAsJsonAsync("/api/proposals", NewProposal(job.Id));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Create_PastDeliveryDate_ReturnsBadRequest()
    {
        var (_, job) = await CreateJobAsync("prop.client5@test.dev", "Job past-date");
        var freelancer = await TestAuth.AuthedClientAsync(_factory, "prop.free5@test.dev", "Freelancer");
        var past = new CreateProposalRequest(job.Id, "cover", 100m, DateTime.UtcNow.AddDays(-1));

        var response = await freelancer.PostAsJsonAsync("/api/proposals", past);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ForJob_ByOwner_ReturnsProposals()
    {
        var (owner, job) = await CreateJobAsync("prop.client6@test.dev", "Job proposals list");
        var freelancer = await TestAuth.AuthedClientAsync(_factory, "prop.free6@test.dev", "Freelancer");
        await freelancer.PostAsJsonAsync("/api/proposals", NewProposal(job.Id));

        var list = await owner.GetFromJsonAsync<List<ProposalDto>>($"/api/jobs/{job.Id}/proposals");

        list.Should().ContainSingle();
    }

    [Fact]
    public async Task ForJob_ByOtherClient_ReturnsForbidden()
    {
        var (_, job) = await CreateJobAsync("prop.client7@test.dev", "Job private proposals");
        var intruder = await TestAuth.AuthedClientAsync(_factory, "prop.client7b@test.dev", "Client");

        var response = await intruder.GetAsync($"/api/jobs/{job.Id}/proposals");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Withdraw_ThenEdit_ReturnsBadRequest()
    {
        var (_, job) = await CreateJobAsync("prop.client8@test.dev", "Job withdraw");
        var freelancer = await TestAuth.AuthedClientAsync(_factory, "prop.free8@test.dev", "Freelancer");
        var created = await freelancer.PostAsJsonAsync("/api/proposals", NewProposal(job.Id));
        var proposal = await created.Content.ReadFromJsonAsync<ProposalDto>();

        var withdraw = await freelancer.PostAsync($"/api/proposals/{proposal!.Id}/withdraw", null);
        withdraw.StatusCode.Should().Be(HttpStatusCode.OK);
        var withdrawn = await withdraw.Content.ReadFromJsonAsync<ProposalDto>();
        withdrawn!.Status.Should().Be(ProposalStatus.Withdrawn);

        var edit = new UpdateProposalRequest("new cover", 200m, DateTime.UtcNow.AddDays(5));
        var editResponse = await freelancer.PutAsJsonAsync($"/api/proposals/{proposal.Id}", edit);
        editResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Mine_ReturnsOwnProposals()
    {
        var (_, job) = await CreateJobAsync("prop.client9@test.dev", "Job mine");
        var freelancer = await TestAuth.AuthedClientAsync(_factory, "prop.free9@test.dev", "Freelancer");
        await freelancer.PostAsJsonAsync("/api/proposals", NewProposal(job.Id));

        var mine = await freelancer.GetFromJsonAsync<List<ProposalDto>>("/api/proposals/mine");

        mine.Should().ContainSingle(p => p.JobId == job.Id);
    }
}
