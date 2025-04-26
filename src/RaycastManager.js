import * as THREE from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

export class RaycastManager {
  constructor(camera, scene, domElement) {
    this.camera = camera;
    this.scene = scene;
    this.domElement = domElement;

    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.interactiveMeshes = [];
    this.lastHoveredMesh = null;  // Track the last hovered mesh

    console.log('DOM element used for interaction:', this.domElement);

    this.initBVHPatch();

    this.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.domElement.addEventListener('click', this.onClick.bind(this));
    this.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.domElement.addEventListener('pointerup', this.onPointerUp.bind(this));

  }

  initBVHPatch() {
    THREE.Mesh.prototype.raycast = acceleratedRaycast;
  }

  addMesh(mesh) {
    if (!mesh.geometry.boundsTree) {
      mesh.geometry.computeBoundsTree = computeBoundsTree;
      mesh.geometry.disposeBoundsTree = disposeBoundsTree;
      mesh.geometry.computeBoundsTree();
    }

    this.interactiveMeshes.push(mesh);
  }

  onPointerMove(event) {
    this.mouse.x = (event.clientX / this.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.domElement.clientHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, true);

    if (intersects.length > 0) {
      const firstHit = intersects[0].object;

      if (this.lastHoveredMesh !== firstHit) {
        if (this.lastHoveredMesh && this.lastHoveredMesh.userData.onPointerLeave) {
          this.lastHoveredMesh.userData.onPointerLeave(this.lastHoveredMesh);
        }

        console.log('[Raycast Hit]', firstHit.name || firstHit);
        if (firstHit.userData.onPointerEnter) {
          firstHit.userData.onPointerEnter(firstHit);
        }

        this.lastHoveredMesh = firstHit;
      }
    } else if (this.lastHoveredMesh) {
      if (this.lastHoveredMesh.userData.onPointerLeave) {
        this.lastHoveredMesh.userData.onPointerLeave(this.lastHoveredMesh);
      }
      this.lastHoveredMesh = null;
    }
  }

  onClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, true);

    if (intersects.length > 0) {
      const firstHit = intersects[0].object;
      console.log('[Raycast Hit]', firstHit.name || firstHit);

      if (firstHit.userData.onClick) {
        firstHit.userData.onClick(firstHit);
      }
    }
  }
  
  onPointerDown(event) {
    this.mouse.x = (event.clientX / this.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.domElement.clientHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
  
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, true);
    if (intersects.length > 0) {
      const firstHit = intersects[0].object;
      if (firstHit.userData.onPointerDown) {
        firstHit.userData.onPointerDown(event);
      }
    }
  }
  
  onPointerUp(event) {
    this.mouse.x = (event.clientX / this.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.domElement.clientHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
  
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, true);
    if (intersects.length > 0) {
      const firstHit = intersects[0].object;
      if (firstHit.userData.onPointerUp) {
        firstHit.userData.onPointerUp(event);
      }
    }
  }

}
