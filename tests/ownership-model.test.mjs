import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const bundle = readFileSync(new URL('../assets/index-ownership-v2.js', import.meta.url), 'utf8');
const start = bundle.indexOf('function artifactOwnerAccess(');
const end = bundle.indexOf('function OwnerTeamPicker(', start);
assert.ok(start !== -1 && end > start, 'The bundled ownership helpers must be available');
const context = vm.createContext({
  ownerTeams: ['Core', 'AppEng', 'Infra', 'Platform', 'Owners', 'Interns'],
  publishingMemberTeams: ['Core', 'AppEng'],
});
vm.runInContext(bundle.slice(start, end), context);
const { artifactOwnerAccess: access, permissionContactTeams: contacts, eligiblePublishingTeams: eligible, ownershipRemovalMessage: removalMessage } = context;
const manage = 'private-Modules-Publish and manage modules for this team';
const remove = 'private-Modules-Delete modules owned by this team';

test('owned capabilities require membership in the owner team', () => {
  const settings = { options: { [manage]: true, [remove]: true } };
  assert.equal(access(settings, undefined, true).manage, true);
  assert.equal(access(settings, undefined, true).remove, true);
  assert.equal(access(settings, undefined, false).manage, false);
  assert.equal(access(settings, undefined, false).remove, false);
});

test('manage-owned, delete-owned and ownership administration are independent', () => {
  assert.equal(access({ options: { [manage]: true } }).remove, false);
  assert.equal(access({ options: { [remove]: true } }).manage, false);
  assert.equal(access({ privateOwnership: true }).manage, false);
  assert.equal(access({ privateOwnership: true }).remove, false);
});

test('global access is preserved for non-owners and unowned artifacts', () => {
  assert.equal(access({ privateRegistry: true }, undefined, false).manage, true);
  assert.equal(access({ privateRegistry: true }, undefined, false).remove, true);
  assert.equal(access({ options: { 'private-Modules-Publish and manage modules for the organization': true } }, undefined, false).manage, true);
});

test('private capabilities do not apply to public artifacts or other types', () => {
  const settings = { options: { [manage]: true } };
  assert.equal(access(settings, { kind: 'module', registry: 'Public' }).manage, false);
  assert.equal(access(settings, { kind: 'provider', registry: 'Private' }).manage, false);
  assert.equal(access({ options: { 'private-Stack Component Configurations-Publish and manage stack component configurations for this team': true } }, { kind: 'stack', registry: 'Private' }).manage, true);
});

test('permission contacts exclude Manage Teams and deleted teams', () => {
  assert.deepEqual(Array.from(contacts({ Infra: { team: 'Manage teams' }, Platform: { team: 'Manage organization access' } })), ['Platform', 'Owners']);
  assert.deepEqual(Array.from(contacts({ Platform: { team: 'Manage organization access', deleted: true } })), ['Owners']);
});

test('unowned guidance names only active assignment administrators in the artifact registry', () => {
  const permissions = {
    Core: { privateRegistry: true },
    AppEng: { team: 'Manage organization access' },
    Infra: { privateOwnership: true },
    Platform: { privateOwnership: true, deleted: true },
    Owners: { privateOwnership: true, publicOwnership: true },
  };
  assert.equal(context.ownershipRequestMessage(permissions, { kind: 'module', registry: 'Private' }),
    'Want your team to own this module? Contact Infra and Owners to request assignment.');
  assert.equal(context.ownershipRequestMessage(permissions, { kind: 'provider', registry: 'Public' }),
    'Want your team to own this provider? Contact Owners to request assignment.');
  assert.equal(context.ownershipRequestMessage({}, { kind: 'module', registry: 'Private' }),
    'Want your team to own this module? Contact an organization administrator to request assignment.');
});

test('publishing eligibility requires both membership and management capability', () => {
  const settings = { Core: { options: { [manage]: true } }, Platform: { privateRegistry: true } };
  assert.deepEqual(Array.from(eligible(settings, 'mine')), ['Core']);
  assert.deepEqual(Array.from(eligible(settings, 'blocked')), []);
  settings.AppEng = { options: { [manage]: true } };
  assert.deepEqual(Array.from(eligible(settings, 'mine')), ['Core', 'AppEng']);
  settings.Core.deleted = true;
  assert.deepEqual(Array.from(eligible(settings, 'mine')), ['AppEng']);
  assert.equal(eligible(settings, 'any').includes('Core'), false);
});

test('owner removal names the assignment and teams retaining global management', () => {
  const artifact = { name: 'aws-rds-starter-module', owner: 'Core', kind: 'module', registry: 'Private' };
  const message = removalMessage([artifact], {
    Core: { options: { [manage]: true } },
    Infra: { team: 'Manage teams' },
    Platform: { privateRegistry: true },
    Owners: { privateRegistry: true },
  });
  assert.match(message, /^Core will no longer own aws-rds-starter-module, but Platform and Owners can still manage it\./);
  assert.match(message, /Team-scoped access no longer applies/);
  assert.ok(!message.includes('prototype'));
});

