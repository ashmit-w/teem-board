import { hashtags } from "./util";

/** Tags come from #hashtags; the first http(s) link becomes the item's url. */
export function deriveDump(text: string) {
  const url = text.match(/https?:\/\/[^\s<>"]+/i)?.[0].replace(/[).,;:!?'"]+$/, "") ?? null;
  return { url, tags: hashtags(text).slice(0, 12) };
}

export const DUMP_COLORS = ["sun", "pink", "orange", "lilac", "paper"] as const;
