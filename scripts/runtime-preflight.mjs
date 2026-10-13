import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function inspectCommand(command, args = ['--version']) {
  const proc = spawnSync(command, args, { encoding: 'utf8', timeout: 3500, windowsHide: true });
  const ok = !proc.error && proc.status === 0;
  const first = (proc.stdout || proc.stderr || '').trim().split(/\r?\n/)[0].slice(0, 160);
  return { available: ok, version: ok ? first : null };
}

export function collectRuntimePreflight(probe = inspectCommand) {
  const node = probe('node', ['--version']);
  const browser = probe('chromium', ['--version']);
  const ffmpeg = probe('ffmpeg', ['-version']);
  const blender = probe('blender', ['--version']);
  return {
    node, browser, ffmpeg, blender,
    npmRegistry: { checked: false, available: null, reason: 'No network package acquisition was attempted.' },
    assetFetch: { checked: false, available: null, reason: 'No unlicensed asset download attempted.' },
    flags: {
      nodeAvailable: node.available,
      browserBinaryAvailable: browser.available,
      videoEncoderAvailable: ffmpeg.available,
      blenderAvailable: blender.available,
      browserWebGLPixelsVerified: false,
      licensedProductionShoeVerified: false
    },
    stage: 'CAPABILITY_EVIDENCE_ONLY',
    note: 'Executable availability does not prove GPU rendering, 3D asset quality or production release readiness.'
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = collectRuntimePreflight();
  console.log(JSON.stringify(report, null, 2));
}
