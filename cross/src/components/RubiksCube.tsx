import { useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { CubieState } from '../utils/cubeState';

const FACE_COLORS = [
  '#FF0000', // 0: Right (Red)
  '#FF8800', // 1: Left (Orange)
  '#FFFFFF', // 2: Up (White)
  '#FFCC00', // 3: Down (Yellow) - 少し深みのある黄色へ
  '#00BB00', // 4: Front (Green)
  '#0055FF', // 5: Back (Blue)
];

const CUBE_SIZE = 1;
const SPACING = 1.05;

interface CubieProps {
  state: CubieState;
}

function Cubie({ state }: CubieProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 内部面の色（グレー）
  const INTERNAL_COLOR = '#222222';
  
  // 正確なマッピング
  const pieceColors = [
    state.initialPos.x === 1 ? FACE_COLORS[0] : INTERNAL_COLOR, // +X: Right
    state.initialPos.x === -1 ? FACE_COLORS[1] : INTERNAL_COLOR, // -X: Left
    state.initialPos.y === 1 ? FACE_COLORS[2] : INTERNAL_COLOR, // +Y: Up
    state.initialPos.y === -1 ? FACE_COLORS[3] : INTERNAL_COLOR, // -Y: Down
    state.initialPos.z === 1 ? FACE_COLORS[4] : INTERNAL_COLOR, // +Z: Front
    state.initialPos.z === -1 ? FACE_COLORS[5] : INTERNAL_COLOR, // -Z: Back
  ];

  return (
    <mesh 
      ref={meshRef}
      position={[state.position.x * SPACING, state.position.y * SPACING, state.position.z * SPACING]}
      quaternion={state.rotation.clone()}
    >
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      {pieceColors.map((color, index) => (
        <meshStandardMaterial 
          key={index} 
          attach={`material-${index}`} 
          color={color} 
          roughness={0.4} // 反射を抑えて色が白飛びしないように
          metalness={0.0} // 非金属感を出して色の純度を上げる
        />
      ))}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)]} />
        <lineBasicMaterial color="#000000" linewidth={2} />
      </lineSegments>
    </mesh>
  );
}

interface RubiksCubeProps {
  cubies: CubieState[];
}

export function RubiksCube({ cubies }: RubiksCubeProps) {
  return (
    <group>
      {cubies.map(c => <Cubie key={c.id} state={c} />)}
      
      {/* Back ガイドの壁と文字 */}
      <group position={[0, 0, -8]}>
        <mesh>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#111" transparent opacity={0.4} />
        </mesh>
        <Text 
          position={[0, 0, 0.05]} 
          fontSize={2.5} 
          color="#32CD32" 
          fillOpacity={0.25}
          anchorX="center" 
          anchorY="middle"
          fontWeight={800}
          letterSpacing={0.1}
        >
          GACHI CUBE
        </Text>
      </group>
    </group>
  );
}
