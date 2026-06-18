import { Fragment } from "react";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/** Render assistant text, turning bare URLs (e.g. Stripe payment links) into
 *  clickable links so the user can open the checkout straight from the chat. */
export function MessageText({ text }: { text: string }) {
  const parts = text.split(URL_REGEX);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all text-primary hover:opacity-80"
          >
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}
