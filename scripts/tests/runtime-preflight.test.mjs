import test from 'node:test';
import assert from 'node:assert/strict';
import { collectRuntimePreflight } from '../runtime-preflight.mjs';

test('missing Blender is BLOCKED as a capability, never represented as installed', () => {
  const report = collectRuntimePreflight(name => ({
    available: name === 'node' || name === 'ffmpeg',
    version: name === 'node' ? 'v22.16.0' : null
  }));
  assert.equal(report.flags.blenderAvailable, false);
  assert.equal(report.flags.browserBinaryAvailable, false);
  assert.equal(report.flags.browserWebGLPixelsVerified, false);
  assert.equal(report.flags.licensedProductionShoeVerified, false);
  assert.equal(report.node.available, true);
  assert.equal(report.assetFetch.checked, false);
  assert.equal(report.npmRegistry.available, null);
});
test('even an available Chromium binary is not GPU pixel acceptance', () => {
  const report = collectRuntimePreflight(() => ({ available: true, version: 'fixture' }));
  assert.equal(report.flags.browserBinaryAvailable, true);
  assert.equal(report.flags.browserWebGLPixelsVerified, false);
  assert.equal(report.stage, 'CAPABILITY_EVIDENCE_ONLY');
});
