// utils/pii.ts

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const URL_RE = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[\w\-./?%&=]*)?/gi;
const HANDLE_RE = /\B@[A-Za-z0-9_]{2,}/g;
const PHONE_RE = /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?)[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g;

export function redactPII(input: string) {
  let working = input ?? "";
  let counts: Record<string, number> = { email: 0, phone: 0, url: 0, handle: 0 };

  const apply = (label: string, regex: RegExp) => {
    const matches = [...working.matchAll(regex)].map((m) => m[0]);
    if (matches.length) {
      counts[label] = matches.length;
      working = working.replace(regex, "");
    }
  };

  apply("email", EMAIL_RE);
  apply("phone", PHONE_RE);
  apply("url", URL_RE);
  apply("handle", HANDLE_RE);

  return { clean: working.trim(), counts };
}
