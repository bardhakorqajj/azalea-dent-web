import { notFound } from "next/navigation";

/** Anything under a locale that is not a real page renders the styled 404. */
export default function CatchAllPage(): never {
  notFound();
}
