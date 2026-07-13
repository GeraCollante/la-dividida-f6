import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { scene, renderer } from './setup.js';
import { lampTargets } from './towers.js';

// ---------- luces base ----------
const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x3a5a32, 0.8);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(35, 40, 60);
sun.target.position.set(0, 0, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -45; sun.shadow.camera.right = 45;
sun.shadow.camera.top = 55; sun.shadow.camera.bottom = -55;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 160;
sun.shadow.bias = -0.0003;
scene.add(sun); scene.add(sun.target);

// ---------- cielo HDRI (Poly Haven, CC0) + día/noche ----------
let envMap = null;
let dayMode = true;
let lampIntensity = 110;
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
new RGBELoader().load('textures/clarens_midday_1k.hdr', (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  envMap = pmrem.fromEquirectangular(hdr).texture;
  hdr.dispose(); pmrem.dispose();
  if (dayMode) setDay(); // aplicar entorno una vez cargado
});

export function setDay() {
  dayMode = true;
  scene.environment = envMap;                       // reflejos/iluminación reales
  scene.background = envMap || new THREE.Color(0x9ec9e8);
  scene.fog = new THREE.Fog(0xaecadb, 90, 220);
  renderer.toneMappingExposure = 1.0;
  sun.intensity = 2.0; hemi.intensity = 0.35;
  lampTargets.forEach(s => s.intensity = 0);
}
export function setNight() {
  dayMode = false;
  scene.environment = null;
  scene.background = new THREE.Color(0x070b16);
  scene.fog = new THREE.Fog(0x070b16, 50, 140);
  renderer.toneMappingExposure = 1.0;
  sun.intensity = 0.06; hemi.intensity = 0.09;
  lampTargets.forEach(s => s.intensity = lampIntensity * (s.userData.factor || 1));
}
export function setLampIntensity(value) {
  lampIntensity = value;
  if (!dayMode) lampTargets.forEach(s => s.intensity = lampIntensity * (s.userData.factor || 1));
}
