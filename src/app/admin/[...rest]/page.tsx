import { notFound } from "next/navigation";

/**
 * Any address on the admin host that is not one of the dashboard's routes.
 *
 * It exists to keep such a request inside the admin branch of the route tree.
 * Without it `/admin/anything` falls through to the public site's `[locale]`
 * segment — `admin` reads as a language code — and the visitor gets the
 * website's 404 page, complete with its header and footer, on the clinic's
 * private hostname. Matching here instead means `admin/not-found.tsx` answers,
 * in the dashboard's own chrome.
 *
 * A defined route always wins over a catch-all at the same level, so this
 * shadows nothing.
 */
export default function AdminCatchAll(): never {
  notFound();
}
