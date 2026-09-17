import type { FieldErrors } from "./client";
import type { Lang } from "./types";

/**
 * The server answers with codes, not sentences — it does not know which
 * language the person is reading. Every code the server can send, from
 * Identity and from our own validators, is listed here with its sentences.
 *
 * Partial, so an unknown code is undefined rather than a crash; the fallback
 * below covers it.
 */
const messages: Partial<Record<string, Record<Lang, string>>> = {
  // Identity — passwords
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

  // Our validators — any form
  Required: {
    bg: "Полето е задължително.",
    en: "This field is required.",
  },
  TooLong: {
    bg: "Текстът е твърде дълъг.",
    en: "The text is too long.",
  },
  InvalidSlug: {
    bg: "Само малки латински букви, цифри и тирета: 2026-10-12-burgas.",
    en: "Lowercase Latin letters, digits and hyphens only: 2026-10-12-burgas.",
  },
  InvalidUrl: {
    bg: "Това не е валиден адрес. Трябва да започва с http:// или https://.",
    en: "Not a valid address. It must start with http:// or https://.",
  },
  Taken: {
    bg: "Вече има концерт с този адрес.",
    en: "A concert with this address already exists.",
  },
  BgRequired: {
    bg: "Българският текст е задължителен.",
    en: "The Bulgarian text is required.",
  },
  BgTooLong: {
    bg: "Българският текст е твърде дълъг.",
    en: "The Bulgarian text is too long.",
  },
  EnTooLong: {
    bg: "Английският текст е твърде дълъг.",
    en: "The English text is too long.",
  },

  // Photos
  NotAnImage: {
    bg: "Файлът не е снимка.",
    en: "The file is not a picture.",
  },
  TooLarge: {
    bg: "Снимката е твърде голяма — до 20 MB и до 50 мегапиксела.",
    en: "The picture is too large — up to 20 MB and 50 megapixels.",
  },
  OutOfRange: {
    bg: "Стойността е извън допустимото.",
    en: "The value is out of range.",
  },
};

const fallback: Record<Lang, string> = {
  bg: "Невалидна стойност.",
  en: "Invalid value.",
};

/** Turns a response full of codes into one full of sentences, field by field. */
export function translateErrors(errors: FieldErrors, lang: Lang): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors).map(([field, codes]) => [
      field,
      codes?.map((code) => (messages[code] ?? fallback)[lang]),
    ]),
  );
}
