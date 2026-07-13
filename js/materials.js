import * as THREE from 'three';
import { loadTex } from './setup.js';

// ---------- textura de alambrado (chain-link) — compartida por jaula, corredor y reja ----------
function makeFenceTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(210,215,220,0.9)';
  ctx.lineWidth = 3;
  for (let i = -128; i < 256; i += 16) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 128, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 128); ctx.lineTo(i + 128, 0); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
export const fenceTex = makeFenceTexture();
export const fenceMat = new THREE.MeshStandardMaterial({
  map: fenceTex, transparent: true, alphaTest: 0.25,
  side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5, color: 0xcfd6dd
});

export function fencePanel(len, height, repeat) {
  const t = fenceTex.clone();
  t.needsUpdate = true;
  t.repeat.set(repeat, height / 2);
  const mat = fenceMat.clone();
  mat.map = t;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, height), mat);
  return mesh;
}

// ---------- metal real (Poly Haven CC0) para caños/postes/torres ----------
const metalRep = [1, 4];
const metalArm = loadTex('metal_plate_02_arm_1k.jpg', false, metalRep[0], metalRep[1]);
export const postMat = new THREE.MeshStandardMaterial({
  map: loadTex('metal_plate_02_diff_1k.jpg', true, metalRep[0], metalRep[1]),
  normalMap: loadTex('metal_plate_02_nor_gl_1k.jpg', false, metalRep[0], metalRep[1]),
  roughnessMap: metalArm, metalnessMap: metalArm,
  color: 0x9aa1ab, roughness: 1, metalness: 1,
});

// ---------- marco oscuro para portones (compartido entre jaula y corredor) ----------
export const gateFrameMat = new THREE.MeshStandardMaterial({ color: 0x2a2e33, metalness: 0.5, roughness: 0.5 });
