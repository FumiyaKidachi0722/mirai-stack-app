'use client';

import { useEffect, useRef, useState } from 'react';

import RangeControl from '@/presentation/components/RangeControl';

/** Grid and simulation constants */
// Finer grid for smoother appearance
const GRID_SIZE = 80;
const CELL_SIZE = 6; // pixel per cell
const FLOW_FACTOR = 0.4;
const EROSION_RATE = 0.05;
const SLOPE_FACTOR = 0.15;
const INFILTRATION_RATE = 0.0005;
const DEPOSITION_RATE = 0.01;
const SMOOTHING = 0.1;

/** Terrain cell with ground height and water depth */
interface Cell {
  h: number; // ground height
  w: number; // water depth
  s: number; // sediment amount
}
type Terrain = Cell[][];

const RIVER_WIDTH = 6;
const RIVER_DEPTH = 0.3;
const RIVER_AMPLITUDE = GRID_SIZE * 0.1;
const RIVER_FREQUENCY = 2; // waves from top to bottom

function createTerrain(): Terrain {
  const t: Terrain = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Cell[] = [];
    const centerX =
      GRID_SIZE / 2 +
      RIVER_AMPLITUDE * Math.sin(((y / GRID_SIZE) * Math.PI * 2) * RIVER_FREQUENCY);
    for (let x = 0; x < GRID_SIZE; x++) {
      let base = 1 - (y / GRID_SIZE) * 0.6; // gentle slope downstream
      if (Math.abs(x - centerX) < RIVER_WIDTH) {
        base -= 0.3; // carve riverbed
      }
      const inRiver = Math.abs(x - centerX) < RIVER_WIDTH / 2;
      const water = inRiver ? RIVER_DEPTH : 0;
      row.push({ h: base + Math.random() * 0.05, w: water, s: 0 });
    }
    t.push(row);
  }
  return t;
}

function cloneTerrain(t: Terrain): Terrain {
  return t.map((row) => row.map((c) => ({ ...c })));
}

/** Single simulation step with rainfall and water flow */
function step(t: Terrain, rain: number): Terrain {
  const withRain = cloneTerrain(t);
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      withRain[y][x].w += rain;
    }
  }
  const flow: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0)
  );
  const out: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0)
  );
  const sedOut: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0)
  );
  const inFlow: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0)
  );
  const inSed: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0)
  );
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = withRain[y][x];
      let water = cell.w;
      let sed = cell.s;
      const neighbors: [number, number][] = [];
      if (y > 0) neighbors.push([y - 1, x]);
      if (y < GRID_SIZE - 1) neighbors.push([y + 1, x]);
      if (x > 0) neighbors.push([y, x - 1]);
      if (x < GRID_SIZE - 1) neighbors.push([y, x + 1]);
      const level = cell.h + water;
      for (const [ny, nx] of neighbors) {
        if (water <= 0) break;
        const nLevel = withRain[ny][nx].h + withRain[ny][nx].w;
        const diff = level - nLevel;
        if (diff > 0) {
          const amt = Math.min(water, diff * FLOW_FACTOR);
          const sedAmt = water > 0 ? (sed * amt) / water : 0;
          flow[y][x] -= amt;
          flow[ny][nx] += amt;
          out[y][x] += amt;
          inFlow[ny][nx] += amt;
          sedOut[y][x] += sedAmt;
          inSed[ny][nx] += sedAmt;
          water -= amt;
          sed -= sedAmt;
        }
      }
      // store remaining sediment after distributing
      withRain[y][x].s = sed;
    }
  }
  const res = cloneTerrain(withRain);
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const change = flow[y][x];
      res[y][x].w = Math.max(0, res[y][x].w + change - INFILTRATION_RATE);
      res[y][x].s = Math.max(0, res[y][x].s - sedOut[y][x] + inSed[y][x]);

      // calculate average downhill slope
      const h = res[y][x].h;
      let slopeSum = 0;
      let count = 0;
      if (y > 0) {
        const d = h - res[y - 1][x].h;
        if (d > 0) slopeSum += d;
        count++;
      }
      if (y < GRID_SIZE - 1) {
        const d = h - res[y + 1][x].h;
        if (d > 0) slopeSum += d;
        count++;
      }
      if (x > 0) {
        const d = h - res[y][x - 1].h;
        if (d > 0) slopeSum += d;
        count++;
      }
      if (x < GRID_SIZE - 1) {
        const d = h - res[y][x + 1].h;
        if (d > 0) slopeSum += d;
        count++;
      }
      const slope = count > 0 ? slopeSum / count : 0;

      const erosion = out[y][x] * (EROSION_RATE + slope * SLOPE_FACTOR);
      res[y][x].h = Math.max(0, res[y][x].h - erosion);
      res[y][x].s += erosion;
      if (inFlow[y][x] > 0) {
        res[y][x].h += inFlow[y][x] * DEPOSITION_RATE;
      }
      const deposit = res[y][x].s * DEPOSITION_RATE * Math.max(0, 1 - slope);
      res[y][x].h += deposit;
      res[y][x].s -= deposit;
    }
  }
  return smooth(res, SMOOTHING);
}

