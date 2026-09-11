using System.ComponentModel.DataAnnotations;

namespace GeorgiPeev.Web.Common;

/// <summary>
/// Validates one Localized value as a whole: the Bulgarian text may be
/// required, the English never is, and both must fit the column. To the
/// person filling in the form a Localized is one field, so it fails as one
/// field — with a code that says which half went wrong.
/// </summary>
[AttributeUsage(AttributeTargets.Property)]
internal sealed class LocalizedTextAttribute(int maxLength) : ValidationAttribute
{
    /// <summary>The site is Bulgarian first; English can be filled in later.</summary>
    public bool RequireBg { get; init; }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        // Null never reaches here: the JSON layer rejects it before validation.
        if (value is not Localized text)
        {
            return ValidationResult.Success;
        }

        if (RequireBg && string.IsNullOrWhiteSpace(text.Bg))
        {
            return new ValidationResult("BgRequired");
        }

        if (text.Bg.Length > maxLength)
        {
            return new ValidationResult("BgTooLong");
        }

        if (text.En.Length > maxLength)
        {
            return new ValidationResult("EnTooLong");
        }

        return ValidationResult.Success;
    }
}
