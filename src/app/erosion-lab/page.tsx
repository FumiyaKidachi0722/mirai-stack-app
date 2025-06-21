'use client';

import { useEffect, useRef, useState } from 'react';

import RangeControl from '@/presentation/components/RangeControl';

/** Grid and simulation constants */
// Finer grid for smoother appearance
const GRID_SIZE = 80;
const CELL_SIZE = 6; // pixel per cell
const FLOW_FACTOR = 0.25;
const EROSION_RATE = 0.02;

/** Terrain cell with ground height and water depth */
interface Cell {
  h: number;
  w: number;
}
type Terrain = Cell[][];

function createTerrain(): Terrain {
  const t: Terrain = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const base = 1 - (y / GRID_SIZE) * 0.8; // gentle slope
      row.push({ h: base + Math.random() * 0.2, w: 0 });
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
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = withRain[y][x];
      let water = cell.w;
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
          flow[y][x] -= amt;
          flow[ny][nx] += amt;
          out[y][x] += amt;
          water -= amt;
        }
      }
    }
  }
  const res = cloneTerrain(withRain);
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const change = flow[y][x];
      res[y][x].w = Math.max(0, res[y][x].w + change);
      res[y][x].h = Math.max(0, res[y][x].h - out[y][x] * EROSION_RATE);
    }
  }
  return res;
}

function draw(ctx: CanvasRenderingContext2D, t: Terrain) {
  ctx.clearRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
  // draw ground first
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const { h } = t[y][x];
      const g = Math.floor(160 * h + 40);
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
