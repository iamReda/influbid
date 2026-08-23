# Influbid ← InfluencerBid UI Migration Plan

## Objective

Migrate the approved InfluencerBid interfaces and design system into the existing Influbid monorepo currently opened in Cursor.

The migration must preserve the existing Influbid architecture and functionality while making the InfluencerBid design system the visual foundation of the final product.

### Source project

Read-only UI/design source:

```text
D:\DEVELOPPEMENT\influencerbid
```

### Destination project

The currently opened Influbid project in Cursor.

---

# 1. Non-negotiable rules

## 1.1 Approved InfluencerBid interfaces must remain visually identical

The interfaces already created inside:

```text
D:\DEVELOPPEMENT\influencerbid
```

are approved.

During the migration:

- Do not redesign them.
- Do not simplify them.
- Do not reinterpret them.
- Do not change spacing.
- Do not change typography.
- Do not change colors.
- Do not change border radii.
- Do not change component dimensions.
- Do not change responsive behavior.
- Do not change hierarchy.
- Do not remove UI elements.
- Do not replace components because another component looks "cleaner".
- Do not introduce visual improvements unless explicitly requested later.

The migrated interface inside Influbid must be as close as possible to a pixel-identical copy of the existing InfluencerBid interface.

> Business logic must adapt to the approved UI.  
> The approved UI must not be adapted to fit the business logic.

## 1.2 The source project is read-only

Treat:

```text
D:\DEVELOPPEMENT\influencerbid
```

as a reference/source project only.

Do not modify, refactor, rename, delete, or reformat files in the source project.

All migration work must happen inside the Influbid project.

If Cursor cannot index the external source folder, add:

```text
D:\DEVELOPPEMENT\influencerbid
```

to the Cursor workspace as an additional folder, but still treat it as read-only.

## 1.3 Influbid remains the technical foundation

Keep Influbid responsible for:

- monorepo architecture
- routing conventions
- authentication
- users
- sessions
- database
- API/backend conventions
- email
- storage
- payment provider
- Stripe integration
- account/settings logic
- middleware
- security
- existing infrastructure

Do not replace Influbid with the architecture from InfluencerBid.

## 1.4 InfluencerBid becomes the visual foundation

The InfluencerBid design system must become the final design language used by the whole Influbid application.

After migration:

```text
Influbid architecture
+
InfluencerBid design system
+
InfluencerBid approved product interfaces
=
Final application
```

Existing Influbid functionality must remain intact, but its native pages should later be visually migrated to the new design system.

Examples:

- Sign in
- Password flows
- Account settings
- User profile
- Billing/payment settings
- Any other native Influbid UI

Keep their logic; replace only their visual layer using the new design system.

---

# 2. Migration philosophy

Use a static-first migration.

Do not connect business logic while migrating the approved interfaces.

The migration must follow this order:

```text
Approved static UI
        ↓
Design system integration
        ↓
Static pages inside Influbid
        ↓
Visual verification
        ↓
Dynamic data
        ↓
Business logic
        ↓
Payments / ranking / analytics
```

This prevents UI migration problems from becoming mixed with backend/API problems.

---

# 3. Git safety

Before changing anything, create a dedicated branch:

```bash
git checkout -b integrate-influencerbid-ui
```

Do not work directly on `main`.

Use small commits after each successful phase.

Recommended commit sequence:

```text
chore: prepare influencerbid ui migration

feat: integrate influencerbid design tokens

feat: integrate influencerbid ui primitives

feat: integrate public influencerbid pages

feat: integrate authenticated influencerbid pages

feat: apply influencerbid design system to Influbid shell

refactor: remove obsolete duplicated ui components
```

Do not make one giant migration commit.

---

# 4. Initial discovery phase

Before copying files, inspect both projects.

## 4.1 Inspect Influbid

Confirm:

```text
apps/saas/app/
apps/saas/modules/
packages/ui/
```

Also inspect:

- root `package.json`
- workspace configuration
- `apps/saas/package.json`
- `packages/ui/package.json`
- `components.json`
- global CSS
- Tailwind configuration
- TypeScript path aliases
- icon libraries
- chart libraries
- theme provider
- font setup

Do not assume dependency versions.

## 4.2 Inspect InfluencerBid

Inspect:

```text
D:\DEVELOPPEMENT\influencerbid\app
D:\DEVELOPPEMENT\influencerbid\components
D:\DEVELOPPEMENT\influencerbid\constants
D:\DEVELOPPEMENT\influencerbid\hooks
D:\DEVELOPPEMENT\influencerbid\public
D:\DEVELOPPEMENT\influencerbid\store
D:\DEVELOPPEMENT\influencerbid\templates
```

Also inspect:

- `package.json`
- `components.json`
- global CSS
- Tailwind configuration
- fonts
- CSS variables
- theme setup
- assets
- external dependencies

