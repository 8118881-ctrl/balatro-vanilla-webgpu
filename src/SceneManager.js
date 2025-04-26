import * as THREE from 'three/webgpu';
import { Slot } from './Slot';
import { RaycastManager } from './RaycastManager';
import Balatro from './Balatro';


export default class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    
    const aspect = window.innerWidth / window.innerHeight;
    this.frustrumSize = 10;

    this.camera = new THREE.OrthographicCamera(
      (-aspect * this.frustrumSize) / 2,
      (aspect * this.frustrumSize) / 2,
      this.frustrumSize / 2,
      -this.frustrumSize / 2,
      0.1,
      1000
    );

    this.camera.position.z = 5;
    this.renderer = new THREE.WebGPURenderer({antialias: true});
    this.renderer.setPixelRatio(2)
    this.renderer.outputColorSpace = THREE.ColorSp;
    this.slot = null;
    this.balatro = null;
    
    this.raycastManager = new RaycastManager(this.camera, this.scene, this.renderer.domElement);
  }

  async init() {
    await this.renderer.init();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.addLights();
    const slot = new Slot(this.scene, this.raycastManager, this.camera, this.renderer.domElement);
    const balatro = new Balatro(this.scene, this.camera, this.renderer.domElement);
    slot.init();
    balatro.init();
    this.slot = slot;
    this.balatro = balatro;
  }

  addLights() {
    const light = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(light);
  }

  update(clock) {
    this.slot.update(clock);
    this.renderer.render(this.scene, this.camera);
    this.balatro.update(clock);
  }

  onResize() {
      const aspect = window.innerWidth / window.innerHeight;
  
      this.camera.left = (-aspect * this.frustrumSize) / 2;
      this.camera.right = (aspect * this.frustrumSize) / 2;
      this.camera.top = this.frustrumSize / 2;
      this.camera.bottom = -this.frustrumSize / 2;
  
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
