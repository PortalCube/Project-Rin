import * as THREE from "three";
import { FOV, GROUND_LEVEL } from "../setting.js";
import { RinEngine } from "../engine.js";
import { Log } from "../log.js";
import { RinInput } from "../input.js";
import { clamp, rotateVector3 } from "../util.js";
import { Entity } from "./entity.js";

import selectionVertexShader from "../../assets/shaders/selection.vert?raw";
import selectionFragmentShader from "../../assets/shaders/selection.frag?raw";
import { raycast } from "../raycast.js";

const MIN_VERTICAL_ANGLE_VALUE = Math.PI / -2;
const MAX_VERTICAL_ANGLE_VALUE = Math.PI / 2;

const selection = new THREE.Mesh(
    new THREE.BoxGeometry(1.001, 1.001, 1.001),
    new THREE.ShaderMaterial({
        vertexShader: selectionVertexShader,
        fragmentShader: selectionFragmentShader,
        transparent: true,
    })
);

export class Player extends Entity {
    /**
     * @type {THREE.PerspectiveCamera}
     */
    instance = null;

    moveSpeed = 5;
    runSpeed = 7.5;
    lookSpeed = (Math.PI * 2) / 12;

    horizontalAngle = 0;
    verticalAngle = 0;

    get position() {
        return this.instance.position;
    }

    get blockPosition() {
        return new THREE.Vector3(
            Math.floor(this.position.x),
            Math.floor(this.position.y),
            Math.floor(this.position.z)
        );
    }

    /**
     * 플레이어를 생성합니다.
     * @param {RinScene} scene
     */
    constructor(scene) {
        super(scene);

        // 원근 투영 카메라를 생성하여 player의 main instance로 사용
        this.scene.camera = new THREE.PerspectiveCamera(
            FOV,
            RinEngine.ratio,
            0.1,
            1000
        );

        this.instance = scene.camera;
        this.instance.position.z = 3;
        this.instance.position.y = GROUND_LEVEL + 2;

        this.scene.scene.add(selection);
    }

    onFrameUpdate(deltaTime) {
        // Log.info("카메라 프레임 업데이트", deltaTime);

        // 카메라 이동
        this.cameraMovement(deltaTime);

        // 플레이어 이동
        this.playerMovement(deltaTime);

        const pointingBlock = this.getPointingBlock();

        if (RinInput.getPointerDown(2)) {
            Log.info(pointingBlock.point);
        }

        if (pointingBlock) {
            selection.position.copy(pointingBlock.coordinate);

            if (RinInput.getPointerDown(0)) {
                const x = pointingBlock.coordinate.x;
                const y = pointingBlock.coordinate.y;
                const z = pointingBlock.coordinate.z;

                this.scene.world.setBlock(x, y, z, 0);
            }
        }

        // 디버그 로그 띄우기
        if (RinInput.getKeyDown("Backquote")) {
            Log.info(this.instance.position);
            Log.info(RinEngine.renderer.info);
            Log.info(RinEngine.renderer.info.render);
        }

        // 포인터 잠금 toggle
        if (RinInput.getKeyDown("Space")) {
            RinInput.setPointerLock(!RinInput.pointerLock);
        }
    }

    playerMovement(deltaTime) {
        const inputDirection = new THREE.Vector3(0, 0, 0);
        let runSpeed = 1;

        // z축 이동
        if (RinInput.getKey("KeyW")) {
            inputDirection.z -= 1;
        }

        if (RinInput.getKey("KeyS")) {
            inputDirection.z += 1;
        }

        // x축 이동
        if (RinInput.getKey("KeyA")) {
            inputDirection.x -= 1;
        }

        if (RinInput.getKey("KeyD")) {
            inputDirection.x += 1;
        }

        // y축 이동
        if (RinInput.getKey("KeyQ")) {
            inputDirection.y -= 1;
        }

        if (RinInput.getKey("KeyE")) {
            inputDirection.y += 1;
        }

        // 달리기
        if (RinInput.getKey("ShiftLeft")) {
            runSpeed = this.runSpeed;
        }

        // 이동 벡터를 플레이어가 보는 방향으로 회전
        const direction = rotateVector3(inputDirection, this.horizontalAngle);

        // 이동 벡터를 적절한 속도로 지정
        const vec = direction
            .normalize()
            .multiplyScalar(deltaTime * this.moveSpeed * runSpeed);

        // 플레이어 이동
        this.instance.position.add(vec);
    }

    cameraMovement(deltaTime) {
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

    /**
     * 현재 바라보고 있는 블록의 좌표를 반환합니다.
     * 블록을 파괴할 때 유용합니다.
     * @returns {THREE.Vector3}
     */
    getPointingBlock() {
        if (this.scene.world.mesh === null) {
            return null;
        }

        // const raycaster = new THREE.Raycaster(
        //     this.instance.position,
        //     this.instance.getWorldDirection(new THREE.Vector3()),
        //     0,
        //     15
        // );

        // raycaster.setFromCamera({ x: 0, y: 0 }, this.instance);

        // const intersects = raycaster.intersectObject(this.scene.world.mesh);

        const position = this.instance.position;
        const direction = this.instance.getWorldDirection(new THREE.Vector3());

        const intersect = raycast(this.scene.world, position, direction);

        if (intersect === null) {
            return null;
        }

        const point = intersect.point;
        const distance = intersect.distance;
        const coordinate = intersect.coordinate;

        return { point, distance, coordinate };
    }

    /**
     * 현재 바라보고 있는 빈 공간의 좌표를 반환합니다.
     * 블록을 설치할 때 유용합니다.
     * @returns {THREE.Vector3}
     */
    getPointingSpace() {}
}