---

# 5. Dependency strategy

Do not copy InfluencerBid's entire `package.json`.

Compare dependencies between both projects.

Install only dependencies that:

1. are required by the approved InfluencerBid UI,
2. are not already available in Influbid,
3. are compatible with the Influbid monorepo.

Pay particular attention to possible differences involving:

- React
- Next.js
- Tailwind
- shadcn
- Base UI
- Radix UI
- Lucide
- class-variance-authority
- clsx
- tailwind-merge
- chart libraries
- date libraries
- animation libraries

Never introduce two competing primitive systems unnecessarily.

If the same functionality exists in both projects but the APIs differ, preserve the approved InfluencerBid interface first and create an adapter where necessary rather than redesigning the interface.

---

# 6. Design system migration

The design system must be migrated before the application pages.

## 6.1 Source components

The current InfluencerBid source contains components such as:

```text
components/
├── BriefCategory
├── BriefSection
├── Button
├── Field
├── Footer
├── Header
├── Icon
├── Image
├── Layout
├── Login
├── Modal
├── MyDatePicker
├── Pricing
├── Select
├── Switch
├── Test
├── ThemeButton
└── UpButton
```

Do not blindly move every folder into the shared UI package.

## 6.2 Generic design-system components

Reusable primitives belong in Influbid's shared UI layer, generally under:

```text
packages/ui/
```

Examples:

```text
Button
Field
Icon
Image
Modal
MyDatePicker
Select
Switch
ThemeButton
UpButton
```

Also migrate any other true reusable primitives discovered during inspection.

## 6.3 Application-level components

Do not place business/application-specific components in the generic UI package.

Examples likely to stay in `apps/saas`:

```text
Header
Footer
Layout
Login
Pricing
BriefCategory
BriefSection
```

Their exact destination should be decided based on actual usage.

If a component is specific to InfluencerBid business logic, place it in the relevant `apps/saas/modules/...` module.

---

# 7. Preserve the approved component APIs initially

Do not refactor the approved UI just to match Influbid component APIs.

For the first migration pass:

- copy/adapt required components,
- preserve their props and behavior,
- adapt imports and aliases,
- make them compile inside Influbid.

Only after all approved pages are visually verified should duplicate components be consolidated.

---

# 8. Design tokens and global styles

Before migrating pages, migrate the visual foundation from InfluencerBid.

Inspect and reproduce:

- color variables
- foreground/background colors
- typography
- font families
- font weights
- radius values
- borders
- shadows
- spacing behavior
- responsive breakpoints
- animations
- transitions
- theme values
- CSS utilities used by approved pages

The goal is not to make Influbid "similar" to InfluencerBid.

The goal is for approved InfluencerBid pages to render the same way inside Influbid.

Do not overwrite Influbid globals blindly.

Merge carefully so technical functionality is preserved.

---

# 9. Static data rule

During the UI migration, keep the existing mock/static data from InfluencerBid where needed.

Example:

```tsx
<StatCard title="Profile views" value="12,613" />
```

Do not immediately replace it with API calls.

First make the page render exactly as approved.

Later:

```tsx
<StatCard title="Profile views" value={analytics.profileViews} />
```

The data source changes later; the UI does not.

---

# 10. Route classification

Use the following classification exactly.

## 10.1 Public / unauthenticated pages

These pages must remain accessible without a logged-in Influbid account.

```text
/                         → HomePage
/about                    → AboutPage
/contact                  → ContactPage
/complete-profile         → CompleteYourProfilePage
/rules                    → RulesPage
/categories               → CategoriesPage
/brief-linked             → BriefLinkedPage
/brief                    → BriefPage
/my-briefs                → MyBriefsPage
/quiz                     → QuizPage
/quiz-generating          → QuizGeneratingPage
/home-copy                → HomePageCopy
```

Place them under the appropriate Influbid unauthenticated route group, conceptually:

```text
apps/saas/app/(unauthenticated)/
```

Do not add authentication requirements to these pages.

## 10.2 Authenticated pages

These pages require a valid Influbid session:

```text
/dashboard                → DashboardPage
/rank-higher              → RankHigherPage
/payment-history          → PaymentHistoryPage
/profile                  → MyProfilePage
/profile/edit             → MyProfileEditPage
/manage-plan              → ManagePlanPage
/settings                 → SettingsPage
/increase-bid             → IncreaseBidSection
```

Place them under the appropriate Influbid authenticated route group, conceptually:

```text
apps/saas/app/(authenticated)/
```

Reuse Influbid's existing authentication guard/session conventions.

Do not build a second auth mechanism.

---

# 11. Module structure

Do not place all migrated code directly inside route files.

Keep route files thin and organize business interfaces in modules.

Recommended target structure:

```text
apps/saas/modules/
├── dashboard/
├── creators/
├── ranking/
├── payments/
├── onboarding/
└── shared/
```

