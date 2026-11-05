import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const bundle = readFileSync(new URL('../assets/index-ownership-v2.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../assets/ownership-history.css', import.meta.url), 'utf8');
const start = bundle.indexOf('function artifactOwnerAccess(');
const end = bundle.indexOf('function OwnerTeamPicker(', start);
assert.ok(start !== -1 && end > start, 'The bundled ownership helpers must be available');
const context = vm.createContext({
  ownerTeams: ['Core', 'AppEng', 'Infra', 'Platform', 'Owners', 'Interns'],
  publishingMemberTeams: ['Core', 'AppEng'],
});
vm.runInContext(bundle.slice(start, end), context);
const { artifactOwnerAccess: access, permissionContactTeams: contacts, contactTeamNames, eligiblePublishingTeams: eligible, ownershipRemovalMessage: removalMessage } = context;
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

test('Publish, Update-owned, Consume and Delete-owned permissions stay composable', () => {
  const publish = access({ options: { 'private-Modules-publish': true } });
  assert.equal(publish.publish, true);
  assert.equal(publish.manage, false);
  assert.equal(publish.remove, false);
  const artifact = { kind: 'module', registry: 'Private', owner: 'Core' };
  const management = access({ options: { 'private-Modules-update-owned': true } }, artifact, true);
  assert.equal(management.publish, false);
  assert.equal(management.manage, true);
  const readOnly = access({ options: { 'private-Modules-consume': true } });
  assert.equal(readOnly.consume, true);
  assert.equal(readOnly.manage, false);
  assert.equal(readOnly.publish, false);
  const deletion = access({ options: { 'private-Modules-delete-owned': true } }, artifact, true);
  assert.equal(deletion.remove, true);
  assert.equal(deletion.manage, false);
  assert.equal(deletion.publish, false);
  assert.equal(deletion.deleteVersion, true);
  const legacyDeletion = access({ options: { [remove]: true } });
  assert.equal(legacyDeletion.deleteVersion, true);
  assert.equal(legacyDeletion.remove, true);
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
  assert.equal(contactTeamNames(['Platform', 'Owners']), 'Platform and Owners');
  assert.equal(contactTeamNames([]), 'an authorized team administrator');
});

test('unowned guidance names only active assignment administrators in the artifact registry', () => {
  const permissions = {
    Core: { privateRegistry: true },
    AppEng: { team: 'Manage organization access' },
    Infra: {},
    Platform: { privateOwnership: true },
    Owners: { privateOwnership: true, deleted: true },
  };
  assert.equal(context.ownershipRequestMessage(permissions, { kind: 'module', registry: 'Private' }),
    'Want your team to own this module? Contact Platform to request assignment.');
  assert.equal(context.ownershipRequestMessage({ Platform: { publicOwnership: true } }, { kind: 'provider', registry: 'Public' }),
    'Want your team to own this provider? Contact Platform to request assignment.');
  assert.equal(context.ownershipRequestMessage({}, { kind: 'module', registry: 'Private' }),
    'Want your team to own this module? Contact an organization administrator to request assignment.');
});

test('publishing eligibility requires membership and Publish permission', () => {
  const settings = { Core: { options: { [manage]: true } }, Platform: { privateRegistry: true } };
  assert.deepEqual(Array.from(eligible(settings, 'mine')), ['Core']);
  assert.deepEqual(Array.from(eligible(settings, 'blocked')), []);
  settings.AppEng = { options: { [manage]: true } };
  assert.deepEqual(Array.from(eligible(settings, 'mine')), ['Core', 'AppEng']);
  settings.Core.deleted = true;
  assert.deepEqual(Array.from(eligible(settings, 'mine')), ['AppEng']);
  assert.equal(eligible(settings, 'any').includes('Core'), false);
});

test('owner removal warning is concise for one or multiple artifacts', () => {
  assert.equal(removalMessage([{ name: 'example', owner: 'Core' }]), 'This artifact will be unowned.');
  assert.equal(removalMessage([{ name: 'one' }, { name: 'two' }]), 'These 2 artifacts will be unowned.');
});

test('Manage includes artifact updates and tags but remains separate from Delete and ownership administration', () => {
  const owned = access({ options: { [manage]: true } }, { kind: 'module', registry: 'Private', owner: 'Core' });
  assert.equal(owned.tags, true);
  assert.equal(owned.projectTags, true);
  assert.equal(owned.remove, false);
  assert.equal(owned.assignOwnership, false);
  const globallyManaged = access({ privateRegistry: true });
  assert.equal(globallyManaged.tags, true);
  assert.equal(globallyManaged.projectTags, true);
  assert.equal(access({ privateRegistry: true }, undefined, false).assignOwnership, false);
  assert.equal(access({ privateOwnership: true }, undefined, false).assignOwnership, true);
  assert.equal(access({ publicOwnership: true }, { registry: 'Public', kind: 'module' }).assignOwnership, true);
  assert.equal(access({ publicOwnership: true }).assignOwnership, false);
  assert.equal(access({ publicRegistry: true }, { registry: 'Public', kind: 'module' }).assignOwnership, false);
});

