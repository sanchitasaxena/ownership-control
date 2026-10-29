# Registry Artifact Ownership Control

Interactive prototype for artifact-scoped ownership and access in the HCP Terraform Private Registry.

- **Live site:** https://sanchitasaxena.github.io/ownership-control/
- **Original Figma site:** https://box-id-63586789.figma.site/

## Responsibility-first UX recommendation

**Latest exploration:** ownership now records responsibility without automatically granting management. Teams missing the applicable Publish & manage grant show subtle grey Permissions needed text in the picker and owner display, without warning icons or a library banner. Authorized administrators can open Team settings from the owner display; other users can see permission contacts on hover. Saving ownership names the team and module count in a dismissible toast with handoff guidance. This supersedes automatic-management descriptions below and differs from the PRD's atomic assignment-and-access requirement; the RFC has not been changed.

This iteration explores one responsible owning team, with ownership and management grants kept separate, deletion explicit, and ownership administration independently delegated. It is a design prototype, not an approved RFC or production authorization system. The live site is not updated by local edits.

The RFC covers private modules, providers, and stack component configurations, plus public namespace modules and providers. This mock demonstrates the end-to-end workflows on **private modules**. Team settings include Private registry and Public registry sections; provider, stack, and public artifact pages are not implemented.

- **Library and filtering:** See the owner or **Unowned**, filter by several teams or unowned artifacts, use **My teams**, and search module names. Displayed team names no longer link to filtered lists. The default fixture includes previously assigned example artifacts. Choose **Rollout - existing artifacts unowned** to demonstrate rollout without inferring or backfilling owners.
- **Assignment:** **Manage private registry ownership** permits single and bulk assignment, reassignment, and clearing without requiring full Registry management. Individual assignment shows a module icon and name; bulk assignment says "Choose one owner team for N selected modules." No deletion-permission note appears in the dialog. Saving updates ownership without changing team-wide permissions; a missing management grant is flagged for follow-up. Mixed-owner bulk selections require an explicit choice before saving.
- **Clearing:** Selecting Unowned and saving opens confirmation before any state changes. The confirmation names the current owner and module (or affected count), explains the end of ownership-derived access, and names teams retaining organization-wide management. Cancel preserves ownership; reassignment/removal preserves independently granted access. Versions inherit their parent artifact's owner.
- **Team selection:** The selector starts collapsed with the selected team (or Select a team). Click, Enter, Space, or Arrow Down opens its searchable alphabetical single-selection list. Hover highlights a row; a checkmark identifies the selected team. Arrow keys move focus without selecting; Enter or Space confirms. Choosing a team closes the list; Save owner commits the change. Escape closes the list before closing the modal. The assignment dialog includes a current-owner label, with no deletion note, suggestions, or consumption evidence. This React prototype approximates the HDS Super Select pattern, not the Ember component itself. **Prototype workflows → Explore team suggestions (separate mock)** opens an isolated, non-saving exploration using sample data, not Explorer. Only that mock ranks current owners, sample relationships, and existing access. Consumption is not proof of maintenance responsibility; a team without existing management access is still a valid owner.
- **Artifact actions:** Team memberships, ownership, and configured capabilities combine to determine action visibility. Owned management includes tagging; deletion remains separate. Global Registry access continues to work for non-owners and unowned artifacts. Removing a publishing grant does not remove management derived from ownership. Ownership administration is independently granted.
- **Manage menu:** Publish settings, Test settings, No-code settings, Manage tags, Manage owner, Design configuration, Module versions, Give feedback, and Delete module are permission-gated, with icons and group separators. Manage owner opens the assignment dialog. Project tag editing, ownership changes, version navigation, and deletion work in memory; the remaining settings show a demo notice.
- **Version actions:** Manage environment tags is included in artifact management or additional tag-only grants. Delete artifact/version requires the applicable deletion permission. Changes update in-memory state. Copy configuration and source links remain available to consumers.
- **Publishing:** An eligible owner team is required; publishing cannot create an Unowned artifact. When the publisher has one eligible team, it is selected automatically; with multiple eligible teams, the publisher must choose one. Users without an eligible publishing team cannot publish. The global-Registry-manager-only case is not specified in the PRD; this mock requires those users to select an active team. Owning an existing artifact alone does not grant publishing access to unrelated new artifacts. Workspace provisioning authorization remains separate.
- **Team settings:** Private/public ownership administration has its own checkbox independent of full Registry management. Scope controls distinguish team-owned and organization-wide management/deletion. Owned management is inherent in ownership; the team-scoped Publish & manage grant additionally enables new publishing. Assignment actions remain in the registry, not team settings. Permission editing currently requires Manage organization access; the PRD's delegation-plus-Manage-Teams granular editing path is not yet demonstrated. Public settings are contextual, not a working public artifact implementation.
- **Team lifecycle:** An authorized team administrator can delete a different, non-Owners team from its settings, after confirmation. Its artifacts become unowned rather than transferring to another team; deleted teams disappear from selectors.
- **Owner display:** The current owner is visible without an activity popover, filtered-list link, or inline edit button. Authorized users change ownership through Manage → Manage owner. Beside Unowned in the library and module details, a help button shows hover/focus/tap guidance: "Want your team to own this module? Contact [teams] to request assignment." Contacts reflect active ownership administrators for that artifact's registry, not general management grants. Removing the activity presentation does not propose removing production audit records.

