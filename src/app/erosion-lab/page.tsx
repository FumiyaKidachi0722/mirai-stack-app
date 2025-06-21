"use client"

import { useRef, useEffect, useState } from "react";

const GRID_SIZE = 32;
const SCALE = 12; // pixel per cell

type Terrain = number[][];

function initTerrain(): Terrain {
  const t: Terrain = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: number[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const base = 1 - y / GRID_SIZE * 0.8; // gentle slope
      row.push(base + Math.random() * 0.2);
    }
    t.push(row);
  }
  return t;
}

function stepErosion(terrain: Terrain): Terrain {
  const t = terrain.map(row => row.slice());
  for (let y = 1; y < GRID_SIZE - 1; y++) {
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      const curr = terrain[y][x];
      let minN = curr;
      let minPos: [number, number] = [y, x];
      const neighbors: [number, number][] = [
        [y - 1, x],
        [y + 1, x],
        [y, x - 1],
        [y, x + 1],
      ];
      for (const [ny, nx] of neighbors) {
        if (terrain[ny][nx] < minN) {
          minN = terrain[ny][nx];
          minPos = [ny, nx];
        }
      }
      const diff = curr - minN;
      if (diff > 0) {
        const delta = diff * 0.05;
        t[y][x] -= delta;
        const [ny, nx] = minPos;
        t[ny][nx] += delta; // deposit
      }
    }
  }
  return t;
}

function drawTerrain(ctx: CanvasRenderingContext2D, terrain: Terrain) {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const h = terrain[y][x];
      const c = Math.floor(200 * h);
      ctx.fillStyle = `rgb(${c},${c},${255})`;
      ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    }
  }
}

export default function ErosionLabPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [terrain, setTerrain] = useState<Terrain>(() => initTerrain());
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    drawTerrain(ctx, terrain);
  }, [terrain]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTerrain((t) => stepErosion(t));
    }, 200);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-xl font-bold">川の侵食ラボ</h1>
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * SCALE}
        height={GRID_SIZE * SCALE}
        className="border border-gray-300"
      />
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => setRunning((r) => !r)}
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => {
            setRunning(false);
            setTerrain(initTerrain());
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

