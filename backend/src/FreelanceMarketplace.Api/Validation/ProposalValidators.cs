using FluentValidation;
using FreelanceMarketplace.Api.Dtos;

namespace FreelanceMarketplace.Api.Validation;

public class CreateProposalRequestValidator : AbstractValidator<CreateProposalRequest>
{
    public CreateProposalRequestValidator()
    {
        RuleFor(x => x.JobId).NotEmpty();
        RuleFor(x => x.CoverLetter).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.BidAmount).GreaterThan(0);
        RuleFor(x => x.DeliveryDate)
            .GreaterThan(DateTime.UtcNow).WithMessage("Delivery date must be in the future.");
    }
}

public class UpdateProposalRequestValidator : AbstractValidator<UpdateProposalRequest>
{
    public UpdateProposalRequestValidator()
    {
        RuleFor(x => x.CoverLetter).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.BidAmount).GreaterThan(0);
        RuleFor(x => x.DeliveryDate)
            .GreaterThan(DateTime.UtcNow).WithMessage("Delivery date must be in the future.");
    }
}
