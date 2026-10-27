# Registry Artifact Ownership Control

Interactive prototype for Terraform Registry Artifact Ownership Control.

- **Live Site**: [https://sanchitasaxena.github.io/ownership-control/](https://sanchitasaxena.github.io/ownership-control/)
- **Original Figma Site**: [https://box-id-63586789.figma.site/](https://box-id-63586789.figma.site/)

## Overview

This repository hosts the interactive mockup and assets for the Registry Artifact Ownership Control workflow in Terraform Registry.

## Ownership flows

- Use the floating **Prototype workflows** control at the bottom right to open the private library, current module details/owner assignment, module publishing, or team settings. It stays visually hidden until hovered or keyboard-focused (and remains visible while open), so it stays out of screenshots and recordings during normal workflow use; touch devices keep it visible. It closes after choosing a workflow, clicking outside, or pressing Escape. Team settings includes a team selector; switching workflows preserves saved in-memory changes.
- On the module details workflow, expand the floating control to switch the preview between an owner team and a non-owner team, independently of whether that viewer can assign ownership. Owner mode labels the owner as **Your team**. When assignment is unavailable, the module **Manage owner** and ownership-history **Edit** actions are hidden. These are artifact-page presentation scenarios and do not change saved team permissions.
- Bulk selection keeps the library's data-column widths, with a dedicated centered checkbox column so headers and row content remain aligned.
- Assign an owner from a registry artifact's **Manage owner** action, or use bulk selection and **Actions > Assign Owner**.
- Registry ownership assignment is independent of both team management and full private/public registry access. Turning off full registry access does not clear ownership-assignment permission.
- Private and public registry team settings use the same hierarchy: registry management, **Manage ownership**, nested artifact permissions, and tagging permissions. Enabling Manage registry shows every artifact type's permissions as checked and included (not individually editable). Disabling it restores prior individual selections. Full access, individual selections, and ownership management persist separately across navigation.
- Registry settings keep a compact permission matrix: scope rows (**Owned by this team**, **Entire organization**) and action columns (**Publish & manage**, **Delete**) without repeated action descriptions. Ownership management stays integrated with the registry controls rather than in a separate section.
- The matrix retains visible action and scope descriptions for each artifact type, accessible descriptions on individual permission checkboxes, and helper text for tagging permissions in both registries; ownership remains with the registry controls rather than in a separate section.
- Selecting a team owner never changes team permissions, during publishing or later assignment.
- Use **Publish > Add a module** to select an optional team owner before publishing. The published module and its owner appear in the library. With no team selected, the organization owners group remains the default. This iteration focuses on the module experience; provider publishing and provider details are not included.
- Team names in the private library have no adjacent settings icon. Team settings remains directly accessible through the prototype workflow selector.
- The owner assignment modal keeps the override warning above the searchable owner selector. Single-artifact and bulk assignment use the same selector; management access is checked across all selected registry/artifact-type scopes without granting permissions.
- **Remove owner** applies immediately without a separate Save. For a single artifact, it closes the modal and opens the artifact details with **Owner: None**; bulk removal stays in the library.
- Publishing shows only a publish-success confirmation. Later assignment confirms that team permissions are unchanged.
- Two publishing scenarios are available in **Prototype workflows**: **any team** (ownership assigner) and **my teams only** (publisher belonging to Core and AppEng). Neither scenario grants permission to edit team settings. Switching scenarios resets the publishing form so an unauthorized team cannot carry over.
- The searchable owner selector checks management access for private modules, including inherited full-registry and organization-wide permissions. Teams remain selectable without permission labels in the option list. After selecting a team that lacks management access, an alert names an authorized contact; fully permitted teams do not show a warning.
- Team selection follows the [HDS SuperSelect](https://helios.hashicorp.design/components/form/super-select) single-select pattern, with search, a floating option list, and keyboard navigation (arrows, Enter, Escape). The selected team is included in the selector's accessible name. The bundled React prototype reproduces the pattern rather than importing the Ember-only HDS component. Selecting AppEng demonstrates a warning to contact Platform to grant management permissions; the alert is shown only after selection and hidden while the list is open.
- Demo permissions start with Core able to manage owned modules, AppEng without management access, and Platform holding full private-registry access and organization-access administration. Contacts are derived from saved team settings; if no authorized team is available, guidance falls back to an organization owner. These are prototype fixtures, not API-derived authorization.
- Hover over, keyboard-focus, or tap the owner in a module header to open the ownership activity timeline. Event rows show team transitions, actor, and local timestamps, newest first; existing artifacts show their starting owner without inventing historical events. The card stays open while being read. Escape, the close button, or clicking outside dismisses it. **Edit** in the popover closes the timeline and opens the same owner-assignment modal as **Manage > Manage owner**.
- The activity popover puts **Edit** in its header and uses simple separated event rows with plain team names and compact actor/timestamp metadata, without avatars, badges, or a footer.
- The version-level **Actions** menu remains available to owner teams even when they cannot assign ownership. It contains the settings-gear **Manage environment tags** action and **Delete version [selected version]**; these are separate from artifact-level copy/source and owner-management actions. Selecting a version updates the delete label to match. The owner pill appears inside its chevron control; the activity timeline records the acting team and timestamp, with Edit and Remove owner actions gated by assignment ability.
- If an assigned team lacks management access for the artifact, a follow-up alert names teams that can help. A Team settings CTA appears only when the current viewer team can manage team settings.
- The owner selector menu is positioned above the modal scroll clipping area, and selected-team permission guidance uses the same amber warning treatment as the modal's override notice.
- Module details provide working Readme, Inputs, Outputs, Dependencies, Submodules, and Examples views. The version download count and provider are identified with icons, the GitHub source opens in a new tab, and **Copy configuration** reports whether the copy succeeded.

Prototype changes are kept in memory while navigating and reset when the page is reloaded. This is a static, bundled prototype; there is no backend or build step. To preview locally, serve this directory with an HTTP server (for example, `python3 -m http.server 4187`) and open `http://localhost:4187`.

The permissions-discussion redesign is being applied in stages. Publishing scenarios demonstrate the requested any-team versus member-team selection rules; production initial-publishing authorization still requires confirmation. Publishing and post-publish assignment share the permission-aware team selector.
