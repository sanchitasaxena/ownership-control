# Registry Artifact Ownership Control

Interactive prototype for Terraform Registry Artifact Ownership Control.

- **Live Site**: [https://sanchitasaxena.github.io/ownership-control/](https://sanchitasaxena.github.io/ownership-control/)
- **Original Figma Site**: [https://box-id-63586789.figma.site/](https://box-id-63586789.figma.site/)

## Overview

This repository hosts the interactive mockup and assets for the Registry Artifact Ownership Control workflow in Terraform Registry.

## Ownership flows

- Assign an owner from a registry artifact's **Manage owner** action, or use bulk selection and **Actions > Assign Owner**.
- Team management permissions are not required to enable registry ownership access. The private/public registry management prerequisite is unchanged.
- Selecting a team owner automatically grants that team permission to publish and manage artifacts it owns, without granting team management or organization-wide registry access.
- Use **Publish > Add a module** to select an optional team owner before publishing. The published module and its owner appear in the library. With no team selected, the organization owners group remains the default. This iteration focuses on the module experience; provider publishing and provider details are not included.
- The assignment confirmation links to the team's settings, where the granted permissions can be adjusted and saved. Team names in the private library have no adjacent settings icon.
- The owner assignment modal shows only the override warning above the owner selection, with no permissions alert below it.
- **Remove owner** applies immediately without a separate Save. For a single artifact, it closes the modal and opens the artifact details with **Owner: None**; bulk removal stays in the library.
- Publishing shows only a publish-success confirmation. The automatic-permissions confirmation is reserved for owner changes through artifact management or the private library.
- Hover over, keyboard-focus, or tap the owner in a module header to open the ownership activity timeline. Event rows show team transitions, actor, and local timestamps, newest first; existing artifacts show their starting owner without inventing historical events. The card stays open while being read. Escape, the close button, or clicking outside dismisses it. **Edit** in the popover closes the timeline and opens the same owner-assignment modal as **Manage > Manage owner**.

Prototype changes are kept in memory while navigating and reset when the page is reloaded. This is a static, bundled prototype; there is no backend or build step. To preview locally, serve this directory with an HTTP server (for example, `python3 -m http.server 4187`) and open `http://localhost:4187`.
