import * as THREE from 'three';
import SceneManager from './SceneManager.js';

export default class App {
  constructor() {
    this.sceneManager = new SceneManager();
    this.clock = new THREE.Clock();
    this.onWindowResize = this.onWindowResize.bind(this);
  }

  async init() {
    if (!navigator.gpu) {
      document.body.innerHTML = 'WebGPU is not supported in your browser.';
      return;
    }

    await this.sceneManager.init();

    window.addEventListener('resize', this.onWindowResize);
    this.animate();
  }

  onWindowResize() {
    this.sceneManager.onResize();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.elapsedTime;
    this.sceneManager.update({ delta, elapsedTime });
  }
}