Use existing Influbid modules where they already logically fit.

## Dashboard

Source:

```text
D:\DEVELOPPEMENT\influencerbid\templates\DashboardPage
```

Target conceptually:

```text
apps/saas/modules/dashboard/
```

Route:

```text
apps/saas/app/(authenticated)/dashboard/page.tsx
```

## Complete profile

Source:

```text
D:\DEVELOPPEMENT\influencerbid\templates\CompleteYourProfilePage
```

Use Influbid's existing onboarding module where appropriate:

```text
apps/saas/modules/onboarding/
```

Route:

```text
apps/saas/app/(unauthenticated)/complete-profile/page.tsx
```

This page is intentionally public because the creator does not yet have an account.

## Rank Higher

Source:

```text
D:\DEVELOPPEMENT\influencerbid\templates\RankHigherPage
```

Target:

```text
apps/saas/modules/ranking/
```

Route:

```text
apps/saas/app/(authenticated)/rank-higher/page.tsx
```

## Increase Bid

Source:

```text
D:\DEVELOPPEMENT\influencerbid\templates\IncreaseBidSection
```

Target:

```text
apps/saas/modules/ranking/
```

Route:

```text
apps/saas/app/(authenticated)/increase-bid/page.tsx
```

If later this becomes part of `RankHigherPage`, preserve the currently approved behavior until explicitly changed.

## Payment History

Source:

```text
D:\DEVELOPPEMENT\influencerbid\templates\PaymentHistoryPage
```

Prefer the existing Influbid payments module:

```text
apps/saas/modules/payments/
```

Route:

```text
apps/saas/app/(authenticated)/payment-history/page.tsx
```

## Creator profile

Source:

```text
D:\DEVELOPPEMENT\influencerbid\templates\MyProfilePage
```

For the authenticated account profile:

```text
apps/saas/modules/creators/
```

Route:

```text
apps/saas/app/(authenticated)/profile/page.tsx
```

Source:

```text
D:\DEVELOPPEMENT\influencerbid\templates\MyProfileEditPage
```

Route:

```text
apps/saas/app/(authenticated)/profile/edit/page.tsx
```

A separate public shareable creator profile can later reuse the same creator module without duplicating the design system.

---

# 12. Do not blindly copy `app/`

Do not copy:

```text
D:\DEVELOPPEMENT\influencerbid\app
```

directly over:

```text
apps/saas/app
```

Influbid owns routing and layouts.

Instead:

1. inspect each InfluencerBid page,
2. extract its approved interface,
3. create the correct Influbid route,
4. render the migrated module from that route,
5. preserve the visual output.

---

# 13. Hooks, constants and store

Do not copy these folders globally without inspection:

```text
D:\DEVELOPPEMENT\influencerbid\hooks
D:\DEVELOPPEMENT\influencerbid\constants
D:\DEVELOPPEMENT\influencerbid\store
```

Classify each item.

## Generic UI hook

Example:

```text
useMediaQuery
```

May belong in a shared UI/util location.

## Business hook

Examples:

```text
useBid
useLeaderboard
useCreatorProfile
```

Belongs in the corresponding SaaS module.

## Mock/static content

Keep close to the migrated page/module during phase 1.

## Old template-specific state

Do not migrate it unless the approved interface actually requires it.

Influbid should not inherit unnecessary architecture from the source project.

---

# 14. Assets

Inspect:

```text
D:\DEVELOPPEMENT\influencerbid\public
```

Copy only assets used by approved interfaces.

Preserve:

- exact filenames where practical,
- image proportions,
- icons,
- illustrations,
- fonts,
- visual assets.

Update paths only as required by Influbid.

Do not replace assets with alternatives.

---

# 15. Static migration order

Use this order.

## Phase A — Foundation

1. Create migration branch.
2. Inspect both dependency graphs.
3. Integrate fonts.
4. Integrate design tokens.
5. Integrate global visual styles.
6. Integrate required generic UI primitives.
7. Verify no existing Influbid functionality is broken.

## Phase B — One validation page

Migrate only:

```text
DashboardPage
```

first.

Requirements:

- static data allowed,
- exact visual fidelity,
- existing Influbid authenticated layout/session remains functional,
- no API/database work yet.

Run the project and compare against the original InfluencerBid page.

Only continue if the result is visually approved.

## Phase C — Authenticated pages

After Dashboard succeeds, migrate:

```text
RankHigherPage
IncreaseBidSection
PaymentHistoryPage
MyProfilePage
MyProfileEditPage
ManagePlanPage
SettingsPage
```

Keep them static first.

## Phase D — Public pages

Then migrate:

```text
HomePage
AboutPage
ContactPage
CompleteYourProfilePage
RulesPage
CategoriesPage
BriefLinkedPage
BriefPage
MyBriefsPage
QuizPage
QuizGeneratingPage
HomePageCopy
```

