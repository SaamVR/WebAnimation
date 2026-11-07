/**
 * CHAPCHITRA Artist's Edit worktable — PRE-ASSET STAGE CONTRACT ONLY.
 *
 * Not imported into app.mjs and does NOT render artwork. All coordinate
 * rectangles are preliminary measurements from the owner's four COMPLETE
 * 4000x2250 composition references, normalized to one 2048x1152 viewBox.
 * Final geometry and alpha-overlap must be verified against the layered ZIP.
 * Never replace the desk with a generated/repainted approximation.
 */
export const WORKTABLE_VIEWBOX = Object.freeze({
  width: 2048, height: 1152, originalWidth: 4000, originalHeight: 2250,
  sourceToStage: 2048 / 4000,
  aspectRatio: 16 / 9,
  preserveAspectRatio: 'xMidYMid meet',
});

const rect = (x, y, width, height) => Object.freeze({ x, y, width, height });
const layer = (id, assetSlot, box, z, opts = {}) =>
  Object.freeze({ id, assetSlot, box: rect(...box), z, ...opts });

/**
 * These props are baked into the CLEAN desk background. They must NOT be
 * re-created or separately layered unless the owner later supplies cutouts:
 * plant/books, lamp, paintbrush cup, tape, scissors, pencil, ruler, printed
 * color-test page, green ink jar and natural wood grain/stains.
 */
export const BACKDROP = Object.freeze({
  assetSlot: 'desk/backdrop',
  box: rect(0, 0, 2048, 1152),
  z: 0,
  filenameFromOwner: 'Artist-edit-backdrop-1(2).png',
  availableInConversation: true,
  availableInRepository: false,
});

export const GARMENT_VARIANTS = Object.freeze({
  regular: Object.freeze({
    label: 'Regular Tee', reference: 'Composition-1-regular-tshirt.png',
    assetSlot: 'garments/regular', box: rect(565, 188, 915, 870),
    // PROVISIONAL blank central chest region, NOT an approved print mask.
    chestGuide: rect(830, 360, 355, 378),
  }),
  dropShoulder: Object.freeze({
    label: 'Drop Shoulder', reference: 'Composition-2-drop-shoulder.png',
    assetSlot: 'garments/drop-shoulder', box: rect(575, 186, 901, 872),
    chestGuide: rect(820, 360, 350, 390),
  }),
  fullSleeve: Object.freeze({
    label: 'Full Sleeve', reference: 'Composition-3-full-sleeve.png',
    assetSlot: 'garments/full-sleeve', box: rect(619, 193, 818, 864),
    chestGuide: rect(835, 345, 330, 382),
  }),
  hoodie: Object.freeze({
    label: 'Hoodie', reference: 'Composition-4-hoodie.png',
    assetSlot: 'garments/hoodie', box: rect(624, 216, 805, 845),
    chestGuide: rect(840, 410, 325, 320),
  }),
});

/**
 * Coordinates are the shared absolute design-space placement.
 * z is a render-order slot, not the DOM's global z-index. The final
 * transparent assets determine precise silhouettes/shadows/clip masks.
 */
export const COMMON_LAYERS = Object.freeze([
  layer('garment-style-board', 'controls/style-board', [72, 451, 468, 194], 10),
  layer('garment-style-sign', 'controls/style-sign', [175, 323, 275, 145], 15),
  layer('style-regular', 'controls/style-regular', [102, 494, 90, 125], 18, { group: 'style', value: 'regular', accessibleLabel: 'Regular Tee' }),
  layer('style-drop', 'controls/style-drop', [207, 494, 89, 125], 18, { group: 'style', value: 'dropShoulder', accessibleLabel: 'Drop Shoulder' }),
  layer('style-full', 'controls/style-full', [314, 494, 89, 125], 18, { group: 'style', value: 'fullSleeve', accessibleLabel: 'Full Sleeve' }),
  layer('style-hoodie', 'controls/style-hoodie', [421, 494, 90, 125], 18, { group: 'style', value: 'hoodie', accessibleLabel: 'Hoodie' }),

  layer('color-tray', 'controls/color-tray', [86, 819, 345, 246], 10),
  layer('colors-sign', 'controls/colors-sign', [25, 696, 312, 134], 15),
  layer('color-black', 'controls/pot-black', [117, 832, 91, 94], 21, { group: 'color', value: 'black', accessibleLabel: 'Black' }),
  layer('color-white', 'controls/pot-white', [211, 832, 92, 94], 21, { group: 'color', value: 'white', accessibleLabel: 'White' }),
  layer('color-red', 'controls/pot-red', [305, 832, 92, 94], 21, { group: 'color', value: 'red', accessibleLabel: 'Red' }),
  layer('color-yellow', 'controls/pot-yellow', [117, 921, 91, 94], 21, { group: 'color', value: 'yellow', accessibleLabel: 'Yellow' }),
  layer('color-blue', 'controls/pot-blue', [211, 921, 92, 94], 21, { group: 'color', value: 'blue', accessibleLabel: 'Blue' }),
  layer('color-green', 'controls/pot-green', [305, 921, 92, 94], 21, { group: 'color', value: 'green', accessibleLabel: 'Green' }),

  layer('size-rope', 'controls/size-rope', [672, 0, 713, 122], 12),
  layer('size-sign', 'controls/size-sign', [701, 80, 196, 110], 16),
  layer('size-s', 'controls/tag-s', [914, 80, 57, 91], 22, { group: 'size', value: 'S', accessibleLabel: 'Size S' }),
  layer('size-m', 'controls/tag-m', [987, 80, 57, 91], 22, { group: 'size', value: 'M', accessibleLabel: 'Size M' }),
  layer('size-l', 'controls/tag-l', [1059, 80, 57, 91], 22, { group: 'size', value: 'L', accessibleLabel: 'Size L' }),
  layer('size-xl', 'controls/tag-xl', [1131, 80, 62, 91], 22, { group: 'size', value: 'XL', accessibleLabel: 'Size XL' }),
  layer('size-xxl', 'controls/tag-xxl', [1201, 80, 67, 91], 22, { group: 'size', value: 'XXL', accessibleLabel: 'Size XXL' }),

  layer('upload-sketchbook', 'controls/upload-sketchbook', [1555, 167, 409, 504], 16,
    { group: 'upload', accessibleLabel: 'Upload artwork', action: 'select-local-artwork' }),
  layer('print-size-panel', 'controls/print-size-board', [1687, 858, 286, 211], 10),
  layer('print-size-sign', 'controls/print-size-sign', [1664, 752, 333, 113], 15),
  layer('print-a3', 'controls/print-a3', [1707, 880, 132, 163], 18,
    { group: 'printSize', value: 'A3', accessibleLabel: 'Print area A3' }),
  layer('print-a4', 'controls/print-a4', [1847, 896, 107, 149], 18,
    { group: 'printSize', value: 'A4', accessibleLabel: 'Print area A4' }),

  // Workers are naturally ABOVE and partially OVERLAP the garment artwork.
  // In final rig their arm/brush/paper/ladder may require independent sublayers.
  layer('worker-art', 'workers/art-holder', [559, 481, 159, 207], 60),
  layer('worker-roller', 'workers/ladder-roller', [1208, 316, 218, 226], 60),
  layer('worker-hem', 'workers/hem-finisher', [706, 911, 153, 172], 60),
]);

