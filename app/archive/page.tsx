/**
 * /archive now redirects to /my-breakdowns. The "archive" concept is the
 * user's personal breakdown history, not a public catalog — the per-user
 * view lives at /my-breakdowns. Keeping /archive as a redirect preserves
 * any old bookmarks or links.
 */

import { redirect } from "next/navigation";

export default function ArchivePage(): never {
  redirect("/my-breakdowns");
}
