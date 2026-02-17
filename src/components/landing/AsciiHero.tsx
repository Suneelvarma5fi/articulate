"use client";

import { useEffect, useRef } from "react";

// Uppercase alphabets ordered by visual density (thin to heavy)
const DENSITY = " ILTJYFCEPVXZKAHNRSUDGOQBMW";
// Flicker pool — all uppercase alphabets, randomly picked
const FLICKER_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const FLICKER_RATE = 0.65;
const TARGET_FPS = 10;

function runAsciiCanvas(cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let grid: number[][] = [];
  let cols = 0;
  let rows = 0;
  let charW = 0;
  let charH = 0;
  let fontSize = 0;
  let running = true;
  let imageLoaded = false;
  let resizeTimer: ReturnType<typeof setTimeout>;

  function setup() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    cvs.width = w * dpr;
    cvs.height = h * dpr;
    cvs.style.width = w + "px";
    cvs.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fontSize = w < 640 ? 6 : w < 1024 ? 8 : 10;
    ctx.font = `${fontSize}px "Geist Mono", "Courier New", monospace`;
    charW = ctx.measureText("M").width;
    charH = fontSize * 1.2;

    cols = Math.ceil(w / charW);
    rows = Math.ceil(h / charH);
  }

  function sampleImage(): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "/hero.png";
      img.onload = () => {
        const off = document.createElement("canvas");
        off.width = cols;
        off.height = rows;
        const offCtx = off.getContext("2d");
        if (!offCtx) return resolve();

        // Cover-fit: preserve aspect ratio, crop excess (no stretch)
        const imgAspect = img.width / img.height;
        const gridAspect = cols / rows;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (imgAspect > gridAspect) {
          // Image is wider — crop sides
          sw = img.height * gridAspect;
          sx = (img.width - sw) / 2;
        } else {
          // Image is taller — crop top/bottom
          sh = img.width / gridAspect;
          sy = (img.height - sh) / 2;
        }
        offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
        const data = offCtx.getImageData(0, 0, cols, rows).data;

        grid = [];
        for (let y = 0; y < rows; y++) {
          grid[y] = [];
          for (let x = 0; x < cols; x++) {
            const i = (y * cols + x) * 4;
            const brightness =
              (0.299 * data[i] +
                0.587 * data[i + 1] +
                0.114 * data[i + 2]) /
              255;
            grid[y][x] = brightness;
          }
        }
        imageLoaded = true;
        resolve();
      };
    });
  }

  function draw() {
    if (!imageLoaded) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    ctx.font = `${fontSize}px "Geist Mono", "Courier New", monospace`;
    ctx.textBaseline = "top";

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const b = grid[y]?.[x] ?? 0;
        if (b < 0.04) continue;

        const charIdx = Math.floor(b * (DENSITY.length - 1));
        let char = DENSITY[charIdx];

        if (Math.random() < FLICKER_RATE) {
          char =
            FLICKER_POOL[Math.floor(Math.random() * FLICKER_POOL.length)];
        }

        const alpha = b * 0.85 + 0.15;
        ctx.fillStyle = `rgba(230,230,230,${alpha.toFixed(2)})`;
        ctx.fillText(char, x * charW, y * charH);
      }
    }
  }

  async function init() {
    setup();
    await sampleImage();

    let lastFrame = 0;
    const interval = 1000 / TARGET_FPS;

    function animate(ts: number) {
      if (!running) return;
      if (ts - lastFrame >= interval) {
        draw();
        lastFrame = ts;
      }
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  init();

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setup();
      sampleImage();
    }, 200);
  }

  window.addEventListener("resize", onResize);

  return () => {
    running = false;
    clearTimeout(resizeTimer);
    window.removeEventListener("resize", onResize);
  };
}

export function AsciiHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    return runAsciiCanvas(cvs, ctx);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}