test('bulk removal counts only supplied owned artifacts and excludes deleted managers', () => {
  const artifacts = ['one', 'two'].map(name => ({ name, owner: 'Core', kind: 'module', registry: 'Private' }));
  const message = removalMessage(artifacts, {
    Platform: { privateRegistry: true, deleted: true },
    Owners: { privateRegistry: true },
  });
  assert.match(message, /^2 artifacts will become unowned,/);
  assert.match(message, /Owners can still manage them/);
  assert.ok(!message.includes('Platform'));
});

test('removal does not name a team without global management access', () => {
  const message = removalMessage([{ name: 'example', owner: 'Core' }], {
    Core: { options: { [manage]: true } },
  });
  assert.match(message, /organization owners and teams with applicable organization-wide permissions/);
  assert.ok(!message.includes('Core can still manage'));
});

test('activity uses one factual sentence for each event type', () => {
  const message = context.ownershipEventMessage;
  assert.equal(message({ action: 'Owner when prototype opened', to: 'Core' }), 'Core was the initial owner.');
  assert.equal(message({ action: 'Owner when prototype opened', to: 'Unowned' }), 'This module was initially unowned.');
  assert.equal(message({ from: 'Core', to: 'AppEng', actor: 'Platform' }), 'Platform changed the owner from Core to AppEng.');
  assert.equal(message({ from: 'Unowned', to: 'Core', actor: 'Platform' }), 'Platform assigned Core as the owner.');
  assert.equal(message({ from: 'Core', to: 'Unowned', actor: 'Platform' }), 'Platform removed Core as the owner.');
  assert.equal(message({ action: 'Owner team deleted', from: 'Core', to: 'Unowned', actor: 'Platform' }), 'Platform deleted Core, leaving this module unowned.');
  assert.equal(message({ action: 'Published unowned', to: 'Unowned', actor: 'Platform' }), 'Platform published this module without an owner.');
  assert.equal(message({ action: 'Owner set at publishing', to: 'Core', actor: 'Core' }), 'Core assigned Core as the owner when publishing this module.');
});

test('management bundles tagging but keeps deletion and owner delegation separate', () => {
  const owned = access({ options: { [manage]: true } });
  assert.equal(owned.tags, true);
  assert.equal(owned.projectTags, true);
  assert.equal(owned.remove, false);
  assert.equal(owned.assignOwnership, false);
  assert.equal(access({ privateRegistry: true }, undefined, false).assignOwnership, false);
  assert.equal(access({ privateOwnership: true }, undefined, false).assignOwnership, true);
  assert.equal(access({ publicOwnership: true }, { registry: 'Public', kind: 'module' }).assignOwnership, true);
  assert.equal(access({ publicOwnership: true }).assignOwnership, false);
  assert.equal(access({ publicRegistry: true }, { registry: 'Public', kind: 'module' }).assignOwnership, false);
});

test('permissions combine across memberships without treating every membership as ownership', () => {
  const settings = { Core: { options: { [manage]: true } }, AppEng: { privateRegistry: true } };
  const artifact = { owner: 'Core', registry: 'Private', kind: 'module' };
  assert.equal(context.viewerArtifactAccess(settings, ['Core'], artifact).remove, false);
  assert.equal(context.viewerArtifactAccess(settings, ['Core', 'AppEng'], artifact).remove, true);
  assert.equal(context.viewerArtifactAccess(settings, ['Core'], { ...artifact, owner: '' }).manage, false);
  assert.equal(context.viewerArtifactAccess(settings, ['Core'], { ...artifact, owner: 'Infra' }).manage, false);
  assert.equal(access({ deleted: true, privateRegistry: true, options: { [manage]: true } }).manage, false);
});

test('tagging-only permissions are scoped to artifact type and registry', () => {
  const settings = { options: { 'private-Modules-environment-tags': true, 'private-Modules-project-tags': true } };
  const module = { kind: 'module', registry: 'Private', owner: 'Infra' };
  assert.equal(access(settings, module, false).tags, true);
  assert.equal(access(settings, module, false).projectTags, true);
  assert.equal(access(settings, module, false).manage, false);
  assert.equal(access(settings, module, false).remove, false);
  for (const artifact of [{ ...module, kind: 'provider' }, { ...module, kind: 'stack' }, { ...module, registry: 'Public' }]) {
    assert.equal(access(settings, artifact, false).tags, false);
    assert.equal(access(settings, artifact, false).projectTags, false);
  }
  assert.equal(access({ deleted: true, ...settings }, module, false).tags, false);
  assert.equal(access({ options: { 'private-Modules-environment-tags': true } }, module, false).projectTags, false);
  assert.equal(access({ options: { 'private-Modules-project-tags': true } }, module, false).tags, false);
});

