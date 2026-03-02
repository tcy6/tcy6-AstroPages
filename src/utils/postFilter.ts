import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config";
import { parseShanghaiWallTime } from "@/utils/parseShanghaiWallTime";

const postFilter = ({ data }: CollectionEntry<"blog">) => {
  const publishMs = parseShanghaiWallTime(
    data.pubDatetime,
    SITE.timezone
  ).valueOf();
  const isPublishTimePassed =
    Date.now() > publishMs - SITE.scheduledPostMargin;
  return !data.draft && (import.meta.env.DEV || isPublishTimePassed);
};

export default postFilter;
