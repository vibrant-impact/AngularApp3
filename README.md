# ⚡ GitHub Vault — Developer Resource & Snippet Manager (`AngularApp3`)

A standalone Angular 19 single-page application designed to discover, organize, and manage GitHub repositories, starter templates, and CLI snippets. Built with **Angular Signals**, **HttpClient**, **Angular In-Memory Web API**, and live integration with the **GitHub REST API**.

---

## 🎯 Assignment Architecture & Rubric Alignment

| Requirement | Implementation Details |
| :--- | :--- |
| **Simulated Backend** | Powered by `HttpClientInMemoryWebApiModule` (`InMemoryDataService`) serving `api/resources` with `passThruUnknownUrl: true` and automatic `localStorage` persistence so edits survive Safari/browser reloads. |
| **HTTP CRUD Service** | `ResourceService` implements full CRUD via Angular `HttpClient`: `loadResources()` (`GET`), `getResourceById()` (`GET /:id`), `addResource()` (`POST`), `updateResource()` (`PUT`), and `deleteResource()` (`DELETE`). |
| **Angular Signals State** | Uses writable `signal()` state (`resources`, `selectedResource`, filter queries), derived `computed()` selectors (`filteredResources`, `pinnedResources`, header counters), route signal inputs (`input.required<string>()`), and `effect()` hooks. |
| **Routed Views** | • `/resources` (`ResourceListComponent`): Pinned toolkit quick-launch bar, local vault filters, 1-click GitHub auto-fill modal, and Live GitHub Explorer.<br>• `/resources/:id` (`ResourceDetailComponent`): Parameterized detail view with copy-ready CLI commands, status selector, and editable implementation notes. |
| **Code Documentation** | Comprehensive JSDoc headers and inline comments across all models, services, routing configurations, and components. |

---

## ✨ Key Features

- **Dual-Mode Search (`My Saved Vault` vs. `Explore All of GitHub`):**
  - Filter saved resources instantly by keyword, category, or workflow status using reactive `computed()` signals.
  - Search public GitHub repositories by developer name (resolving user handles automatically via `/search/users`), topic, dominant programming language, minimum push date, and star count, then import results into the local vault with one click.
- **Pinned Toolkit Quick-Launch Bar:** Pin high-frequency repositories to the top of `/resources` for 1-click CLI command copying (`git clone`, `npm create`, `ng add`).
- **1-Click GitHub Metadata Auto-Fill:** Paste any `owner/repo` slug or GitHub URL in the add modal to auto-populate stars, description, primary language, topics, and clone commands.
- **Persistent Safari Web App Support:** Configured with `vercel.json` SPA rewrites and Apple Web App meta tags so the deployed app can be pinned in Safari or added to the macOS Dock.

---

## 🛠️ Tech Stack

- **Framework:** Angular 19 (Standalone Components, Control Flow `@if` / `@for`, `withComponentInputBinding`)
- **State Management:** Angular Signals (`signal`, `computed`, `effect`, `input`)
- **Data Access:** Angular `HttpClient`, `angular-in-memory-web-api`, GitHub Public REST API
- **Deployment:** Vercel (`vercel.json` HTML5 history rewrites)

---

## 🚀 Local Setup & Deployment

1. **Install dependencies:**
  ```bash
  npm install --legacy-peer-deps
  ```
2. **Start the development server:**
  ```bash
  ng serve
  ```
3. **Build for production:**
  ```bash
  ng build
  ```

---


