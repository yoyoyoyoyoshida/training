import * as THREE from 'three';

// Accept any string as a move during parsing, we'll gracefully ignore invalid ones
export type Move = string;

export interface CubieState {
  id: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
}

export function createInitialState(): CubieState[] {
  const state: CubieState[] = [];
  let id = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        state.push({
          id: id++,
          position: new THREE.Vector3(x, y, z),
          rotation: new THREE.Quaternion(),
        });
      }
    }
  }
  return state;
}

const AXIS_VECTORS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

export function parseMoveString(movesStr: string): Move[] {
  return movesStr.trim().split(/\s+/).filter(m => m);
}

export function performMove(state: CubieState[], move: Move): CubieState[] {
  const newState = state.map(c => ({ 
    id: c.id, 
    position: c.position.clone(), 
    rotation: c.rotation.clone() 
  }));

  const m = move.replace(/[^a-zA-Z]/g, ''); // Extract just letters
  if (!m) return newState;
  
  const face = m[0];
  const isWide = m.toLowerCase().includes('w') || (face === face.toLowerCase() && !['x','y','z','m','e','s'].includes(face.toLowerCase()));

  let axis: THREE.Vector3;
  let angle = Math.PI / 2;
  let filterFn: (p: THREE.Vector3) => boolean;

  switch (face.toUpperCase()) {
    case 'R': axis = AXIS_VECTORS.x; filterFn = p => Math.round(p.x) >= (isWide ? 0 : 1); angle = -Math.PI / 2; break;
    case 'L': axis = AXIS_VECTORS.x; filterFn = p => Math.round(p.x) <= (isWide ? 0 : -1); angle = Math.PI / 2; break;
    case 'U': axis = AXIS_VECTORS.y; filterFn = p => Math.round(p.y) >= (isWide ? 0 : 1); angle = -Math.PI / 2; break;
    case 'D': axis = AXIS_VECTORS.y; filterFn = p => Math.round(p.y) <= (isWide ? 0 : -1); angle = Math.PI / 2; break;
    case 'F': axis = AXIS_VECTORS.z; filterFn = p => Math.round(p.z) >= (isWide ? 0 : 1); angle = -Math.PI / 2; break;
    case 'B': axis = AXIS_VECTORS.z; filterFn = p => Math.round(p.z) <= (isWide ? 0 : -1); angle = Math.PI / 2; break;
    
    // Slice moves
    case 'M': axis = AXIS_VECTORS.x; filterFn = p => Math.round(p.x) === 0; angle = Math.PI / 2; break; // M follows L
    case 'E': axis = AXIS_VECTORS.y; filterFn = p => Math.round(p.y) === 0; angle = Math.PI / 2; break; // E follows D
    case 'S': axis = AXIS_VECTORS.z; filterFn = p => Math.round(p.z) === 0; angle = -Math.PI / 2; break; // S follows F
    
    // Whole cube rotations
    case 'X': axis = AXIS_VECTORS.x; filterFn = () => true; angle = -Math.PI / 2; break;
    case 'Y': axis = AXIS_VECTORS.y; filterFn = () => true; angle = -Math.PI / 2; break;
    case 'Z': axis = AXIS_VECTORS.z; filterFn = () => true; angle = -Math.PI / 2; break;
    
    default: return newState;
  }

  // Adjust angle for modifiers (', 2)
  if (move.includes("'")) angle *= -1;
  if (move.includes("2")) angle *= 2;

  const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);

  newState.forEach(c => {
    if (filterFn(c.position)) {
      c.position.applyQuaternion(quaternion);
      // Clean up floating point errors
      c.position.x = Math.round(c.position.x);
      c.position.y = Math.round(c.position.y);
      c.position.z = Math.round(c.position.z);

      c.rotation.premultiply(quaternion);
    }
  });

  return newState;
}

export function performMoves(state: CubieState[], moves: Move[]): CubieState[] {
  let currTime = state;
  moves.forEach(m => {
    currTime = performMove(currTime, m);
  });
  return currTime;
}