export const GARMENT_LAYER_Z = 35;
export const ARTWORK_LAYER_Z = 38;

/**
 * Resolve once per garment. Stage geometry is shared across every breakpoint:
 * no independently computed percentage positions for controls/workers.
 */
export function resolveWorktableLayers(garment = 'regular') {
  const item = GARMENT_VARIANTS[garment];
  if (!item) throw new RangeError('Unsupported worktable garment: ' + garment);
  return Object.freeze([
    Object.freeze({ id: 'desk', assetSlot: BACKDROP.assetSlot, box: BACKDROP.box, z: 0 }),
    ...COMMON_LAYERS,
    Object.freeze({ id: 'garment', assetSlot: item.assetSlot, box: item.box, z: GARMENT_LAYER_Z,
      variant: garment, garmentSource: item.reference }),
    // Do NOT render a fake uploaded-design layer. The artwork and physically
    // correct print mask/warp are supplied and calibrated in the later ZIP phase.
  ].sort((a, b) => a.z - b.z));
}

/**
 * Whole-stage xMidYMid meet transform; this is the ONLY scaling/letterboxing
 * mapping. For touch accessibility a separate semantic control rail or
 * pan/zoom of the entire stage may be added, never independent object drift.
 */
export function stageTransform(viewportWidth, viewportHeight) {
  if (!(viewportWidth > 0 && viewportHeight > 0)) {
    throw new RangeError('Positive stage viewport dimensions are required');
  }
  const scale = Math.min(viewportWidth / WORKTABLE_VIEWBOX.width,
    viewportHeight / WORKTABLE_VIEWBOX.height);
  return Object.freeze({
    scale,
    offsetX: (viewportWidth - WORKTABLE_VIEWBOX.width * scale) / 2,
    offsetY: (viewportHeight - WORKTABLE_VIEWBOX.height * scale) / 2,
  });
}

export function pointToStage(clientX, clientY, bounds) {
  const { scale, offsetX, offsetY } = stageTransform(bounds.width, bounds.height);
  const x = (clientX - bounds.left - offsetX) / scale;
  const y = (clientY - bounds.top - offsetY) / scale;
  return { x, y, inside: x >= 0 && x <= WORKTABLE_VIEWBOX.width &&
    y >= 0 && y <= WORKTABLE_VIEWBOX.height };
}

export const SIZE_VALUES = Object.freeze(['S', 'M', 'L', 'XL', 'XXL']);
export const COLOR_VALUES = Object.freeze(['black', 'white', 'red', 'yellow', 'blue', 'green']);
export const PRINT_VALUES = Object.freeze(['A3', 'A4']);

export function createWorktableState() {
  return { garment: 'regular', size: 'M', color: 'white', printSize: 'A4',
    artwork: null, artworkPlacement: null };
}

/** UI-only reducer. File processing, sanitization, upload and canvas masking
 * are deliberately NOT enabled before the owner's transparent assets arrive.
 */
export function worktableReducer(state, action) {
  if (!state || !action) throw new TypeError('State and action required');
  const groups = {
    garment: Object.keys(GARMENT_VARIANTS),
    size: SIZE_VALUES, color: COLOR_VALUES, printSize: PRINT_VALUES,
  };
  if (action.type === 'select') {
    const allowed = groups[action.group];
    if (!allowed || !allowed.includes(action.value)) {
      throw new RangeError('Unsupported worktable selection');
    }
    return { ...state, [action.group]: action.value,
      ...(action.group === 'garment' ? { artworkPlacement: null } : {}) };
  }
  if (action.type === 'clear-artwork') {
    return { ...state, artwork: null, artworkPlacement: null };
  }
  throw new RangeError('Unsupported worktable event');
}
