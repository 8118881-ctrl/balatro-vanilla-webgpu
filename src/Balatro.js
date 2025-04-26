import * as THREE from 'three/webgpu'
import { balatroShader } from './BalatroShader';
import { float, uniform } from 'three/tsl';
export default class Balatro {
  constructor(scene, camera, domElement) {
    this.mesh = null;
    this.scene = scene;
    this.cards = [];
    this.camera = camera;
    this.domElement = domElement;
    this.iTime = uniform(float(0));
    this.iResolution = uniform(new THREE.Vector2(0, 0));
  }
  
  init() {
    const geometry = new THREE.PlaneGeometry(20,20);
    
    const colorNode = balatroShader(this.iTime, this.iResolution);
    const material = new THREE.MeshBasicNodeMaterial({
      colorNode: colorNode(),
      
    })
    
    material.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z -= 2;
    this.scene.add(this.mesh);
  }
  
  update(clock) {
    const time = clock.elapsedTime;
    this.iTime.value = time;
    this.iResolution.value = new THREE.Vector2(this.domElement.clientWidth, this.domElement.clientHeight);
  }

}