import * as THREE from 'three';
import { scene } from './setup.js';
import { W, H, COURT_OFFSET, fenceH } from './config.js';
import { fenceTex, fenceMat, fencePanel, postMat, gateFrameMat } from './materials.js';

// ---------- cerco del rectángulo central entre canchas (anti-robo) + puerta ----------
// los lados largos ya los cierran los alambrados de las dos canchas;
// solo hay que cerrar las dos puntas (en X)
function corrPost(x, z) {
  const h = fenceH + 0.3;
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, h, 10), postMat);
  p.position.set(x, h / 2, z); p.castShadow = true; scene.add(p);
}

export function buildCorridorFence() {
  const corrZ1 = H / 2;                 // alambrado cancha 1
  const corrZ2 = COURT_OFFSET - H / 2;  // alambrado cancha 2
  const corrLen = corrZ2 - corrZ1;
  const corrCz = (corrZ1 + corrZ2) / 2;
  const corrXend = W / 2;
  const dwc = 2.4;                      // ancho de la puerta

  // punta del fondo (-X): cerrada (detrás de la cantina)
  {
    const panel = fencePanel(corrLen, fenceH, corrLen / 2);
    panel.rotation.y = Math.PI / 2;
    panel.position.set(-corrXend, fenceH / 2, corrCz);
    scene.add(panel);
    corrPost(-corrXend, corrZ1); corrPost(-corrXend, corrZ2);
  }

  // punta del frente (+X): con puerta
  {
    const sideLen = (corrLen - dwc) / 2;
    [-1, 1].forEach(s => {
      const panel = fencePanel(sideLen, fenceH, sideLen / 2);
      panel.rotation.y = Math.PI / 2;
      panel.position.set(corrXend, fenceH / 2, corrCz + s * (dwc / 2 + sideLen / 2));
      scene.add(panel);
    });
    corrPost(corrXend, corrZ1); corrPost(corrXend, corrZ2);
    corrPost(corrXend, corrCz - dwc / 2); corrPost(corrXend, corrCz + dwc / 2);

    // portón (abre hacia adentro)
    const cgate = new THREE.Group();
    const pA = new THREE.Mesh(new THREE.BoxGeometry(0.12, fenceH, 0.12), gateFrameMat); pA.position.set(0, fenceH / 2, 0);
    const pB = new THREE.Mesh(new THREE.BoxGeometry(0.12, fenceH, 0.12), gateFrameMat); pB.position.set(0, fenceH / 2, dwc);
    const tp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, dwc), gateFrameMat); tp.position.set(0, fenceH, dwc / 2);
    const bt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, dwc), gateFrameMat); bt.position.set(0, 0.06, dwc / 2);
    [pA, pB, tp, bt].forEach(p => { p.castShadow = true; cgate.add(p); });
    const t = fenceTex.clone(); t.needsUpdate = true; t.repeat.set(dwc / 2, fenceH / 2);
    const mat = fenceMat.clone(); mat.map = t;
    const gmesh = new THREE.Mesh(new THREE.PlaneGeometry(dwc, fenceH), mat);
    gmesh.rotation.y = Math.PI / 2; gmesh.position.set(0, fenceH / 2, dwc / 2);
    cgate.add(gmesh);
    cgate.position.set(corrXend, 0, corrCz - dwc / 2); // bisagra
    cgate.rotation.y = -1.0;                            // abierto hacia adentro
    scene.add(cgate);
  }
}
