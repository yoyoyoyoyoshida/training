// Simple predictable random number generator (Mulberry32)
// Seed deterministic RNG allows us to generate the exact same scramble globally without a backend.
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function getDailyScramble(): { scramble: string[], batchId: string } {
  // 6時間単位でブロックを切り替える
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const currentPeriod = Math.floor(Date.now() / SIX_HOURS_MS);
  const batchId = `BLOCK_${currentPeriod}`; // e.g. BLOCK_584983
  
  // Seed the PRNG with the current 6-hour period
  const rng = mulberry32(currentPeriod);
  
  const basicMoves = [
    'R', "R'", 'R2', 'L', "L'", 'L2', 
    'U', "U'", 'U2', 'D', "D'", 'D2', 
    'F', "F'", 'F2', 'B', "B'", 'B2'
  ];
  
  const scramble: string[] = [];
  let lastFace = '';
  
  // 生成（WCA基準に近い20手）
  for (let i = 0; i < 20; i++) {
    let nextMove;
    let nextFace;
    // 同じ面を連続して回す無駄なスクランブルを防止
    do {
      nextMove = basicMoves[Math.floor(rng() * basicMoves.length)];
      nextFace = nextMove[0];
    } while (nextFace === lastFace);
    
    scramble.push(nextMove);
    lastFace = nextFace;
  }
  
  return { scramble, batchId };
}