test('publishing permits no owner but still requires publishing access', () => {
  const settings = { Core: { options: { [manage]: true } } };
  assert.equal(context.canPublishWithOwner(settings, 'mine', ''), true);
  assert.equal(context.canPublishWithOwner(settings, 'mine', 'Core'), true);
  assert.equal(context.canPublishWithOwner(settings, 'mine', 'AppEng'), false);
  assert.equal(context.canPublishWithOwner({}, 'mine', ''), false);
  assert.equal(context.canPublishWithOwner(settings, 'blocked', ''), false);
  assert.equal(context.canPublishWithOwner(settings, 'any', ''), true);
  assert.equal(context.canPublishWithOwner(settings, 'any', 'Missing'), false);
});

test('relationship evidence ranks ahead of permissions and counts distinct consuming workspaces', () => {
  const settings = { Core: { options: { [manage]: true } }, Platform: { privateRegistry: true } };
  const artifacts = [{ id: 1, registry: 'Private', kind: 'module' }];
  const evidence = [
    { artifactId: 1, team: 'Core', workspace: 'one', version: '1' },
    { artifactId: 1, team: 'Core', workspace: 'one', version: '2' },
    { artifactId: 1, team: 'AppEng', workspace: 'one' },
    { artifactId: 1, team: 'AppEng', workspace: 'two' },
    { artifactId: 2, team: 'Platform', workspace: 'unrelated' },
  ];
  const ranked = context.rankOwnerTeams(['AppEng', 'Platform', 'Core'], settings, artifacts, evidence);
  assert.deepEqual(Array.from(ranked, item => item.team), ['AppEng', 'Core', 'Platform']);
  assert.equal(ranked[0].workspaces, 2);
  assert.equal(ranked[1].workspaces, 1);
  assert.equal(ranked[0].ready, false);
});

test('assignment requires a separate management grant to complete handoff', () => {
  const permissions = { AppEng: {} };
  const artifact = { id: 1, kind: 'module', registry: 'Private', owner: '' };
  assert.equal(context.viewerArtifactAccess(permissions, ['AppEng'], artifact).manage, false);
  const assigned = { ...artifact, owner: 'AppEng' };
  const assignedAccess = context.viewerArtifactAccess(permissions, ['AppEng'], assigned);
  assert.equal(assignedAccess.manage, false);
  assert.equal(assignedAccess.tags, false);
  assert.equal(assignedAccess.remove, false);
  assert.equal(assignedAccess.assignOwnership, false);
  assert.equal(context.viewerArtifactAccess(permissions, ['Core'], assigned).manage, false);
  assert.equal(context.viewerArtifactAccess(permissions, ['AppEng'], artifact).manage, false);
  assert.equal(context.viewerArtifactAccess({ AppEng: { deleted: true } }, ['AppEng'], assigned).manage, false);
  assert.deepEqual(permissions.AppEng, {});
  assert.equal(context.ownerNeedsPermissions(permissions, assigned), true);
  permissions.AppEng = { options: { [manage]: true } };
  assert.equal(context.ownerNeedsPermissions(permissions, assigned), false);
  assert.equal(context.viewerArtifactAccess(permissions, ['AppEng'], assigned).manage, true);
  assert.equal(context.ownerNeedsPermissions(permissions, artifact), false);
});

test('reassignment ends former owner access but preserves independent organization-wide access', () => {
  const artifact = { kind: 'module', registry: 'Private', owner: 'AppEng' };
  assert.equal(context.viewerArtifactAccess({ Core: {} }, ['Core'], artifact).manage, false);
  assert.equal(context.viewerArtifactAccess({ Core: { privateRegistry: true } }, ['Core'], artifact).manage, true);
  const deleteOnly = { AppEng: { options: { [remove]: true } } };
  assert.equal(context.viewerArtifactAccess(deleteOnly, ['AppEng'], artifact).remove, true);
  assert.equal(context.viewerArtifactAccess(deleteOnly, ['AppEng'], { ...artifact, owner: '' }).remove, false);
});

test('owning an existing artifact does not grant authorization to publish unrelated new artifacts', () => {
  assert.deepEqual(Array.from(eligible({ AppEng: {} }, 'mine')), []);
});

test('existing owner stays ahead of consumption candidates without gaining extra authority', () => {
  const artifact = { id: 1, kind: 'module', registry: 'Private', owner: 'Core' };
  const ranked = context.rankOwnerTeams(['AppEng', 'Core'], {}, [artifact], [
    { artifactId: 1, team: 'AppEng', workspace: 'app-one' },
    { artifactId: 1, team: 'AppEng', workspace: 'app-two' },
  ]);
  assert.deepEqual(Array.from(ranked, item => item.team), ['Core', 'AppEng']);
  const delegation = access({ privateOwnership: true }, artifact, false);
  assert.equal(delegation.assignOwnership, true);
  assert.equal(delegation.manage, false);
  assert.equal(delegation.remove, false);
});
