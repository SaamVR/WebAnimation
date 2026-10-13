import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const CHUNK_JSON = 0x4e4f534a;
const HEX256 = /^[0-9a-f]{64}$/i;

/**
 * Validates container integrity and declared provenance; does not certify artistic
 * quality, ownership, GPU pixels or trademark/public-display rights.
 */
export async function validateShoeAsset(path, manifest = {}) {
  const errors = [];
  const classification = manifest.classification === 'production' ? 'production' : 'internal-fixture';
  if (typeof manifest.source !== 'string' || !manifest.source.trim()) errors.push('Source provenance is required.');
  if (typeof manifest.license !== 'string' || !manifest.license.trim() || /^unknown$/i.test(manifest.license.trim())) {
    errors.push('Identifiable license or rights statement is required.');
  }
  if (!HEX256.test(manifest.expectedSha256 ?? '')) errors.push('Expected SHA-256 is required for traceable intake.');
  if (classification === 'production' && manifest.publicUseAuthorized !== true) {
    errors.push('Production requires explicit public-use authorization.');
  }

  let bytes;
  try {
    if (typeof path !== 'string' || !path.trim()) throw new Error('Asset path was not provided');
    bytes = await readFile(path);
  } catch (error) {
    errors.push('Asset unavailable: ' + error.message);
    return {
      ok: false, status: 'BLOCKED', errors, sha256: null, byteSize: 0,
      variantNames: [], variantVerified: false, productionReady: false
    };
  }
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (HEX256.test(manifest.expectedSha256 ?? '') && sha256.toLowerCase() !== manifest.expectedSha256.toLowerCase()) {
    errors.push('SHA-256 mismatch against intake manifest.');
  }
  let gltf;
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'glTF') {
    errors.push('Not a binary glTF/GLB container.');
  } else if (bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) {
    errors.push('Unsupported GLB version or inconsistent declared length.');
  } else {
    const jsonLength = bytes.readUInt32LE(12);
    const jsonType = bytes.readUInt32LE(16);
    if (jsonType !== CHUNK_JSON || jsonLength === 0 || 20 + jsonLength > bytes.length) {
      errors.push('Missing or out-of-bounds GLB JSON chunk.');
    } else {
      try {
        gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength).replace(/\0+$/g, '').trim());
        if (gltf.asset?.version !== '2.0') errors.push('GLB JSON must declare glTF asset version 2.0.');
        if (!Array.isArray(gltf.meshes) || gltf.meshes.length === 0) errors.push('GLB contains no declared product mesh.');
      } catch {
        errors.push('GLB JSON chunk cannot be parsed.');
      }
    }
  }
  const embeddedVariants = gltf?.extensions?.KHR_materials_variants?.variants;
  const variantVerified = Array.isArray(embeddedVariants) && embeddedVariants.length > 0;
  const names = variantVerified
    ? embeddedVariants.map(v => v?.name).filter(v => typeof v === 'string' && v.trim())
    : (Array.isArray(manifest.variantNames) ? manifest.variantNames.filter(v => typeof v === 'string' && v.trim()) : []);
  if (new Set(names).size !== names.length) errors.push('Variant names must be distinct.');
  const ok = errors.length === 0;
  return {
    ok, status: !ok ? 'BLOCKED' : classification === 'production' ? 'TECHNICALLY_VALID' : 'INSPECTABLE_ONLY',
    errors, sha256, byteSize: bytes.length, meshCount: gltf?.meshes?.length ?? 0,
    variantNames: names, variantVerified, variantSource: variantVerified ? 'GLB extension' : 'manifest declaration',
    productionReady: false,
    limitations: [
      'Geometry/material rendering not verified in a real GPU browser.',
      'Technical validation is not approval of asset fidelity or creative direction.',
      'Public use requires independent license, logo and trademark review.'
    ]
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [assetPath, manifestPath] = process.argv.slice(2);
  const manifest = manifestPath ? JSON.parse(await readFile(manifestPath, 'utf8')) : {};
  const result = await validateShoeAsset(assetPath, manifest);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 2;
}
