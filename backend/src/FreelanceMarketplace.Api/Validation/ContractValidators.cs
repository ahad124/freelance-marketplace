using System;
using FluentValidation;
using FreelanceMarketplace.Api.Dtos;

namespace FreelanceMarketplace.Api.Validation;

public class CreateMilestoneRequestValidator : AbstractValidator<CreateMilestoneRequest>
{
    public CreateMilestoneRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.DueDate)
            .GreaterThan(DateTime.UtcNow).WithMessage("Due date must be in the future.");
    }
}
