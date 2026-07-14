import { renderer, camera, controls, scene } from './setup.js';
import { setDay, setNight, setLampIntensity } from './lighting.js';

export function setupUI(dimsGroup) {
  document.getElementById('btnDay').onclick = setDay;
  document.getElementById('btnNight').onclick = setNight;
  document.getElementById('btnDims').onclick = () => { dimsGroup.visible = !dimsGroup.visible; };

  // slider de intensidad de las luces (en vivo)
  const lightSlider = document.getElementById('lightSlider');
  const lightVal = document.getElementById('lightVal');
  lightSlider.addEventListener('input', () => {
    lightVal.textContent = lightSlider.value;
    setLampIntensity(+lightSlider.value);
  });

  // ---------- resize ----------
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  document.getElementById('loading').style.display = 'none';
  window.__cam = camera; window.__controls = controls; // hook para screenshots

  // ---------- loop ----------
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}
