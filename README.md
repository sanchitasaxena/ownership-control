# Registry Artifact Ownership Control

Interactive prototype for Terraform Registry Artifact Ownership Control.

- **Live Site**: [https://sanchitasaxena.github.io/ownership-control/](https://sanchitasaxena.github.io/ownership-control/)
- **Original Figma Site**: [https://box-id-63586789.figma.site/](https://box-id-63586789.figma.site/)

## Overview

This repository hosts the interactive mockup and assets for the Registry Artifact Ownership Control workflow in Terraform Registry.

## Ownership flows

- Use the persistent **Prototype workflows** selector to open the private library, current module details/owner assignment, module publishing, or team settings directly. Team settings includes a team selector; switching workflows preserves saved in-memory changes.
- Bulk selection keeps the library's data-column widths, with a dedicated centered checkbox column so headers and row content remain aligned.
- Assign an owner from a registry artifact's **Manage owner** action, or use bulk selection and **Actions > Assign Owner**.
- Registry ownership assignment is independent of both team management and full private/public registry access. Turning off full registry access does not clear ownership-assignment permission.
- Private and public registry team settings use the same hierarchy: independent ownership assignment followed by registry management with nested artifact and tagging permissions. Enabling Manage registry shows every artifact type's permissions as checked and included (not individually editable). Disabling it restores prior individual selections. Full access and individual selections persist separately across navigation.
- Artifact controls are grouped into **Owned by this team** and **Entire organization**, with separate Publish and manage / Delete controls. Scope groups stack on narrow screens; tagging is separated below the artifact tabs.
- Selecting a team owner never changes team permissions, during publishing or later assignment.
- Use **Publish > Add a module** to select an optional team owner before publishing. The published module and its owner appear in the library. With no team selected, the organization owners group remains the default. This iteration focuses on the module experience; provider publishing and provider details are not included.
- Team names in the private library have no adjacent settings icon. Team settings remains directly accessible through the prototype workflow selector.
- The owner assignment modal keeps the override warning above the searchable owner selector. Single-artifact and bulk assignment use the same selector; management access is checked across all selected registry/artifact-type scopes without granting permissions.
- **Remove owner** applies immediately without a separate Save. For a single artifact, it closes the modal and opens the artifact details with **Owner: None**; bulk removal stays in the library.
- Publishing shows only a publish-success confirmation. Later assignment confirms that team permissions are unchanged.
- Two publishing scenarios are available in **Prototype workflows**: **any team** (ownership assigner) and **my teams only** (publisher belonging to Core and AppEng). Neither scenario grants permission to edit team settings. Switching scenarios resets the publishing form so an unauthorized team cannot carry over.
- The searchable publishing selector checks management access for private modules, including inherited full-registry and organization-wide permissions. Teams missing management access remain selectable, with a one-sentence alert naming an authorized contact team after selection.
- Team selection follows the [HDS SuperSelect](https://helios.hashicorp.design/components/form/super-select) single-select pattern, with search, a floating option list, muted permission metadata, and keyboard navigation (arrows, Enter, Escape). The bundled React prototype reproduces the pattern rather than importing the Ember-only HDS component. Selecting AppEng demonstrates a warning to contact Platform to grant management permissions; fully permitted teams do not show a warning.
- Fully permitted team options have no status label. Teams missing management access show muted plain text: **Limited access** (some selected scopes) or **Needs permissions** (none). There are no status badges or permissions accordion. The contact alert is hidden while the list is open to keep selection focused.
- Demo permissions start with Core able to manage owned modules, AppEng without management access, and Platform holding full private-registry access and organization-access administration. Contacts are derived from saved team settings; if no authorized team is available, guidance falls back to an organization owner. These are prototype fixtures, not API-derived authorization.
- Hover over, keyboard-focus, or tap the owner in a module header to open the ownership activity timeline. Event rows show team transitions, actor, and local timestamps, newest first; existing artifacts show their starting owner without inventing historical events. The card stays open while being read. Escape, the close button, or clicking outside dismisses it. **Edit** in the popover closes the timeline and opens the same owner-assignment modal as **Manage > Manage owner**.
- The activity popover puts **Edit** in its header and uses simple separated event rows with plain team names and compact actor/timestamp metadata, without avatars, badges, or a footer.

Prototype changes are kept in memory while navigating and reset when the page is reloaded. This is a static, bundled prototype; there is no backend or build step. To preview locally, serve this directory with an HTTP server (for example, `python3 -m http.server 4187`) and open `http://localhost:4187`.

The permissions-discussion redesign is being applied in stages. Publishing scenarios demonstrate the requested any-team versus member-team selection rules; production initial-publishing authorization still requires confirmation. Publishing and post-publish assignment share the permission-aware team selector.
