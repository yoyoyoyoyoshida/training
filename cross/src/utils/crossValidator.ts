import * as THREE from 'three';
import { CubieState } from './cubeState';

// Initial IDs are determined by index = (x+1)*9 + (y+1)*3 + (z+1)
export function getCubieId(x: number, y: number, z: number): number {
  return (x + 1) * 9 + (y + 1) * 3 + (z + 1);
}

// Defining Initial Normals
const WHITE_NORMAL = new THREE.Vector3(0, 1, 0); // White is Up (y=1) in our initialization
const YELLOW_NORMAL = new THREE.Vector3(0, -1, 0); // Yellow is Down (y=-1)

// Target Centers and Edges (Based on White Cross initially)
const CENTERS = {
  WHITE: getCubieId(0, 1, 0),
  GREEN: getCubieId(0, 0, 1),
  RED: getCubieId(1, 0, 0),
  BLUE: getCubieId(0, 0, -1),
  ORANGE: getCubieId(-1, 0, 0),
  YELLOW: getCubieId(0, -1, 0),
};

const WHITE_EDGES = [
  { edgeId: getCubieId(0, 1, 1), centerId: CENTERS.GREEN },
  { edgeId: getCubieId(1, 1, 0), centerId: CENTERS.RED },
  { edgeId: getCubieId(0, 1, -1), centerId: CENTERS.BLUE },
  { edgeId: getCubieId(-1, 1, 0), centerId: CENTERS.ORANGE },
];

const YELLOW_EDGES = [
  { edgeId: getCubieId(0, -1, 1), centerId: CENTERS.GREEN },
  { edgeId: getCubieId(1, -1, 0), centerId: CENTERS.RED },
  { edgeId: getCubieId(0, -1, -1), centerId: CENTERS.BLUE },
  { edgeId: getCubieId(-1, -1, 0), centerId: CENTERS.ORANGE },
];

/**
 * Checks if the specified cross (White or Yellow) is currently solved accurately.
 * A cross is solved if all 4 edges are in the correct position relative to the centers,
 * and oriented correctly (e.g. the White sticker of the edge points in the same direction as the White sticker of the center).
 */
export function checkCrossSolved(state: CubieState[], color: 'WHITE' | 'YELLOW'): boolean {
  const targetCenterId = color === 'WHITE' ? CENTERS.WHITE : CENTERS.YELLOW;
  const targetNormalBase = color === 'WHITE' ? WHITE_NORMAL : YELLOW_NORMAL;
  const edgesData = color === 'WHITE' ? WHITE_EDGES : YELLOW_EDGES;

  const targetCenter = state.find(c => c.id === targetCenterId);
  if (!targetCenter) return false;

  // Global vector indicating where the target cross face is pointing
  const targetGlobalNormal = targetNormalBase.clone().applyQuaternion(targetCenter.rotation).round();

  for (const edgeData of edgesData) {
    const edge = state.find(c => c.id === edgeData.edgeId);
    const sideCenter = state.find(c => c.id === edgeData.centerId);

    if (!edge || !sideCenter) return false;

    // 1. Check Position
    // The edge must sit exactly between the target center and the side center.
    // Mathematically, its coordinate vector should be the sum of the two center vectors.
    const expectedPosition = new THREE.Vector3().addVectors(targetCenter.position, sideCenter.position).round();
    const actualPosition = edge.position.clone().round();
    
    if (!expectedPosition.equals(actualPosition)) {
      return false; // Edge is in the wrong place
    }

    // 2. Check Orientation
    // The target color sticker on the edge must point in the same direction as the target center.
    const edgeTargetNormal = targetNormalBase.clone().applyQuaternion(edge.rotation).round();
    if (!edgeTargetNormal.equals(targetGlobalNormal)) {
      return false; // Edge is flipped
    }
  }

  // All 4 edges passed position and orientation checks
  return true;
}