Team Registry settings use two plain groups: Registry administration (full access and independently delegated ownership administration) and Artifact level (type tabs and scope matrix). "Grant either or both" introduces the independent administration controls; each checkbox describes only its own grant. Each artifact-type table has equal-width, left-aligned Publish & manage and Delete columns. The sentence under Artifact level explains publishing, settings, and environment/project tags without expanding the column header. Ownership includes management and tagging; the team-owned checkbox adds new publishing, with no helper text under that checkbox. There are no separate tagging controls, assignment shortcuts, or ownership-summary callouts in team settings. Authorization helpers retain support for independently configured tagging-only grants; this simplified settings mock does not expose those grants.

## Preview controls and fixtures

In assignment and bulk-edit flows, the owner selector lists **No owner** first, followed by teams. When no team is assigned, the collapsed field shows **No owner**; mixed-owner bulk edits retain **Select a team** until an explicit choice is made. Publishing requires an eligible owner and does not offer **No owner**. Clearing existing ownership still requires confirmation.

In the owner filter, **My teams** has its own separated row above individual team choices.

Dropdown menus and ownership tooltips dismiss on outside click; menus also dismiss on Escape. Toasts dismiss on outside click while their own links remain usable.

Saving ownership shows the owner team and module count with any missing-management handoff guidance in the dismissible toast. The Private Library and artifact details show only subtle grey Permissions needed text beneath the owner, with no persistent handoff banner. The text links authorized administrators to team settings or provides permission contacts on hover for other users.

Ownership-request guidance appears beside the owner label for consumers (no management, tagging, deletion, or ownership-administration access to that artifact), whether owned or Unowned. The help icon opens a tooltip naming assignment administrators. It is not a page banner. Missing-management handoff guidance remains in the save toast. Contact guidance is informational, not an automated request workflow.

Use **Prototype workflows** at the bottom right to choose a workflow. **Viewing as** switches between Platform Registry administrator, Core + AppEng member, Infra ownership administrator only, and Interns consumer. In Team settings, **Team** picks the team to inspect; switching teams keeps the panel open for continued mouse or keyboard selection. Start as Platform to edit permissions. Assignment is synchronous local memory; network loading, partial failures, and durable jobs are not simulated.

The startup view uses a lightweight loading placeholder while the application loads, without artificial delays. Each row shows a module icon beside its name; when Bulk select is activated, the icon becomes a checkbox in the same slot and returns to the icon when selection is cleared, so the layout does not shift. The bulk Actions menu offers Assign owner and Add tags; added tags are merged with existing project tags; filtering updates the existing table, which resizes to its rows and includes an empty state. Menus, dialogs, and notifications use short entrance transitions, and motion is disabled when reduced motion is requested. Buttons use the same local font as the interface rather than fetching an external font.

- **Core:** Can manage and tag its owned modules. Delete and ownership administration are not initially granted.
- **AppEng:** Can publish team-owned modules, but cannot administer ownership or delete. Core + AppEng membership demonstrates selection between eligible teams.
- **Infra:** Can assign owners without full Registry management, deletion, or team administration. Assign an artifact to Interns, then switch to Interns to see that ownership alone establishes management.
- **Interns:** No initial publishing or administrative grants; can manage an artifact if explicitly assigned ownership.
- **Platform / Owners:** Have global private Registry access and separate ownership administration, plus organization-access administration. Owners permissions are read-only.

## Running and validating

This is a static bundled React prototype with no backend or build step. Changes persist across navigation in memory and reset on reload. Serve the repository, for example:

```sh
python3 -m http.server 4187
```

Open http://localhost:4187. Validate the authorization helpers and JavaScript syntax with:

```sh
node --test tests/ownership-model.test.mjs
node --check --input-type=module < assets/index-ownership-v2.js
git diff --check
```

The mock does not implement production APIs, token scopes, entitlements, team visibility/organization-boundary enforcement, request limits, operational monitoring, or audit delivery. Publishing settings, no-code provisioning, and other non-ownership service integrations remain disconnected and are not represented as working backend operations.
