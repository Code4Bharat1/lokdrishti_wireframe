<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Navigation lives in src/lib/nav.ts and each sub-module is defined as data in src/lib/modules.ts (kinds: table, analytics, kanban, settings, ai, builder, map, permissions) rendered by the catch-all src/routes/$.tsx via src/components/module-views.tsx; give a module its own route file only when it outgrows a generic kind. Why: 60+ screens share one consistent, maintainable implementation.
- Demo data lives in src/data/demo.ts and must stay labelled as illustrative. Why: the platform is not connected to real data yet.
- Voter Intelligence uses a dedicated content route and dashboard component with aggregate-only illustrative survey data in src/data/demo.ts. Why: its linked geography, survey-wave and coverage views exceed the generic analytics module.
- Role portals (signed in from /login), role→screen visibility and the English/Hindi label dictionaries live in src/lib/preview.tsx; Campaign Management, Questionnaire Builder and Mobile App Preview are dedicated routes (src/components/campaign-management.tsx, questionnaire-builder.tsx, mobile-app.tsx) using UP demo data from src/data/demo.ts; new screens use the L(en, hi) helper for inline Hindi. Why: roles and language are preview-only, with no auth or backend.
- Lokdrishti dashboards (Command Centre at /, Candidate Dashboard, Issue Analytics, Geographical Dashboard, Volunteer Performance) all read the per-campaign `models` in src/data/demo.ts, where campaign totals are split exactly into volunteers, areas and days (checked in src/test/analytics-model.test.ts). Maps share src/components/district-map.tsx; src/data/up-districts.json is DataMeet Census 2011 boundaries (CC BY 4.0), keep the on-map attribution. Why: numbers must agree across every dashboard, and the boundary licence requires credit.
- src/test/all-routes.test.ts loads every sidebar path and every internal link target found in src/ through the real router and fails on any not-found; run it after adding pages or links. The catch-all (src/routes/$.tsx) sends bare section URLs to their first page and ignores a trailing slash; never redirect to strip the slash, it loops. Why: the client reported 404s, and dedicated route files must exist for every nav item that has no module entry.
