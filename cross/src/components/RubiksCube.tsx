import { useRef, useMemo } from 'react';
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
const ANIM_SPEED = 0.15;

// どの面が回転しているか、どの軸で何度回るかを表す型
interface ActiveMove {
  axis: THREE.Vector3;       // 回転軸（正規化済み）
  totalAngle: number;        // 目標角度（ラジアン）
  currentAngle: number;      // 現在の補間済み角度
  affectedIds: Set<number>;  // 回転するパーツのID集合
  // アニメーション開始時点の各パーツの状態（スナップショット）
  preMoveCubies: Map<number, { position: THREE.Vector3; rotation: THREE.Quaternion }>;
  // 完了フラグ: totalAngleに到達した次フレームでnullにする（1フレーム猶予で色乱れを防ぐ）
  done: boolean;
}

// 個々のパーツ描画コンポーネント（アニメーション中かどうかで挙動が変わる）
interface CubieProps {
  state: CubieState;
  activeMove: React.MutableRefObject<ActiveMove | null>;
}

function Cubie({ state, activeMove }: CubieProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const move = activeMove.current;

    if (move && move.affectedIds.has(state.id)) {
      // --- アニメーション中: 動かすグループに属するパーツ ---
      const pre = move.preMoveCubies.get(state.id);
      if (!pre) return;

      // アニメーション開始時点の位置・回転から、現在の補間角度分だけ回転させる
      const animQ = new THREE.Quaternion().setFromAxisAngle(move.axis, move.currentAngle);

      // 位置を回転
      const pos = pre.position.clone().multiplyScalar(SPACING);
      pos.applyQuaternion(animQ);
      meshRef.current.position.copy(pos);

      // 向き（面の色の回転）も同様に適用
      meshRef.current.quaternion.copy(animQ).multiply(pre.rotation);
    } else {
      // --- アニメーション中でないパーツ: 最終ステートに即座に配置 ---
      meshRef.current.position.set(
        state.position.x * SPACING,
        state.position.y * SPACING,
        state.position.z * SPACING,
      );
      meshRef.current.quaternion.copy(state.rotation);
    }
  });

  const INTERNAL_COLOR = '#222222';
  const pieceColors = [
    state.initialPos.x === 1  ? FACE_COLORS[0] : INTERNAL_COLOR,
    state.initialPos.x === -1 ? FACE_COLORS[1] : INTERNAL_COLOR,
    state.initialPos.y === 1  ? FACE_COLORS[2] : INTERNAL_COLOR,
    state.initialPos.y === -1 ? FACE_COLORS[3] : INTERNAL_COLOR,
    state.initialPos.z === 1  ? FACE_COLORS[4] : INTERNAL_COLOR,
    state.initialPos.z === -1 ? FACE_COLORS[5] : INTERNAL_COLOR,
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
  // アニメーション中の回転情報（refなのでレンダリングをトリガーしない）
  const activeMove = useRef<ActiveMove | null>(null);
  // 直前のキューブステート（差分検出のため保持）
  const prevCubies = useRef<CubieState[]>(cubies);

  // cubiesが更新された（手が入力された）タイミングを検知してアニメーションを開始する
  useMemo(() => {
    const prev = prevCubies.current;
    if (prev === cubies) return;

    // 前のアニメーションが途中なら即座に最終位置で完了させてから次を開始する
    // これにより「連打時の乱れ」と「前の操作の色ずれ」を防ぐ
    if (activeMove.current) {
      activeMove.current.currentAngle = activeMove.current.totalAngle;
      activeMove.current = null;
    }

    // 前後のステートを比較し、「動いたパーツ」と「回転情報」を割り出す
    const movedIds: number[] = [];
    const rotationDeltas: THREE.Quaternion[] = [];

    for (let i = 0; i < cubies.length; i++) {
      const cur = cubies[i];
      const old = prev.find(p => p.id === cur.id);
      if (!old) continue;

      // 位置が変化したパーツを「動いたパーツ」とみなす
      if (!cur.position.equals(old.position)) {
        movedIds.push(cur.id);
        // ワールド空間での回転量を復元する: moveQ = cur.rotation × old.rotation.inverse()
        // cubeState.ts では c.rotation.premultiply(moveQ) → cur.rotation = moveQ × old.rotation
        // したがって moveQ = cur.rotation × old.rotation.inverse()
        const delta = cur.rotation.clone().multiply(old.rotation.clone().invert());
        rotationDeltas.push(delta);
      }
    }

    if (movedIds.length === 0) {
      prevCubies.current = cubies;
      return;
    }

    // 全パーツの回転差分は同一のはずなので最初のものを代表として使う
    const deltaQ = rotationDeltas[0];

    // クォータニオンから回転軸・角度を抽出する
    // 角度が-πを超えないようにnormalizeし、常に正の角度側を使う
    const clampedW = Math.min(1, Math.abs(deltaQ.w));
    const angle = 2 * Math.acos(clampedW);
    const sinHalfAngle = Math.sqrt(Math.max(0, 1 - deltaQ.w * deltaQ.w));
    let axis: THREE.Vector3;
    if (sinHalfAngle < 0.001) {
      axis = new THREE.Vector3(0, 1, 0); // 角度がほぼ0の場合のフォールバック
    } else {
      axis = new THREE.Vector3(deltaQ.x, deltaQ.y, deltaQ.z).divideScalar(sinHalfAngle);
      // クォータニオンのwが負の場合は軸を反転（常に正の角度で表現するため）
      if (deltaQ.w < 0) axis.negate();
    }

    // アニメーション前のスナップショットを記録する
    const preMoveCubies = new Map<number, { position: THREE.Vector3; rotation: THREE.Quaternion }>();
    for (const id of movedIds) {
      const old = prev.find(p => p.id === id)!;
      preMoveCubies.set(id, {
        position: old.position.clone(),
        rotation: old.rotation.clone(),
      });
    }

    // 動いていないパーツ（全体持ち替えの場合は全パーツ）も含める
    // → 全パーツが動いた場合（x, y, z 持ち替え）は全員対象
    const affectedIds = new Set(movedIds);

    activeMove.current = {
      axis,
      totalAngle: angle,
      currentAngle: 0,
      affectedIds,
      preMoveCubies,
      done: false,
    };

    prevCubies.current = cubies;
  }, [cubies]);

  useFrame(() => {
    const move = activeMove.current;
    if (!move) return;

    // done フラグが立っている = Cubie が totalAngle で1フレーム描画済み → 安全にクリア
    if (move.done) {
      activeMove.current = null;
      return;
    }

    const remaining = move.totalAngle - move.currentAngle;

    if (remaining < 0.001) {
      // 完了: totalAngle に固定し done フラグを立てる
      // → 次フレームで null になる（その間 Cubie は最終位置を描画する）
      move.currentAngle = move.totalAngle;
      move.done = true;
      return;
    }

    // easeOutQuad: 終盤にかけて自然に減速する
    const progress = move.currentAngle / move.totalAngle;
    const speed = ANIM_SPEED * (1 - progress * 0.5) + 0.01;
    move.currentAngle += Math.min(remaining, remaining * speed * 3);
  });

  return (
    <group>
      {cubies.map(c => (
        <Cubie key={c.id} state={c} activeMove={activeMove} />
      ))}

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
