import type { ChangeEvent } from "react";
import type { Localized } from "../api/types";
import f from "../styles/form.module.css";
import { FieldError } from "./FieldError";

/**
 * Two inputs that behave as one field. `keyof Localized` is the union
 * "bg" | "en" — computed from the type, so it cannot drift from it.
 */
export function LocalizedField({
  label,
  value,
  onChange,
  messages,
  maxLength,
  required = false,
  rows,
}: {
  label: string;
  value: Localized;
  onChange: (value: Localized) => void;
  messages: string[] | undefined;
  maxLength: number;
  required?: boolean;
  /** Given, the halves are textareas of this height; omitted, single-line inputs. */
  rows?: number;
}) {
  const input = (key: keyof Localized) => {
    const shared = {
      value: value[key],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange({ ...value, [key]: event.target.value }),
      maxLength,
      // Only the Bulgarian half is ever required — the server rule, mirrored.
      required: required && key === "bg",
    };

    return rows === undefined ? <input {...shared} /> : <textarea rows={rows} {...shared} />;
  };

  return (
    <fieldset className={f.pair}>
      <legend className={f.legend}>{label}</legend>
      <div className={f.halves}>
        <label className={f.field}>
          <span>БГ</span>
          {input("bg")}
        </label>
        <label className={f.field}>
          <span>EN</span>
          {input("en")}
        </label>
      </div>
      <FieldError messages={messages} />
    </fieldset>
  );
}
