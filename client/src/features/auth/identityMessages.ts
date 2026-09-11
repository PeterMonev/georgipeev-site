import type { FieldErrors } from "../../api/client";
import type { Lang } from "../../api/types";

/**
 * The server answers with Identity's error codes, not sentences — it does not
 * know which language the person is reading. The sentences live here, next
 * to every other piece of UI text, in both languages.
 *
 * Partial, so an unknown code is undefined rather than a crash; the fallback
 * below covers it.
 */
const messages: Partial<Record<string, Record<Lang, string>>> = {
  PasswordMismatch: {
    bg: "Сегашната парола не е вярна.",
    en: "The current password is wrong.",
  },
  PasswordTooShort: {
    bg: "Паролата трябва да е поне 12 знака.",
    en: "The password must be at least 12 characters.",
  },
  PasswordRequiresNonAlphanumeric: {
    bg: "Паролата трябва да съдържа поне един знак, който не е буква или цифра.",
    en: "The password needs at least one character that is not a letter or a digit.",
  },
  PasswordRequiresDigit: {
    bg: "Паролата трябва да съдържа поне една цифра.",
    en: "The password needs at least one digit.",
  },
  PasswordRequiresLower: {
    bg: "Паролата трябва да съдържа поне една малка буква.",
    en: "The password needs at least one lowercase letter.",
  },
  PasswordRequiresUpper: {
    bg: "Паролата трябва да съдържа поне една главна буква.",
    en: "The password needs at least one uppercase letter.",
  },
};

const fallback: Record<Lang, string> = {
  bg: "Нещо не е наред с паролата.",
  en: "Something is wrong with the password.",
};

/** Turns a response full of codes into one full of sentences, field by field. */
export function translateIdentityErrors(errors: FieldErrors, lang: Lang): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors).map(([field, codes]) => [
      field,
      codes?.map((code) => (messages[code] ?? fallback)[lang]),
    ]),
  );
}
