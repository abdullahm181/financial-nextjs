export const siteConfig = {
  name: "Financial App",
  description: "Personal financial management application",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    github: "https://github.com/abdullahm181/financial-nextjs",
  },
} as const;

export type SiteConfig = typeof siteConfig;
