/**
 * Motor de confete em canvas (sem dependências).
 * Partículas com gravidade, arrasto, rotação 3D simulada e "wobble" de papel.
 */

export type ConfettiKind = 'celebrate' | 'rain';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  tilt: number;
  vt: number;
  w: number;
  h: number;
  color: string;
  shape: 'rect' | 'circle' | 'ribbon';
  life: number;
  ttl: number;
  gravity: number;
  drag: number;
}

const CELEBRATE = ['#e5141d', '#ff4b52', '#2b9bf0', '#6cc3ff', '#ffffff', '#ffd23f'];
const RAIN = ['#e5141d', '#8a0d12', '#3b4466', '#ff4b52', '#1a2140'];

let canvas: HTMLCanvasElement | null = null;
let c2d: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let frame = 0;
let last = 0;

const rand = (a: number, b: number): number => a + Math.random() * (b - a);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)] as T;

const ensureCanvas = (): CanvasRenderingContext2D | null => {
  if (c2d && canvas?.isConnected) return c2d;
  canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  c2d = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  return c2d;
};

function resize(): void {
  if (!canvas || !c2d) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const spawn = (x: number, y: number, angle: number, spread: number, speed: number, colors: readonly string[]): Particle => {
  const a = angle + rand(-spread, spread);
  const v = speed * rand(0.55, 1.15);
  return {
    x,
    y,
    vx: Math.cos(a) * v,
    vy: Math.sin(a) * v,
    rot: rand(0, Math.PI * 2),
    vr: rand(-0.3, 0.3),
    tilt: rand(0, Math.PI * 2),
    vt: rand(0.05, 0.18),
    w: rand(6, 11),
    h: rand(9, 16),
    color: pick(colors),
    shape: pick(['rect', 'rect', 'circle', 'ribbon'] as const),
    life: 0,
    ttl: rand(2.6, 4.2),
    gravity: 900,
    drag: 0.985,
  };
};

const draw = (p: Particle, ctx: CanvasRenderingContext2D): void => {
  const fade = Math.min(1, (p.ttl - p.life) / 0.6);
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.scale(1, Math.cos(p.tilt)); // simula o papel girando
  ctx.fillStyle = p.color;
  if (p.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.shape === 'ribbon') {
    ctx.beginPath();
    ctx.moveTo(-p.w, -p.h / 2);
    ctx.quadraticCurveTo(0, -p.h / 2 - 5, p.w, -p.h / 2);
    ctx.lineTo(p.w, -p.h / 2 + 3);
    ctx.quadraticCurveTo(0, -p.h / 2 - 2, -p.w, -p.h / 2 + 3);
    ctx.fill();
  } else {
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
  }
  ctx.restore();
};

const loop = (now: number): void => {
  const ctx = c2d;
  if (!ctx || !canvas) return;
  const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
  last = now;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particles = particles.filter((p) => (p.life += dt) < p.ttl && p.y < window.innerHeight + 40);
  for (const p of particles) {
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.gravity * dt;
    p.x += p.vx * dt + Math.sin(p.tilt) * 0.6;
    p.y += p.vy * dt;
    p.rot += p.vr;
    p.tilt += p.vt;
    draw(p, ctx);
  }
  frame = particles.length ? requestAnimationFrame(loop) : 0;
  if (!frame) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
};

const start = (): void => {
  if (frame) return;
  last = performance.now();
  frame = requestAnimationFrame(loop);
};

export const fireConfetti = (kind: ConfettiKind): void => {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!ensureCanvas()) return;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const density = Math.max(0.55, Math.min(1, W / 1200));

  if (kind === 'celebrate') {
    // dois canhões laterais + uma explosão central
    const n = Math.round(110 * density);
    for (let i = 0; i < n; i++) particles.push(spawn(0, H * 0.85, -Math.PI / 3.2, 0.42, rand(900, 1500), CELEBRATE));
    for (let i = 0; i < n; i++) particles.push(spawn(W, H * 0.85, -Math.PI + Math.PI / 3.2, 0.42, rand(900, 1500), CELEBRATE));
    for (let i = 0; i < n * 0.8; i++) particles.push(spawn(W / 2, H * 0.42, -Math.PI / 2, Math.PI, rand(350, 850), CELEBRATE));
  } else {
    // chuva lenta vinda do topo: o "confete triste" da resposta errada
    const n = Math.round(90 * density);
    for (let i = 0; i < n; i++) {
      const p = spawn(rand(0, W), rand(-H * 0.4, -10), Math.PI / 2, 0.25, rand(40, 160), RAIN);
      p.gravity = 260;
      p.drag = 0.97;
      p.ttl = rand(3.2, 4.8);
      particles.push(p);
    }
  }
  start();
};
