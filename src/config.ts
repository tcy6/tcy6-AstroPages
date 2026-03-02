export const SITE = {
  website: "https://tcy6-astropages.pages.dev", // replace this with your deployed domain
  author: "Chaoyue Tang",
  profile: "https://tcy6-astropages.pages.dev",
  desc: "A bilingual blog based on Astro Paper",
  title: "Chaoyue Tang 汤潮跃",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: true,
    text: "Edit page",
    url: "https://github.com/tcy6/tcy6-astropages/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Shanghai", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;

export const BLOG_PATH = "src/data/blog";