function smooth(t: Terrain, amt: number): Terrain {
  const s = cloneTerrain(t);
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      let sum = t[y][x].h;
      let count = 1;
      if (y > 0) {
        sum += t[y - 1][x].h;
        count++;
      }
      if (y < GRID_SIZE - 1) {
        sum += t[y + 1][x].h;
        count++;
      }
      if (x > 0) {
        sum += t[y][x - 1].h;
        count++;
      }
      if (x < GRID_SIZE - 1) {
        sum += t[y][x + 1].h;
        count++;
      }
      const avg = sum / count;
      s[y][x].h = t[y][x].h * (1 - amt) + avg * amt;
    }
  }
  return s;
}

function draw(ctx: CanvasRenderingContext2D, t: Terrain) {
  ctx.clearRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
  // draw ground first
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const { h, s } = t[y][x];
      const g = Math.floor(160 * h + 40 + s * 80);
      ctx.fillStyle = `rgb(${g}, ${g}, 120)`;
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
  // overlay water separately for smoother blending
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const { w } = t[y][x];
      if (w > 0.001) {
        const a = Math.min(1, w);
        ctx.fillStyle = `rgba(30, 144, 255, ${a})`;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 0.25;
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
}

export default function ErosionLabPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [terrain, setTerrain] = useState<Terrain>(() => createTerrain());
  const [running, setRunning] = useState(false);
  const [rain, setRain] = useState(0.02);
  const [raise, setRaise] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    draw(ctx, terrain);
  }, [terrain]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTerrain((t) => step(t, rain));
    }, 100);
    return () => clearInterval(id);
  }, [running, rain]);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!raise) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    setTerrain((t) => {
      const n = cloneTerrain(t);
      n[y][x].h = Math.min(2, n[y][x].h + 0.2);
      return n;
    });
  }

  function reset() {
    setRunning(false);
    setTerrain(createTerrain());
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-xl font-bold">川の侵食ラボ</h1>
      <p className="text-sm text-gray-600 max-w-md text-center">
        雨量を調整して水の流れと侵食を観察しましょう。&quot;Raise ground&quot;を
        チェックした状態でキャンバスをクリックすると地面を盛り上げます。
      </p>
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        onClick={handleCanvasClick}
        className="border border-gray-300"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="px-4 py-2 rounded bg-blue-500 text-white"
          onClick={() => setRunning((r) => !r)}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button className="px-4 py-2 rounded bg-gray-300" onClick={reset}>
          Reset
        </button>
        <RangeControl
          label="Rainfall"
          min={0}
          max={0.05}
          step={0.005}
          value={rain}
          onChange={setRain}
        />
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={raise}
            onChange={(e) => setRaise(e.target.checked)}
          />
          Raise ground
        </label>
      </div>
    </div>
  );
}
