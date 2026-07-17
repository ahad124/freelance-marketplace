using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Entities;
using Xunit;

namespace FreelanceMarketplace.Tests.Integration;

public class JobEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public JobEndpointsTests(CustomWebApplicationFactory factory) => _factory = factory;

    private static CreateJobRequest NewJob(string title = "Test Job") =>
        new(title, "A detailed job description.", "Web Development", BudgetType.Fixed, 500m, "USD");

    [Fact]
    public async Task List_Anonymous_ReturnsSeededOpenJobs()
    {
        var client = _factory.CreateClient();

        var jobs = await client.GetFromJsonAsync<List<JobDto>>("/api/jobs");

        jobs.Should().NotBeNull();
        jobs!.Should().OnlyContain(j => j.Status == JobStatus.Open);
        jobs.Count.Should().BeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public async Task Create_AsClient_ReturnsCreated()
    {
        var client = await TestAuth.AuthedClientAsync(_factory, "job.client@test.dev", "Client");

        var response = await client.PostAsJsonAsync("/api/jobs", NewJob("Landing page build"));

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var job = await response.Content.ReadFromJsonAsync<JobDto>();
        job!.Title.Should().Be("Landing page build");
        job.Status.Should().Be(JobStatus.Open);
    }

    [Fact]
    public async Task Create_AsFreelancer_ReturnsForbidden()
    {
        var client = await TestAuth.AuthedClientAsync(_factory, "job.freelancer@test.dev", "Freelancer");

        var response = await client.PostAsJsonAsync("/api/jobs", NewJob());

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Create_Anonymous_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/jobs", NewJob());

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_InvalidBudget_ReturnsBadRequest()
    {
        var client = await TestAuth.AuthedClientAsync(_factory, "job.badbudget@test.dev", "Client");
        var invalid = NewJob() with { BudgetAmount = 0m };

        var response = await client.PostAsJsonAsync("/api/jobs", invalid);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Get_UnknownId_ReturnsNotFound()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/jobs/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Update_ByNonOwner_ReturnsForbidden()
    {
        var owner = await TestAuth.AuthedClientAsync(_factory, "job.owner@test.dev", "Client");
        var created = await owner.PostAsJsonAsync("/api/jobs", NewJob("Owned job"));
        var job = await created.Content.ReadFromJsonAsync<JobDto>();

        var other = await TestAuth.AuthedClientAsync(_factory, "job.intruder@test.dev", "Client");
        var update = new UpdateJobRequest("Hacked", "x".PadRight(20, 'y'), "Web", BudgetType.Fixed, 10m, "USD", JobStatus.Open);
        var response = await other.PutAsJsonAsync($"/api/jobs/{job!.Id}", update);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Update_ByOwner_Succeeds()
    {
        var owner = await TestAuth.AuthedClientAsync(_factory, "job.editor@test.dev", "Client");
        var created = await owner.PostAsJsonAsync("/api/jobs", NewJob("Editable job"));
        var job = await created.Content.ReadFromJsonAsync<JobDto>();

        var update = new UpdateJobRequest("Updated title", "A new longer description here.", "Design",
            BudgetType.Hourly, 75m, "EUR", JobStatus.InProgress);
        var response = await owner.PutAsJsonAsync($"/api/jobs/{job!.Id}", update);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await response.Content.ReadFromJsonAsync<JobDto>();
        updated!.Title.Should().Be("Updated title");
        updated.Status.Should().Be(JobStatus.InProgress);
        updated.BudgetCurrency.Should().Be("EUR");
    }

    [Fact]
    public async Task Delete_ByOwner_RemovesJob()
    {
        var owner = await TestAuth.AuthedClientAsync(_factory, "job.deleter@test.dev", "Client");
        var created = await owner.PostAsJsonAsync("/api/jobs", NewJob("Disposable job"));
        var job = await created.Content.ReadFromJsonAsync<JobDto>();

        var delete = await owner.DeleteAsync($"/api/jobs/{job!.Id}");
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var get = await owner.GetAsync($"/api/jobs/{job.Id}");
        get.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task List_SearchFilter_ReturnsMatchingOnly()
    {
        var client = await TestAuth.AuthedClientAsync(_factory, "job.search@test.dev", "Client");
        await client.PostAsJsonAsync("/api/jobs", NewJob("Quantum widget integration"));

        var results = await client.GetFromJsonAsync<List<JobDto>>("/api/jobs?search=Quantum");

        results.Should().NotBeNull();
        results!.Should().Contain(j => j.Title.Contains("Quantum"));
        results.Should().OnlyContain(j => j.Title.Contains("Quantum") || j.Description.Contains("Quantum"));
    }
}
