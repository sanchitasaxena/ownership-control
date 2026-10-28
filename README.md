# Registry Artifact Ownership Control

Interactive prototype for artifact-scoped ownership and access in the HCP Terraform Private Registry.

- **Live site:** https://sanchitasaxena.github.io/ownership-control/
- **Original Figma site:** https://box-id-63586789.figma.site/

## RFC-aligned workflows

The RFC covers private modules, private providers, and private stack component configurations. Public namespaces and curated public artifacts are out of scope. This mock demonstrates the end-to-end workflows on **private modules**; provider and stack permissions appear in team settings, but their artifact and publishing pages are not implemented.

- **Library and filtering:** See the owner or **Unowned**, filter by a team or unowned artifacts, and search module names. Displayed team-name links open the library filtered to that team's artifacts, including names in ownership activity, guidance, confirmations, and settings. Team selection controls still select a team, and explicit team-settings actions still open settings. The default fixture includes previously assigned example artifacts. Choose **Rollout - existing artifacts unowned** to demonstrate the RFC's rollout state without inferring or backfilling owners.
- **Assignment:** A dedicated **Manage ownership** capability permits single and bulk assignment, reassignment, and clearing. It does not grant management, deletion, or team administration. Selecting a team does not change its permissions. The modal grows to contain the expanded SuperSelect, with scrolling available when constrained by the viewport.
- **Clearing:** Selecting Unowned and saving, or using Remove owner in the owner dialog (including for a bulk selection) opens a confirmation before any state changes. The confirmation names the current owner and module (or the affected artifact count), explains the unowned state, and names active teams retaining organization-wide management access. Cancel preserves ownership. Versions inherit their parent artifact's owner.
- **Missing capability guidance:** Selecting a team without the applicable manage-owned capability shows non-blocking guidance. After assignment, a follow-up links to that team's settings so the viewer can update its permissions.
- **Artifact actions:** Team membership, ownership, and configured capabilities determine action visibility. Owned management and deletion are separate; global Registry access continues to work for non-owners and unowned artifacts. Removing a capability does not clear ownership. Ownership administration is independently gated throughout the library, details, and history.
- **Manage menu:** Publish settings, Test settings, No-code settings, Manage tags, Manage owner, Design configuration, Module versions, Give feedback, and Delete module, with icons and group separators. Every action is available in the prototype. Manage owner opens the same owner dialog as Edit in the owner activity card. Project tag editing, ownership changes, version navigation, and deletion work in memory; the remaining settings show a demo notice.
- **Version actions:** The menu contains **Manage environment tags** and **Delete version [selected version]**, gated by their respective permissions rather than ownership-assignment ability. Tags follow existing tagging permissions, not manage-owned. Tag changes and confirmed version/module deletion update in-memory state. Copy configuration and source links remain outside this menu. All displayed version references follow the selected version.
- **Publishing:** **Publish - global Registry manager** simulates Platform's existing global authorization and allows an active owner team or Unowned. **Publish - eligible member teams** simulates membership in Core and AppEng and lists only teams with applicable management access. A single eligible team is preselected; multiple teams require selection; no eligible teams blocks publication. **Publish - no eligible team** simulates a publisher belonging only to Interns. The no-code checkbox is enabled only for the global-manager scenario; ownership alone does not grant no-code authorization.
- **Team settings:** Manage ownership is integrated below Manage private registry, independently of registry-wide access. The matrix separates owned-team and organization-wide scopes and management versus deletion. Full Registry access includes the matrix capabilities but not ownership administration. Disabling full access restores individual selections. For the demo, the viewer can edit any team's permissions and delete teams other than Owners and their own team; ownership administration is available unless the Ownership assignment toggle is set to Cannot assign ownership.
- **Team lifecycle:** An authorized team administrator can delete a different, non-Owners team from its settings, after confirmation. Its artifacts become unowned rather than transferring to another team; deleted teams disappear from selectors.
- **Activity:** A dotted timeline shows each owner change as a sentence with linked team names and a local timestamp. Starting fixtures are labeled as initial state, not fabricated historical assignments. A single Edit action beside the current owner opens the assignment modal and requires ownership administration; removal remains available in that modal. Hover over the owner or use the chevron to open activity; clicking the team name opens its artifact list. This activity card illustrates the UX, not a production audit-system integration.

## Preview controls and fixtures

Hover at the bottom right or keyboard-focus **Prototype workflows** to reveal the control. It hides when idle, remains visible while open, and stays visible on touch devices. Choose a workflow, a viewer team, or the owner/non-owner preview. **Cannot assign ownership** suppresses ownership administration without suppressing otherwise authorized artifact/version actions.

Viewer identity and the team being edited are separate. Selecting an owner-team preview changes the simulated viewer to that artifact's owner. Non-owner mode uses a different team. Saved team capabilities drive the owner warnings, but the viewer can always use every artifact action in the mock.

The startup view uses a lightweight loading placeholder while the application loads, without artificial delays. Each row shows a module icon beside its name; when Bulk select is activated, the icon becomes a checkbox in the same slot and returns to the icon when selection is cleared, so the layout does not shift. The bulk Actions menu offers Assign owner and Add tags; added tags are merged with existing project tags; filtering updates the existing table, which resizes to its rows and includes an empty state. Menus, dialogs, and notifications use short entrance transitions, and motion is disabled when reduced motion is requested. Buttons use the same local font as the interface rather than fetching an external font.

- **Core:** Can manage and delete its owned modules, administer ownership, and use existing environment-tag and project-tag permissions.
- **AppEng:** Initially lacks artifact capabilities; useful for the non-blocking assignment warning.
- **Infra:** Has Manage teams, but not organization-access administration or artifact capabilities.
- **Platform / Owners:** Have global private Registry access, ownership administration, and organization-access administration. Owners retains inherent access and its permissions are read-only.

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
