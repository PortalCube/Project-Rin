import * as THREE from "three";
import { FOV } from "../setting.js";
import { RinEngine } from "../engine.js";
import { Log } from "../log.js";
import { RinInput } from "../input.js";
import { clamp, rotateVector3 } from "../util.js";

const MIN_VERTICAL_ANGLE_VALUE = Math.PI / -2;
const MAX_VERTICAL_ANGLE_VALUE = Math.PI / 2;

export class Player {
    /**
     * @type {THREE.PerspectiveCamera}
     */
    instance = null;

    /**
     * @type {RinScene}
     */
    scene = null;

    moveSpeed = 5;
    lookSpeed = (Math.PI * 2) / 12;

    horizontalAngle = 0;
    verticalAngle = 0;

    /**
     * 플레이어를 생성합니다.
     * @param {RinScene} scene
     */
    constructor(scene) {
        this.scene = scene;

        // 원근 투영 카메라를 생성하여 player의 main instance로 사용
        this.scene.camera = new THREE.PerspectiveCamera(
            FOV,
            RinEngine.ratio,
            0.1,
            1000
        );

        this.instance = scene.camera;
        this.instance.position.z = 3;

        // 이벤트 등록
        // arrow function을 사용하여 this의 context를 Player로 유지
        scene.addEventListener("load", (event) => this.onLoad());
        scene.addEventListener("update", (event) =>
            this.onUpdate(event.deltaTime)
        );
        scene.addEventListener("frameUpdate", (event) =>
            this.onFrameUpdate(event.deltaTime)
        );
        scene.addEventListener("unload", (event) => this.onUnload());
    }

    onLoad() {}

    onUpdate(deltaTime) {
        // Log.info("카메라 업데이트", deltaTime);
    }

    onFrameUpdate(deltaTime) {
        // Log.info("카메라 프레임 업데이트", deltaTime);

        this.handleLook(deltaTime);
        this.handleMovement(deltaTime);

        if (RinInput.getKeyDown("KeyE")) {
            RinInput.setPointerLock(!RinInput.pointerLock);
        }

        // Log.info(RinInput.wheelDelta);
    }

    onUnload() {}

    handleMovement(deltaTime) {
        const inputDirection = new THREE.Vector3(0, 0, 0);

        if (RinInput.getKey("KeyW")) {
            inputDirection.z -= 1;
        }

        if (RinInput.getKey("KeyS")) {
            inputDirection.z += 1;
        }

        if (RinInput.getKey("KeyA")) {
            inputDirection.x -= 1;
        }

        if (RinInput.getKey("KeyD")) {
            inputDirection.x += 1;
        }

        const direction = rotateVector3(inputDirection, this.horizontalAngle);

        const vec = direction
            .normalize()
            .multiplyScalar(deltaTime * this.moveSpeed);
        this.instance.position.add(vec);
    }

    handleLook(deltaTime) {
        const dx = RinInput.pointerPosition.dx;
        const dy = RinInput.pointerPosition.dy;

        this.horizontalAngle -= dx * this.lookSpeed * deltaTime;
        this.verticalAngle -= dy * this.lookSpeed * deltaTime;

        this.verticalAngle = clamp(
            this.verticalAngle,
            MIN_VERTICAL_ANGLE_VALUE,
            MAX_VERTICAL_ANGLE_VALUE
        );

        this.instance.rotation.x = 0;
        this.instance.rotation.y = 0;
        this.instance.rotation.z = 0;

        this.instance.rotateY(this.horizontalAngle);
        this.instance.rotateX(this.verticalAngle);
    }
}
