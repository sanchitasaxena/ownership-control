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
  assert.equal(message, 'Core will no longer own aws-rds-starter-module. The module and its versions will become unowned. Platform and Owners can still manage aws-rds-starter-module through organization-wide permissions. Team permissions will not change.');
  assert.ok(!message.includes('prototype'));
});

test('bulk removal counts only supplied owned artifacts and excludes deleted managers', () => {
  const artifacts = ['one', 'two'].map(name => ({ name, owner: 'Core', kind: 'module', registry: 'Private' }));
  const message = removalMessage(artifacts, {
    Platform: { privateRegistry: true, deleted: true },
    Owners: { privateRegistry: true },
  });
  assert.match(message, /^Owner assignments will be removed from 2 artifacts\./);
  assert.match(message, /Owners can still manage these artifacts/);
  assert.ok(!message.includes('Platform'));
});

test('removal does not name a team without global management access', () => {
  const message = removalMessage([{ name: 'example', owner: 'Core' }], {
    Core: { options: { [manage]: true } },
  });
  assert.match(message, /Organization owners and teams with applicable organization-wide permissions/);
  assert.ok(!message.includes('Core can still manage'));
});
