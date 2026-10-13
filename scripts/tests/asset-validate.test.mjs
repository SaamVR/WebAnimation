import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { validateShoeAsset } from '../asset-validate.mjs';

function fakeGlb({ variants = true, mapped = true } = {}) {
  const doc = {
    asset: { version: '2.0' },
    meshes: [{ primitives: [{
      attributes: { POSITION: 0 },
      ...(variants && mapped ? { extensions: { KHR_materials_variants: {
        mappings: [{ material: 0, variants: [0, 1, 2] }]
      } } } : {})
    }] }],
    accessors: [{ count: 3, type: 'VEC3', componentType: 5126 }],
    materials: [{ name: 'Fixture material' }],
    ...(variants ? { extensions: { KHR_materials_variants: {
      variants: [{ name: 'Chicago' }, { name: 'Blue' }, { name: 'White' }]
    } } } : {})
  };
  const raw = Buffer.from(JSON.stringify(doc));
  const padded = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 0x20);
  raw.copy(padded);
  const glb = Buffer.alloc(20 + padded.length);
  glb.write('glTF', 0, 4, 'ascii');
  glb.writeUInt32LE(2, 4);
  glb.writeUInt32LE(glb.length, 8);
  glb.writeUInt32LE(padded.length, 12);
  glb.writeUInt32LE(0x4e4f534a, 16);
  padded.copy(glb, 20);
  return glb;
}
const digest = data => createHash('sha256').update(data).digest('hex');
const manifest = bytes => ({
  source: 'test fixture, authored in the unit test',
  license: 'Internal automated validation fixture; no public release',
  expectedSha256: digest(bytes), classification: 'internal-fixture'
});
async function fixture(fn, config) {
  const dir = await mkdtemp(join(tmpdir(), 'solecraft-validation-'));
  const path = join(dir, 'shoe.glb');
  const bytes = fakeGlb(config);
  await writeFile(path, bytes);
  try { return await fn(path, bytes); } finally { await rm(dir, { recursive: true, force: true }); }
}
test('intake recognizes GLB version, SHA and embedded variant names but not production approval', () =>
  fixture(async (path, bytes) => {
    const result = await validateShoeAsset(path, manifest(bytes));
    assert.equal(result.ok, true);
    assert.equal(result.status, 'INSPECTABLE_ONLY');
    assert.equal(result.productionReady, false);
    assert.equal(result.sha256, digest(bytes));
    assert.equal(result.byteSize, bytes.length);
    assert.equal(result.meshCount, 1);
    assert.equal(result.variantVerified, true);
    assert.deepEqual(result.variantNames, ['Chicago', 'Blue', 'White']);
  })
);
test('invalid GLB magic is rejected', () =>
  fixture(async (path, bytes) => {
    const altered = Buffer.from(bytes); altered.write('BAD!', 0, 'ascii');
    await writeFile(path, altered);
    assert.match((await validateShoeAsset(path, manifest(altered))).errors.join(' '), /Not a binary glTF/);
  })
);
test('asset missing, rights unknown and wrong checksum block intake', async () => {
  const missing = await validateShoeAsset('/does/not/exist/shoe.glb', {});
  assert.equal(missing.status, 'BLOCKED');
  assert.match(missing.errors.join(' '), /Asset unavailable/);
  await fixture(async (path, bytes) => {
    assert.equal((await validateShoeAsset(path, { ...manifest(bytes), license: 'unknown' })).ok, false);
    assert.match((await validateShoeAsset(path, { ...manifest(bytes), expectedSha256: 'f'.repeat(64) })).errors.join(' '), /SHA-256 mismatch/);
    assert.match((await validateShoeAsset(path, { ...manifest(bytes), classification: 'production' })).errors.join(' '), /public-use authorization/);
  });
});
test('GLB extension color names without mesh bindings are not verified material variants', () =>
  fixture(async (path, bytes) => {
    const result = await validateShoeAsset(path, { ...manifest(bytes), variantNames: ['Sky'] });
    assert.equal(result.ok, true);
    assert.equal(result.variantVerified, false);
    assert.equal(result.variantSource, 'manifest declaration');
    assert.deepEqual(result.variantNames, ['Sky']);
    assert.equal(result.productionReady, false);
  }, { variants: true, mapped: false })
);
test('manifest colorways are declarations, not verified GLB materials', () =>
  fixture(async (path, bytes) => {
    const result = await validateShoeAsset(path, { ...manifest(bytes), variantNames: ['Black', 'Lair'] });
    assert.equal(result.variantVerified, false);
    assert.equal(result.variantSource, 'manifest declaration');
    assert.deepEqual(result.variantNames, ['Black', 'Lair']);
  }, { variants: false })
);
