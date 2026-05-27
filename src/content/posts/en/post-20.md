---
title: "Next.js + PayloadCMS for Content Management"
pubDate: 2026-05-27
updatedDate: 2026-05-27
author: "Dax"
tags: ["Next.js", "PayloadCMS"]
description: ""
---

[PayloadCMS](https://payloadcms.com/) is a highly recommended Headless CMS in the Next.js community. I have recently completed its integration for managing the Demo Gallery site, enabling both internationalized (i18n) content management and robust support for image uploading and processing.

![](/images/posts/20/1.webp)
![](/images/posts/20/2.webp)
![](/images/posts/20/3.webp)

Below is a summary of key takeaways and architectural considerations from the integration process.

# 1. Why PayloadCMS?

PayloadCMS is built natively for Next.js. It acts more like a powerful core plugin that seamlessly handles the end-to-end CMS workflow of **authoring** and **consumption**:

* **Efficient Authoring**: Its code-first approach automatically generates a modern admin panel, complete with data management, authentication, media uploads, and live previews.
* **Optimized Consumption**: It provides a Local API that allows direct database access on the server side (React Server Components), bypassing network API overhead for excellent performance and flexibility.
* **Full Control**: It is completely open-source and free. All data is securely stored in your own database, meaning zero vendor lock-in.


# 2. Installation & Configuration

Follow the [PayloadCMS Installation Docs](https://payloadcms.com/docs/getting-started/installation) for the initial setup, then configure your routing and the core config file. There are a few crucial points to note during this process:

## 2.1 Route Isolation

Since PayloadCMS's `RootLayout` includes its own `<html>` tags, and its authentication and admin interaction logic are completely independent from your business code, its routes **must** be physically separated from your application routes using route groups. 

The recommended directory structure is:

```shell
app/
├─ (payload)/
├── # Auto-generated admin routes and files by Payload
├─ (my-app)/
├── # Your core business application routes and files
```

## 2.2 payload.config.ts Core Configuration

This is my current Payload core config file. It covers **custom multi-size image cropping**, **on-demand Next.js cache revalidation (ISR)**, **multi-language support (i18n)**, and **direct cloud storage integration**. Please pay close attention to the comments for architectural insights.

```ts
// @ts-nocheck -- needed because payload generate:types uses a tsx version that can't parse import type
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { revalidatePath } from "next/cache";
import { buildConfig } from "payload";

// Pre-emptive env check: prevents silent failures in stateless serverless deployments (e.g. Vercel)
if (!process.env.PAYLOAD_SECRET) throw new Error("PAYLOAD_SECRET is missing");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");

// ==========================================
// 1. Media
// ==========================================
const Media = {
  slug: "media",
  upload: {
    // Auto-generates physical variants at different sizes for responsive images on the frontend
    imageSizes: [
      { name: "thumbnail", width: 300, height: 200, position: "centre" },
      { name: "card", width: 1200, height: 514, position: "centre" },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true, // Required for SEO and a11y
    },
  ],
};

// ==========================================
// 2. Sites
// ==========================================
const Sites = {
  slug: "sites",
  orderable: true, // Enable drag-and-drop sorting in the admin panel
  admin: {
    useAsTitle: "title",
  },
  hooks: {
    // On-demand ISR revalidation: automatically clears the Next.js cache for the route when data changes
    afterChange: [async () => revalidatePath("/")],
    afterDelete: [async () => revalidatePath("/")],
  },
  fields: [
    {
      name: "preview",
      type: "upload",
      relationTo: "media", // Strong relation to the Media collection
    },
    { name: "webUrl", type: "text", required: true },
    { name: "sourceUrl", type: "text", required: true },
    { name: "isDeveloping", type: "checkbox", defaultValue: false },
    { name: "keywords", type: "text" },
    {
      name: "title",
      type: "text",
      required: true,
      localized: true, // Enable field-level i18n
    },
    {
      name: "description",
      type: "textarea",
      required: true,
      localized: true,
    },
  ],
};

// ==========================================
// 3. Tiers
// ==========================================
const Tiers = {
  slug: "tiers",
  orderable: true,
  admin: {
    useAsTitle: "type",
  },
  hooks: {
    afterChange: [async () => revalidatePath("/landing")],
    afterDelete: [async () => revalidatePath("/landing")],
  },
  fields: [
    { name: "variantId", type: "text", required: true },
    { name: "priceMonthly", type: "number", required: true, min: 0 },
    { name: "priceAnnually", type: "number", required: true, min: 0 },
    {
      name: "type",
      type: "select",
      required: true,
      unique: true, // Ensures each tier (e.g., free) is globally unique
      options: ["free", "pro", "max"],
    },
  ],
};

export default buildConfig({
  secret: String(process.env.PAYLOAD_SECRET),
  collections: [Media, Sites, Tiers],
  globals: [], // Singleton data (e.g., site-wide config, global navigation) can be registered here

  localization: {
    locales: ["en", "zh"],
    defaultLocale: "en",
    fallback: true, // Falls back automatically when a localized value is missing, preventing frontend undefined errors
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    // Namespace isolation: keeps CMS-generated tables within the "payload" schema to avoid polluting core business tables
    schemaName: "payload",

    // Schema sync strategy
    // Local dev: enabled (true) — auto-sync table structure when TS config changes, improving DX
    // Production: disabled (false) — enforces strict safety via `payload migrate` flow to prevent accidental column drops and data loss
    push: process.env.NODE_ENV === 'development',
  }),

  // ==========================================
  // Edge storage & cloud integration (Cloudflare R2)
  // ==========================================
  plugins: [
    s3Storage({
      enabled: true,
      collections: {
        media: {
          prefix: "medias",
          // Direct-link strategy: bypasses proxy and exposes the R2 custom domain directly
          // filename is already handled by the underlying layer with original or variant suffixes (e.g., xxx-thumbnail.jpg), just concatenate
          generateFileURL: ({ filename, prefix }) => {
            const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://assets.daolanx.com";
            const dir = prefix ? `/${prefix}` : "";
            return `${baseUrl}${dir}/${filename}`;
          },
        },
      },
      bucket: process.env.UPLOAD_R2_BUCKET || "uploads",
      config: {
        region: "auto",
        endpoint: process.env.UPLOAD_R2_ENDPOINT,
        credentials: {
          accessKeyId: String(process.env.UPLOAD_R2_ACCESS_KEY_ID),
          secretAccessKey: String(process.env.UPLOAD_R2_SECRET_ACCESS_KEY),
        },
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
      },
      acl: "public-read",
      // Required for serverless: forces streaming upload, prevents files from being temporarily stored on the ephemeral server disk
      disableLocalStorage: true,
    }),
  ],
});

```
# 3. Other Notes
## 3.1 importMap.js Maintenance
`importMap.js` is a component mapping table generated by Payload. Its core purpose is to allow Next.js to correctly compile and bundle custom admin UI components.
⚠️ **Note**: Never edit this file manually. If you encounter errors in the admin panel regarding missing modules, simply run the following command in your terminal to regenerate it:
```sh
pnpm payload generate:importmap

```
## 3.2 Page-Level revalidate Fallback
In pages that consume CMS data, you can optionally add a time-based cache configuration to implement ISR. For example, caching for one hour:

```ts
export const revalidate = 3600;
```
**Takeaway**: This may seem redundant alongside revalidatePath in the admin hooks, but it is actually critical in production. It acts as a robustness fallback, effectively preventing situations where a webhook trigger fails or data is modified directly in the database, which would otherwise cause the frontend page cache to become permanently stale.

# 4. Related PR
For the complete integration and file restructuring process, please refer to this PR:
[https://github.com/daolanx/work/pull/4](https://github.com/daolanx/work/pull/4)