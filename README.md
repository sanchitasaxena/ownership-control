# Registry Artifact Ownership Control

Interactive prototype for artifact-scoped ownership and access in the HCP Terraform Private Registry.

- **Live site:** https://sanchitasaxena.github.io/ownership-control/
- **Original Figma site:** https://box-id-63586789.figma.site/

## Current RFC UX direction

This static prototype illustrates the current WIP RFC for private Registry artifact ownership. Ownership identifies one responsible team and provides owner-scoped access only when team membership and the applicable capability allow the requested action. It does not replace existing organization-owner or global Registry access, and assigning an owner does not change team permissions.

The RFC scope is private modules, private providers, and private stack component configurations. This mock demonstrates private modules only; provider and stack workflows are not implemented. Curated public artifacts and public namespaces are out of scope.

- **Library and filtering:** Artifacts show their owner or **Unowned**. Unowned labels include a hint to contact **Platform**, the sole ownership-administration team in these examples; the prototype sends no request or notification. Filter by owner or Unowned; selecting an owner team opens the artifacts that team owns. Search and **My teams** are also available in this prototype. The fixture includes assigned examples; choose **Rollout - existing artifacts unowned** to demonstrate that ownership is not inferred or backfilled.
- **Artifact owner:** Artifact details display the owner or **Unowned** with the contact hint. Users with ownership-administration access can assign, reassign, or clear the owner from the **Manage** menu.
- **Assignment:** The **Manage private registry ownership** capability allows assignment, reassignment, and clearing without requiring Manage Teams or full Registry management. Choose from teams in the organization. If the selected team lacks the applicable manage-owned capability, the picker shows a non-blocking handoff message and names permission-contact teams; assignment remains available and does not change team permissions.
- **Clearing and bulk changes:** Choosing **No owner** for owned artifacts shows an inline warning and requires a confirmation checkbox in the **Assign owner** dialog. Saving clears ownership without opening a second modal; bulk changes use the same flow. The warning names teams that retain management through global Registry access. Changes are local prototype state, not backend requests.
- **Artifact access:** Owner-team members see actions allowed by their team’s manage-owned and delete-owned capabilities. Manage-owned access includes version-level environment-tag management; explicit tagging grants also allow tag assignment. Deletion is separate from management. Organization owners and teams with applicable global Registry permissions retain existing access, including access to unowned artifacts. No-code provisioning and module tests keep their existing authorization.
- **Publishing:** Owner-scoped publishers must select an eligible owner team they belong to. One eligible team may be preselected; with multiple eligible teams, the publisher chooses one; with none, publication is denied. Organization owners and applicable global Registry managers may publish with an owner or leave the artifact Unowned. Team-token scopes remain unchanged.
- **Team settings:** Each Registry section lists environment-tag and project-tag permissions under **Registry administration**, with no separate tagging subsection. **Artifact level** contains the artifact-type action matrix. Tag grants apply across artifact types within that Registry; full Registry access includes them. Manage-owned and delete-owned permissions remain separate and are set by artifact type and scope. Ownership administration does not grant artifact management, deletion, or general team administration. Removing a capability does not remove ownership. Team permission changes require the existing team-permission administration path.
- **Lifecycle:** Deleting an owner team clears its ownership relationships rather than transferring its artifacts. Existing audit requirements are described in the RFC; this in-memory mock does not implement audit delivery.

This is a design prototype, not a production authorization system. Permission and contact-team data are fixtures; no Registry APIs, network errors, token scopes, or durable changes are simulated.

## Preview controls and fixtures

In assignment and bulk-edit flows, the owner selector lists **No owner** first, followed by teams. When no team is assigned, the collapsed field shows **No owner**; mixed-owner bulk edits retain **Select a team** until an explicit choice is made. Global Registry managers can choose an owner or publish as **Unowned**; owner-scoped publishers must choose an eligible owner team. Clearing existing ownership shows a warning and requires the inline confirmation checkbox.

In the owner filter, **My teams** has its own separated row above individual team choices. It selects the current viewer's active memberships; the selected teams are applied with **Apply filters**. Clicking an owner name in the library opens the list filtered to that team.

Dropdown menus and ownership tooltips dismiss on outside click; menus also dismiss on Escape. Toasts dismiss on outside click while their own links remain usable.

The artifact owner is displayed on its details page. Users with ownership-administration access can manage ownership from the artifact’s **Manage** menu. Assignment warns when the selected team lacks manage-owned access and identifies permission contacts; the user can still save the assignment.

Use **Prototype workflows** at the bottom right to choose a workflow. **Viewing as** switches between Platform Registry administrator, Core + AppEng member, Infra without ownership-administration permission, and Interns consumer. In Team settings, **Team** picks the team to inspect; switching teams keeps the panel open for continued mouse or keyboard selection. Start as Platform to edit permissions. Assignment is synchronous local memory; network loading, partial failures, and durable jobs are not simulated.

The startup view uses a lightweight loading placeholder while the application loads, without artificial delays. Each row shows a module icon beside its name; when Bulk select is activated, the icon becomes a checkbox in the same slot and returns to the icon when selection is cleared, so the layout does not shift. The bulk Actions menu offers Assign owner and Add tags; added tags are merged with existing project tags; filtering updates the existing table, which resizes to its rows and includes an empty state. Menus, dialogs, and notifications use short entrance transitions, and motion is disabled when reduced motion is requested. Buttons use the same local font as the interface rather than fetching an external font.

- **Core:** Can manage its owned modules. Tagging, deletion, and ownership administration are separate grants.
- **AppEng:** Can manage its owned modules, but cannot administer ownership or delete. Core + AppEng membership demonstrates selection between eligible publishing teams.
- **Infra:** Has no ownership-administration or artifact-management permission in the initial fixture.
- **Interns:** No initial publishing or administrative grants; ownership alone does not grant management.
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
