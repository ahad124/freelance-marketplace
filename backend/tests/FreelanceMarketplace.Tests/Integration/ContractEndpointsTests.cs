using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using FreelanceMarketplace.Api.Dtos;
using FreelanceMarketplace.Api.Entities;
using Xunit;

namespace FreelanceMarketplace.Tests.Integration;

public class ContractEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ContractEndpointsTests(CustomWebApplicationFactory factory) => _factory = factory;

    private static CreateJobRequest NewJob(string title) =>
        new(title, "Detail description.", "Web Development", BudgetType.Fixed, 1000m, "USD");

    private static CreateProposalRequest NewProposal(Guid jobId) =>
        new(jobId, "Bid proposal cover letter.", 600m, DateTime.UtcNow.AddDays(10));

    [Fact]
    public async Task ProposalAcceptance_CreatesContract_AndExecutesEscrowWorkflow()
    {
        // 1. Setup Client, Freelancer, Job, and Proposal
        var client = await TestAuth.AuthedClientAsync(_factory, "contr.client@test.dev", "Client");
        var freelancer = await TestAuth.AuthedClientAsync(_factory, "contr.free@test.dev", "Freelancer");

        var postJobRes = await client.PostAsJsonAsync("/api/jobs", NewJob("Contract Flow Job"));
        postJobRes.EnsureSuccessStatusCode();
        var job = await postJobRes.Content.ReadFromJsonAsync<JobDto>();

        var postPropRes = await freelancer.PostAsJsonAsync("/api/proposals", NewProposal(job!.Id));
        postPropRes.EnsureSuccessStatusCode();
        var proposal = await postPropRes.Content.ReadFromJsonAsync<ProposalDto>();

        // 2. Accept Proposal (forming Contract)
        var acceptRes = await client.PostAsJsonAsync($"/api/proposals/{proposal!.Id}/accept", new { });
        acceptRes.EnsureSuccessStatusCode();

        // 3. Find contract in Client's contracts
        var listRes = await client.GetAsync("/api/contracts/mine");
        listRes.EnsureSuccessStatusCode();
        var contracts = await listRes.Content.ReadFromJsonAsync<List<ContractDto>>();
        contracts.Should().ContainSingle();

        var contractSummary = contracts![0];
        contractSummary.AgreedAmount.Should().Be(600m);
        contractSummary.Status.Should().Be(ContractStatus.Active);

        var contractId = contractSummary.Id;

        // 4. Test authorization: Non-party GET -> 403
        var thief = await TestAuth.AuthedClientAsync(_factory, "contr.thief@test.dev", "Client");
        var unauthorizedGetRes = await thief.GetAsync($"/api/contracts/{contractId}");
        unauthorizedGetRes.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // 5. Party GET -> 200 OK
        var contractGetRes = await client.GetAsync($"/api/contracts/{contractId}");
        contractGetRes.EnsureSuccessStatusCode();
        var contractDetails = await contractGetRes.Content.ReadFromJsonAsync<ContractDto>();
        contractDetails.Should().NotBeNull();
        contractDetails!.Milestones.Should().BeEmpty();

        // 6. Add Milestone (Client only)
        var milestoneReq = new CreateMilestoneRequest("CRM Phase 1", 200m, DateTime.UtcNow.AddDays(5));
        var addMilestoneRes = await client.PostAsJsonAsync($"/api/contracts/{contractId}/milestones", milestoneReq);
        addMilestoneRes.EnsureSuccessStatusCode();
        var milestoneDto = await addMilestoneRes.Content.ReadFromJsonAsync<MilestoneDto>();
        milestoneDto.Should().NotBeNull();
        milestoneDto!.Title.Should().Be("CRM Phase 1");
        milestoneDto.Status.Should().Be(MilestoneStatus.Unfunded);

        // 7. Fund Milestone
        var fundRes = await client.PostAsJsonAsync($"/api/milestones/{milestoneDto.Id}/fund", new { });
        fundRes.EnsureSuccessStatusCode();
        var fundedMilestone = await fundRes.Content.ReadFromJsonAsync<MilestoneDto>();
        fundedMilestone!.Status.Should().Be(MilestoneStatus.Escrowed);

        // 8. Submit Milestone (Freelancer only)
        var submitRes = await freelancer.PostAsJsonAsync($"/api/milestones/{milestoneDto.Id}/submit", new { });
        submitRes.EnsureSuccessStatusCode();
        var submittedMilestone = await submitRes.Content.ReadFromJsonAsync<MilestoneDto>();
        submittedMilestone!.Status.Should().Be(MilestoneStatus.Submitted);

        // 9. Release Milestone
        var releaseRes = await client.PostAsJsonAsync($"/api/milestones/{milestoneDto.Id}/release", new { });
        releaseRes.EnsureSuccessStatusCode();
        var releasedMilestone = await releaseRes.Content.ReadFromJsonAsync<MilestoneDto>();
        releasedMilestone!.Status.Should().Be(MilestoneStatus.Released);

        // 10. Check that contract is marked Completed (since all milestones are released)
        var finalContractRes = await client.GetAsync($"/api/contracts/{contractId}");
        finalContractRes.EnsureSuccessStatusCode();
        var finalContract = await finalContractRes.Content.ReadFromJsonAsync<ContractDto>();
        finalContract!.Status.Should().Be(ContractStatus.Completed);
        finalContract.CompletedAt.Should().NotBeNull();

        // 11. Verify Wallet integration
        var walletRes = await freelancer.GetAsync("/api/wallet");
        walletRes.EnsureSuccessStatusCode();
        var wallet = await walletRes.Content.ReadFromJsonAsync<WalletDto>();
        wallet!.Balance.Should().Be(200m); // Started at 0, credited 200m
        wallet.Ledger.Should().ContainSingle(l => l.Type == LedgerEntryType.Release);
    }
}
