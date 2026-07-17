using FluentValidation;
using FreelanceMarketplace.Api.Dtos;

namespace FreelanceMarketplace.Api.Validation;

public class CreateJobRequestValidator : AbstractValidator<CreateJobRequest>
{
    public CreateJobRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.Category).NotEmpty().MaximumLength(80);
        RuleFor(x => x.BudgetType).IsInEnum();
        RuleFor(x => x.BudgetAmount).GreaterThan(0);
        RuleFor(x => x.BudgetCurrency).NotEmpty().Length(3);
    }
}

public class UpdateJobRequestValidator : AbstractValidator<UpdateJobRequest>
{
    public UpdateJobRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.Category).NotEmpty().MaximumLength(80);
        RuleFor(x => x.BudgetType).IsInEnum();
        RuleFor(x => x.BudgetAmount).GreaterThan(0);
        RuleFor(x => x.BudgetCurrency).NotEmpty().Length(3);
        RuleFor(x => x.Status).IsInEnum();
    }
}