test('owner-team Update is scoped to owned artifacts while Registry admin can manage all', () => {
  const ownerPermissions = { options: { 'private-Modules-update-owned': true } };
  const artifact = { kind: 'module', registry: 'Private', owner: 'Core' };
  assert.equal(access(ownerPermissions, artifact, true).manage, true);
  assert.equal(access(ownerPermissions, { ...artifact, owner: 'AppEng' }, false).manage, false);
  assert.equal(access({ privateRegistry: true }, { ...artifact, owner: 'AppEng' }, false).manage, true);
});

test('version environment-tag management is available to artifact managers', () => {
  const owned = access({ options: { [manage]: true } }, { kind: 'module', registry: 'Private', owner: 'Core' }, true);
  assert.equal(owned.manage, true);
  assert.equal(owned.tags, true);
  assert.match(bundle, /viewerAccess\.manage\|\|viewerAccess\.tags\|\|viewerAccess\.remove/);
  assert.match(bundle, /\(viewerAccess\.manage\|\|viewerAccess\.tags\)&&h\(D,\{onClick:\(\)=>\{setActionsOpen\(false\);setVersionDialog\(`tags`\);\}\}/);
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

test('registry-wide tagging permissions apply across artifact types in that registry', () => {
  const settings = { options: { 'private-environment-tags': true, 'private-project-tags': true } };
  for (const artifact of [
    { kind: 'module', registry: 'Private' },
    { kind: 'provider', registry: 'Private' },
    { kind: 'stack', registry: 'Private' },
  ]) {
    assert.equal(access(settings, artifact, false).tags, true);
    assert.equal(access(settings, artifact, false).projectTags, true);
  }
  for (const artifact of [{ kind: 'module', registry: 'Public' }, { kind: 'provider', registry: 'Public' }]) {
    assert.equal(access(settings, artifact, false).tags, false);
    assert.equal(access(settings, artifact, false).projectTags, false);
  }
  assert.equal(access({ deleted: true, ...settings }, { kind: 'module', registry: 'Private' }).tags, false);
  assert.equal(access({ options: { 'private-environment-tags': true } }, { kind: 'module', registry: 'Private' }).projectTags, false);
});

test('team settings use consistent checkbox-first permission options', () => {
  assert.ok(bundle.includes('Assign reserved and registry environment tags to artifact versions'));
  assert.ok(bundle.includes('Assign project tags to registry artifacts'));
  assert.ok(bundle.includes('`${registry}-environment-tags`'));
  assert.ok(bundle.includes('`${registry}-project-tags`'));
  assert.ok(!bundle.includes('[`Manage`,['));
  assert.ok(bundle.includes('Manage owned'));
  assert.ok(!bundle.includes('[`Read`,['));
  assert.ok(!bundle.includes('[`Delete`,['));
  assert.ok(!bundle.includes('Update owned'));
  assert.ok(bundle.includes('Publish new'));
  assert.ok(bundle.includes('Browse and consume'));
  assert.ok(bundle.includes('read ${artifactType} details and consume ${artifactType}'));
  assert.ok(bundle.includes('Delete owned'));
  assert.ok(bundle.includes('Permissions are scoped by artifact type.'));
  assert.ok(!bundle.includes('registry-permission-table'));
  assert.ok(bundle.includes('permissionOption(`${registry}-${tab}-${action}`,label,helper)'));
  assert.match(bundle, /const permissionOption=.*className:`permission-option`},\s*create\(`input`,[\s\S]*?create\(`span`,null,create\(`b`,null,label\),create\(`small`,null,helper\)\)/);
  assert.match(styles, /\.registry-permission-options \.permission-option \{ padding: 8px 0; \}/);
  assert.ok(!bundle.includes('Grant to team'));
  assert.ok(!bundle.includes('create(`th`,{scope:`col`},`Permission`)'));
  assert.ok(!bundle.includes('registry-permission-group-row'));
  assert.ok(!bundle.includes('registry-permission-group {'));
  assert.ok(!bundle.includes('registry-permission-groups'));
  assert.ok(bundle.includes('const visibleArtifacts=artifacts.filter'));
  assert.ok(bundle.includes('screen===`artifact`&&viewerAccess.consume'));
});

test('prototype role switcher exposes only administrator, owner, and consumer', () => {
  assert.ok(bundle.includes('Registry administrator'));
  assert.ok(bundle.includes('Owner team member'));
  assert.ok(bundle.includes('Consumer'));
  assert.ok(!bundle.includes('Infra - no ownership-administration permission'));
  assert.ok(!bundle.includes('Interns - consumer'));
  assert.ok(!bundle.includes('Publish - no eligible teams'));
});

test('prototype workflows include the target team without a separate team selector', () => {
  const start = bundle.indexOf('function PrototypeNavigation(');
  const navigation = bundle.slice(start, bundle.indexOf('function pe()', start));
  assert.ok(navigation.includes('`Team settings - ${name}`'));
  assert.ok(navigation.includes('value:`team:${name}`'));
  assert.ok(navigation.includes('openTeamSettings(next.slice(5))'));
  assert.ok(!navigation.includes('onChange:event=>openTeamSettings(event.target.value)'));
  assert.ok(navigation.includes('Registry administrator - Platform'));
  assert.ok(navigation.includes('Owner team member - Core + AppEng'));
  assert.ok(navigation.includes('Consumer - Interns'));
});

test('owner removal is warned and confirmed in the assignment dialog', () => {
  assert.ok(bundle.includes('requiresClearConfirmation=value===``&&ownedArtifacts.length>0'));
  assert.ok(bundle.includes('Confirm owner removal.'));
  assert.ok(bundle.includes('disabled:value===null||(requiresClearConfirmation&&!confirmClear)'));
  assert.ok(!bundle.includes('OwnershipClearConfirmation'));
});

test('missing permissions route directly to team settings instead of contact-admin prompts', () => {
  assert.ok(bundle.includes('Go to team settings to add permissions'));
  assert.ok(bundle.includes('openTeamSettings(permissionTeam)'));
  assert.ok(bundle.includes('navigation.openSettings(value)'));
  assert.ok(bundle.includes('navigation.openSettings(teams[0])'));
  assert.ok(!bundle.includes('Publishing permission is required. Ask an administrator'));
  assert.ok(!bundle.includes('Contact ${contactNames} to grant Publish and Update permission'));
});

test('private library owner names are labels, not team-navigation links', () => {
  assert.ok(!bundle.includes('View artifacts owned by ${artifact.owner}'));
  assert.ok(!bundle.includes('onOwnerClick:team=>'));
  assert.ok(bundle.includes('b.createElement(OwnerIdentity,{artifact:t,permissions})'));
});

test('publishing requires an eligible owner and defaults only a single eligible team', () => {
  const settings = { Core: { options: { [manage]: true } } };
  const globalSettings = { ...settings, Platform: { privateRegistry: true } };
  assert.equal(context.defaultPublishingOwner(['Core']), 'Core');
  assert.equal(context.defaultPublishingOwner(['Core', 'AppEng']), '');
  assert.equal(context.defaultPublishingOwner([]), '');
  assert.equal(context.canPublishWithOwner(settings, 'mine', ''), false);
  assert.equal(context.canPublishWithOwner(settings, 'mine', 'Core'), true);
  assert.equal(context.canPublishWithOwner(settings, 'mine', 'AppEng'), false);
  assert.equal(context.canPublishWithOwner({}, 'mine', ''), false);
  assert.equal(context.canPublishWithOwner(settings, 'blocked', ''), false);
  assert.equal(context.canPublishWithOwner(settings, 'any', ''), false);
  assert.equal(context.canPublishWithOwner(settings, 'any', 'Core'), false);
  assert.equal(context.canPublishWithOwner(globalSettings, 'any', ''), true);
  assert.equal(context.canPublishWithOwner(globalSettings, 'any', 'Core'), true);
  assert.equal(context.canPublishWithOwner(globalSettings, 'any', 'Missing'), false);
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

test('owner assignment needs separate Publish and Update grants', () => {
  const permissions = { AppEng: {} };
  const artifact = { id: 1, kind: 'module', registry: 'Private', owner: '' };
  assert.equal(context.viewerArtifactAccess(permissions, ['AppEng'], artifact).manage, false);
  const assigned = { ...artifact, owner: 'AppEng' };
  const assignedAccess = context.viewerArtifactAccess(permissions, ['AppEng'], assigned);
  assert.equal(assignedAccess.manage, false);
  assert.equal(assignedAccess.publish, false);
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
  permissions.AppEng = { options: { 'private-Modules-publish': true } };
  assert.equal(context.ownerNeedsPermissions(permissions, assigned), true);
  assert.equal(context.viewerArtifactAccess(permissions, ['AppEng'], assigned).manage, false);
  permissions.AppEng.options['private-Modules-update-owned'] = true;
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
