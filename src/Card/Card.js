import {
  PlaneGeometry,
  Mesh,
  TextureLoader,
  MeshBasicNodeMaterial,
  SRGBColorSpace,
  NearestFilter,
  Group,
  Vector2,
  Plane,
  Vector3,
  Raycaster,
} from "three/webgpu";
import { uniform, float, vec2 } from "three/tsl";
import { polychromeShader } from "./PolychromeShader";
import { damp } from "three/src/math/MathUtils.js";
import { gsap } from "gsap";

export class Card {
  constructor(scene, raycastManager, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.raycastManager = raycastManager;

    this.mesh = null;
    this.group = new Group();
    this.uTimeUniform = uniform(float(0));
    this.uRotationUniform = uniform(vec2(0, 0));

    this.isHovered = false;
    this.isSelected = false;
    this.isDragging = false;
    this.dragOffset = new Vector3();
    this.basePosition = new Vector3(0,0,0);
    this.prevGroupPosition = new Vector3();
    this.velocity = new Vector2();
    this.isMoving = false;

    this.pointer = new Vector2();
    this.plane = new Plane(new Vector3(0, 0, 1), 0);
    this.raycaster = new Raycaster();
    this.normalizedPointer = new Vector2();
  }

  init() {
    const tex = new TextureLoader().load("/joker.webp");
    tex.colorSpace = SRGBColorSpace;
    tex.minFilter = NearestFilter;
    tex.magFilter = NearestFilter;

    const colorNode = polychromeShader(
      tex,
      this.uTimeUniform,
      this.uRotationUniform,
    );

    const material = new MeshBasicNodeMaterial({
      colorNode: colorNode(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });

    const geometry = new PlaneGeometry(73 / 60, 97 / 60);
    this.mesh = new Mesh(geometry, material);
    this.mesh.name = "CardMesh";

    this.mesh.userData.onClick = () => this.toggleSelect();
    this.mesh.userData.onPointerEnter = () => this.onHover(true);
    this.mesh.userData.onPointerLeave = () => this.onHover(false);
    this.mesh.userData.onPointerDown = (event) => this.startDrag(event);
    this.mesh.userData.onPointerUp = () => this.endDrag();

    this.raycastManager.addMesh(this.mesh);
    this.group.add(this.mesh);
    this.scene.add(this.group);

    this.initListeners();
  }

  initListeners() {
    this.domElement.addEventListener("pointermove", (event) =>
      this.onPointerMove(event),
    );
    this.domElement.addEventListener("pointerup", () => this.endDrag());
  }

  onHover(state) {
    this.isHovered = state;
    state ? this.shake() : (this.mesh.rotation.z = 0);
    state ? null : this.mesh.scale.set(1, 1, 1);
  }

  shake() {
    gsap.killTweensOf(this.mesh.rotation);

    const tl = gsap.timeline();
    const shakes = 4;
    const strength = 0.1;

    for (let i = 0; i < shakes; i++) {
      tl.to(this.mesh.rotation, {
        z: i % 2 === 0 ? strength : -strength,
        duration: 0.03,
        ease: "power2.inOut",
      });
    }

    tl.to(this.mesh.rotation, {
      z: 0,
      duration: 0.05,
      ease: "power2.out",
    });

    tl.to(
      this.mesh.scale,
      {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 0.2,
      },
      0,
    );
  }

  toggleSelect() {
    // this.mesh.material.opacity = this.isSelected ? 1.0 : 0.7;
  }

  startDrag(event) {
    this.isDragging = true;
    this.updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const intersection = new Vector3();
    this.raycaster.ray.intersectPlane(this.plane, intersection);
    this.dragOffset.copy(intersection).sub(this.group.position);
  }

  endDrag() {
    this.isDragging = false;
    console.log(this.basePosition)
  }

  onPointerMove(event) {
    this.updatePointer(event);
    if (!this.isDragging) return;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersection = new Vector3();
    if (this.raycaster.ray.intersectPlane(this.plane, intersection)) {
      this.group.position.copy(intersection.sub(this.dragOffset));
    }
  }

  updatePointer(event) {
    const bounds = this.domElement.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    this.pointer.x = x * 2 - 1;
    this.pointer.y = -y * 2 + 1;

    this._normalizedPointer = { x, y };
  }

  idle(time, delta) {
    if (!this.isDragging && !this.isHovered) {
      this.mesh.rotation.x = damp(
        this.mesh.rotation.x,
        Math.sin(time) * 0.3,
        8,
        delta,
      );
      this.mesh.rotation.y = damp(
        this.mesh.rotation.y,
        Math.cos(time) * 0.3,
        8,
        delta,
      );
    }
  }

  tilt(delta) {
    if (!this.isHovered || this.isDragging || !this._normalizedPointer) return;
    if (this.group.rotation.z > 0.1 || this.group.rotation.z < -0.1) return;

    const { x: pointerX, y: pointerY } = this._normalizedPointer;

    const cardPosition = this.mesh.getWorldPosition(new Vector3());
    cardPosition.project(this.camera);

    const cardScreenX = (cardPosition.x + 1) / 2;
    const cardScreenY = (-cardPosition.y + 1) / 2;

    const offsetX = pointerX - cardScreenX;
    const offsetY = pointerY - cardScreenY;

    const maxTilt = 3;
    const tiltX = offsetY * -2 * maxTilt;
    const tiltY = offsetX * 2 * maxTilt;

    this.mesh.rotation.y = damp(this.mesh.rotation.y, -tiltY, 8, delta);
    this.mesh.rotation.x = damp(this.mesh.rotation.x, tiltX, 8, delta);
  }

  updateVelocityAndRotation(delta) {
    this.velocity.x = this.group.position.x - this.prevGroupPosition.x;
    this.velocity.y = this.group.position.y - this.prevGroupPosition.y;

    this.group.rotation.z = damp(
      this.group.rotation.z,
      -this.velocity.x * 10,
      3,
      delta,
    );

    this.prevGroupPosition.copy(this.group.position);
  }
  
  returnToBasePosition(delta) {
    if(!this.isDragging){
      this.group.position.lerp(this.basePosition, 8 * delta);
    }
  }

  update(clock) {
    const delta = clock.delta;
    const time = clock.elapsedTime;
    this.uTimeUniform.value = time;
    this.uRotationUniform.value = new Vector2(
      this.mesh.rotation.y,
      -this.mesh.rotation.x,
    );

    this.updateVelocityAndRotation(delta);
    this.returnToBasePosition(delta);
    this.idle(time * 0.7, delta);
    this.tilt(delta);
  }
}
