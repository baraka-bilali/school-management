import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
        disallow: [
          "/admin",
          "/admin/",
          "/student",
          "/student/",
          "/teacher",
          "/teacher/",
          "/staff",
          "/staff/",
          "/parent",
          "/parent/",
          "/super-admin",
          "/super-admin/",
          "/api",
          "/api/",
          "/register",
          "/test-api",
        ],
      },
    ],
    sitemap: "https://kelasi360.com/sitemap.xml",
    host: "https://kelasi360.com",
  }
}
