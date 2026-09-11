/** Renders nothing when there is nothing to say, so the caller need not check. */
export function FieldError({ messages }: { messages: string[] | undefined }) {
  if (messages === undefined || messages.length === 0) return null;

  return <p role="alert">{messages.join(" ")}</p>;
}
