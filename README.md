# Registry Artifact Ownership Control

Interactive prototype for artifact-scoped ownership and access in the HCP Terraform Private Registry.

- **Live site:** https://sanchitasaxena.github.io/ownership-control/
- **Original Figma site:** https://box-id-63586789.figma.site/

## Current RFC UX direction

This static prototype explores a proposed Registry permission model informed by the ownership PRD and RBAC discussions; it is not a finalized policy. Ownership is artifact metadata identifying one responsible team; it does not itself grant access. Team membership plus resource-scoped grants determine what a user can do. The preview separates **Publish new**, **Manage owned**, **Browse and consume**, and **Delete owned** so these permissions can later compose into roles.

The RFC scope is private modules, private providers, and private stack component configurations. This mock demonstrates private modules only; provider and stack workflows are not implemented. Curated public artifacts and public namespaces are out of scope.

- **Library and filtering:** Artifacts show their owner or **Unowned** as labels; owner names are not links. Use the owner filter or **My teams** to filter the library. Unowned labels include a hint to contact **Platform**, the sole ownership-administration team in these examples; the prototype sends no request or notification. Search is also available. The fixture includes assigned examples; choose **Rollout - existing artifacts unowned** to demonstrate that ownership is not inferred or backfilled.
- **Artifact owner:** Artifact details display the owner or **Unowned** with the contact hint. Users with ownership-administration access can assign, reassign, or clear the owner from the **Manage** menu.
- **Assignment:** The **Manage private registry ownership** capability allows assignment, reassignment, and clearing without requiring Manage Teams or full Registry management. Choose from teams in the organization. If the selected team lacks Publish or Update permission, the picker offers a direct **Go to team settings to add permissions** action; assignment remains available and does not change team permissions.
- **Clearing and bulk changes:** Choosing **No owner** for owned artifacts shows an inline warning and requires a confirmation checkbox in the **Assign owner** dialog. Saving clears ownership without opening a second modal; bulk changes use the same flow. The warning names teams that retain management through global Registry access. Changes are local prototype state, not backend requests.
- **Artifact access:** Owner-team members with **Manage owned** can manage only their team’s artifacts; a Registry administrator can manage any artifact. **Delete owned** is separate from management. **Browse and consume** grants read access to artifact details and allows consuming configurations without management controls. Manage includes artifact settings and tag changes. No-code provisioning keeps its existing workspace authorization.
- **Publishing:** The **Publish new** grant allows a team to publish new artifacts. **Manage owned** allows the owner team to manage existing artifacts and versions. An owner label alone grants neither permission; an owner team needs the applicable grants. One eligible team may be preselected; with multiple eligible teams, the publisher chooses one; with none, the primary action becomes **Go to team settings to add permissions**. Registry administrators may publish with an owner or leave the artifact Unowned. Team-token scopes remain unchanged.
- **Team settings:** Under Registry administration, **Manage registry ownership** is separate from artifact permissions. Registry-wide **Assign reserved and registry environment tags to artifact versions** and **Assign project tags to registry artifacts** grants are also available. For each artifact type, compact checkbox-first options list **Publish new**, **Manage owned**, **Browse and consume** (including read access), and **Delete owned** as separate grants without category headers or row dividers, using the same label and helper layout as the tag grants. Publish is a registry-level grant; Manage and Delete are limited to artifacts owned by the team. Full Registry access allows the administrator to manage and delete any artifact. Removing a permission does not remove ownership; changing ownership does not implicitly grant artifact permissions.
- **Lifecycle:** Deleting an owner team clears its ownership relationships rather than transferring its artifacts. Existing audit requirements are described in the RFC; this in-memory mock does not implement audit delivery.

This is a design prototype, not a production authorization system. Permission and contact-team data are fixtures; no Registry APIs, network errors, token scopes, or durable changes are simulated.

## Preview controls and fixtures

In assignment and bulk-edit flows, the owner selector lists **No owner** first, followed by teams. When no team is assigned, the collapsed field shows **No owner**; mixed-owner bulk edits retain **Select a team** until an explicit choice is made. Global Registry managers can choose an owner or publish as **Unowned**; owner-scoped publishers must choose an eligible owner team. Clearing existing ownership shows a warning and requires the inline confirmation checkbox.

In the owner filter, **My teams** has its own separated row above individual team choices. It selects the current viewer's active memberships; the selected teams are applied with **Apply filters**. Owner names in the library are non-interactive labels.

Dropdown menus and ownership tooltips dismiss on outside click; menus also dismiss on Escape. Toasts dismiss on outside click while their own links remain usable.

The artifact owner is displayed on its details page. Users with ownership-administration access can manage ownership from the artifact’s **Manage** menu. If the selected owner team lacks Publish or Update, a direct team-settings action is available; the user can still save the assignment.

Use **Prototype workflows** at the bottom right to switch among the private library, module details, and (for the admin view) team-specific settings workflows such as **Team settings - Core**. Each settings workflow opens its named team directly, without a separate team selector. **Viewing as** has three perspectives with built-in memberships shown in their labels: Platform Registry administrator, Core + AppEng owner-team member, and Interns consumer. The consumer can view the private library, open artifact details, and filter by owner without management actions. Switch to Registry administrator to edit permissions. Assignment is synchronous local memory; network loading, partial failures, and durable jobs are not simulated.

The startup view uses a lightweight loading placeholder while the application loads, without artificial delays. Each row shows a module icon beside its name; when Bulk select is activated, the icon becomes a checkbox in the same slot and returns to the icon when selection is cleared, so the layout does not shift. The bulk Actions menu offers Assign owner and Add tags; added tags are merged with existing project tags; filtering updates the existing table, which resizes to its rows and includes an empty state. Menus, dialogs, and notifications use short entrance transitions, and motion is disabled when reduced motion is requested. Buttons use the same local font as the interface rather than fetching an external font.

- **Core:** Can publish new modules, update its owned modules, and consume modules. It cannot delete artifacts or administer ownership.
- **AppEng:** Has the same module permissions as Core. Core + AppEng membership demonstrates selection between eligible publishing teams.
- **Infra:** Has no ownership-administration or artifact-management permission in the initial fixture.
- **Interns:** Has read-only consume access to the private module library; it cannot publish, update, delete, or administer ownership.
- **Platform:** Is the sole team with ownership-administration permission in these examples and has organization-access administration.
- **Owners:** Retains global Registry access and organization-access administration; the fixture does not grant it ownership-administration permission.

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
