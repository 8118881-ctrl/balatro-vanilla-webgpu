import * as THREE from 'three/webgpu';
import { geometry } from 'maath';
import { Card } from './Card/Card';
export class Slot {
  constructor(scene, raycastManager, camera, domElement) {
    this.mesh = null;
    this.scene = scene;
    this.cards = [];
    this.raycastManager = raycastManager;
    this.camera = camera;
    this.domElement = domElement;
    
  }
  
  defineGeometry(){
    this.geometry = new geometry.RoundedPlaneGeometry(7, 1, 0.15)
    this.material = new THREE.MeshBasicMaterial({ color: 0x373737});
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.z = -1;
  }
  
  async init(){
    this.defineGeometry();
    // this.scene.add(this.mesh);
    const card = new Card(this.scene, this.raycastManager, this.camera, this.domElement);
    card.init();
    this.cards.push(card);
  }
  
  update(clock){
    this.cards.forEach(card => card.update(clock));
  }
}