Do not add authentication to these pages.

---

# 16. Visual verification

For every migrated page:

1. run the original InfluencerBid project,
2. open the same page,
3. run Influbid,
4. open the migrated page,
5. compare both at the same viewport size.

Check:

- spacing
- text position
- fonts
- colors
- line heights
- borders
- radius
- shadows
- images
- icons
- responsive states
- hover states
- active states
- focus states

Do not accept "close enough".

The approved source is the visual reference.

---

# 17. Influbid native pages

After approved InfluencerBid pages are migrated, migrate Influbid-native screens to the new design system.

Examples:

```text
Sign in
Password reset
Account claim / magic-link flows
Create password
Account settings
Billing
User profile
Other existing Influbid settings
```

Rules:

- preserve Influbid functionality,
- preserve validation,
- preserve forms,
- preserve auth logic,
- preserve API behavior,
- preserve payment logic,
- replace only the presentation layer,
- use the InfluencerBid design system strictly.

Do not rebuild these workflows from scratch if Influbid already provides them.

---

# 18. Authentication business rule for this product

Do not enable generic free registration.

Product requirement:

> A creator account can only exist after a successful qualifying bid payment.

The intended flow is documented separately in:

```text
signin_flow.md
```

Core flow:

```text
Primary social + Category + Bid
        ↓
Complete profile + Email
        ↓
PendingCreator
        ↓
Stripe Checkout
        ↓
Stripe webhook confirms payment
        ↓
Create user + creator profile + bid + payment
        ↓
Publish profile + calculate rankings
        ↓
Send claim-account magic link
        ↓
Create password
        ↓
Dashboard
```

Do not implement this dynamic flow during the first static UI migration phase.

---

# 19. Dynamic integration phase

Only after the static migration is visually approved.

Replace mocks progressively.

Recommended order:

## 19.1 Authentication/session

Connect authenticated pages to the existing Influbid session/user.

## 19.2 Creator profile

Connect:

- public name
- profile photo
- description
- primary social profile
- additional social profiles
- category
- email/contact settings

## 19.3 Bids

Connect:

- initial bid
- current bid
- increase bid
- new total calculation

Important product rule:

```text
existing bid + added amount = new total bid
```

Increasing a bid does not restart from zero.

## 19.4 Ranking

Connect:

- General rank
- Category rank
- ranking recalculation

Each influencer has one category.

## 19.5 Analytics

Connect:

- Profile views
- Social clicks
- Clicks per social network
- CTR
- date filters

## 19.6 Payments

Connect the approved payment-related UI to Influbid's payment architecture/Stripe setup.

---

# 20. Do not create unnecessary duplicate systems

Avoid ending with:

```text
Influbid Button
InfluencerBid Button
New Button
Legacy Button
```

Temporary duplication is acceptable during migration.

Permanent duplication is not.

After all approved pages render correctly:

1. identify equivalent components,
2. migrate consumers carefully,
3. standardize on the InfluencerBid design system,
4. delete obsolete components only when no longer referenced.

Never consolidate at the cost of visual regressions.

---

# 21. Definition of done for Phase 1

The static migration is complete only when:

- Influbid still starts normally.
- Existing Influbid architecture is intact.
- Authentication still works.
- No approved InfluencerBid interface has been redesigned.
- Approved interfaces render inside Influbid with the same appearance.
- Public/private route classification is respected.
- The new design system is available from the shared UI layer.
- No unnecessary source-project architecture was copied.
- Source project `D:\DEVELOPPEMENT\influencerbid` remains untouched.
- Influbid native screens are ready to be migrated visually to the new design system.
- Business data can later replace mock data without changing layouts.

---

# 22. Cursor execution rule

When executing this plan, Cursor must work incrementally.

Do not attempt to migrate the entire project in one operation.

For every phase:

1. inspect,
2. explain the intended file changes,
3. make the smallest coherent migration,
4. run typecheck/lint/build where appropriate,
5. fix migration errors,
6. verify the page,
7. commit,
8. continue.

If there is uncertainty about a source component, dependency, route, or visual behavior:

> inspect the source implementation in  
> `D:\DEVELOPPEMENT\influencerbid`  
> instead of guessing or recreating it.

---

# 23. First task Cursor should execute

Start only with the following:

```text
1. Inspect the Influbid UI package and global styling.
2. Inspect InfluencerBid's package.json, components, global styles and design tokens.
3. Produce a dependency/component compatibility report.
4. Identify exactly which InfluencerBid files are required to render DashboardPage unchanged.
5. Propose the destination paths inside Influbid.
6. Do not modify files yet until this report is complete.
```

After validating that report, proceed with:

```text
Design system foundation
→ Dashboard static migration
→ visual verification
→ remaining pages
```

This is the required migration strategy.
