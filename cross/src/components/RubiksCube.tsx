import { useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CubieState } from '../utils/cubeState';

const FACE_COLORS = [
  '#FF0000', // 0: Right (Red)
  '#FF8800', // 1: Left (Orange)
  '#FFFFFF', // 2: Up (White)
  '#FFE600', // 3: Down (Yellow)
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
  const initialPosVec = useRef(new THREE.Vector3(state.initialPos.x, state.initialPos.y, state.initialPos.z));
  const tempVec = useRef(new THREE.Vector3());
  const isInitialized = useRef(false);

  // 滑らかなアニメーション処理
  useFrame(() => {
    if (!meshRef.current) return;
    
    // 初回のみ即座に配置
    if (!isInitialized.current) {
      meshRef.current.quaternion.copy(state.rotation);
      isInitialized.current = true;
    }

    // 1. 回転を補間 (Slerp) - クォータニオンだけを滑らかに動かす
    meshRef.current.quaternion.slerp(state.rotation, 0.2);
    
    // 2. 補間された回転を初期位置に適用して、現在の「正しい」位置を逆算する
    // これにより、どんな回転でも常に正確な円軌道を通るようになります
    tempVec.current.copy(initialPosVec.current);
    tempVec.current.applyQuaternion(meshRef.current.quaternion);
    
    meshRef.current.position.set(
      tempVec.current.x * SPACING,
      tempVec.current.y * SPACING,
      tempVec.current.z * SPACING
    );
  });

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
    <mesh ref={meshRef}>
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      {pieceColors.map((color, index) => (
        <meshStandardMaterial 
          key={index} 
          attach={`material-${index}`} 
          color={color} 
          roughness={0.4} 
          metalness={0.0} 
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
