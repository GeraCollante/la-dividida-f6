import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { COURT_OFFSET } from './config.js';

// ---------- renderer ----------
export const canvas = document.getElementById('app');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // tope para celulares
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ---------- escena + cámara ----------
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(42, 30, 50);

export const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI / 2 - 0.04; // no pasar bajo el piso
controls.minDistance = 8;
controls.maxDistance = 160;
controls.target.set(0, 1, COURT_OFFSET / 2); // centro entre las dos canchas

// ---------- cargador de texturas PBR (Poly Haven, CC0) ----------
const texLoader = new THREE.TextureLoader();
export function loadTex(file, srgb, rx, ry) {
  const t = texLoader.load('textures/' + file);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
