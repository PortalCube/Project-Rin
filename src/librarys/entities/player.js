import * as THREE from "three";
import {
    CAMERA_FAR,
    CAMERA_FOV,
    CAMERA_NEAR,
    GROUND_MAX_LEVEL,
    PLAYER_SIZE,
} from "../setting.js";
import { RinEngine } from "../engine.js";
import { Log } from "../log.js";
import { RinInput } from "../input.js";
import { clamp, rotateVector3, round } from "../util.js";
import { Entity } from "./entity.js";

import selectionVertexShader from "../../assets/shaders/selection.vert?raw";
import selectionFragmentShader from "../../assets/shaders/selection.frag?raw";
import {
    checkCollision,
    getBlockCollision,
    getPlayerIntersectCoordinates,
    worldRaycast,
} from "../physics.js";

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

// xyz axis line
const axis = new THREE.AxesHelper(2);

// create wireframe
const geometry = new THREE.BoxGeometry(...PLAYER_SIZE);
// const geometry = new THREE.CylinderGeometry(...PLAYER_SIZE);
const wireframe = new THREE.WireframeGeometry(geometry);
const line = new THREE.LineSegments(wireframe);

export class Player extends Entity {
    /**
     * @type {THREE.PerspectiveCamera}
     */
    instance = null;

    active = false;

    range = 4;

    // 1초에 1블록 이동하는 속도를 지정
    baseSpeed = 100;

    // 날아다닐때 속도 배수
    flySpeedModifier = 1.5;

    inputVector = new THREE.Vector3(0, 0, 0);

    moveSpeed = 10000;
    maxSpeed = 400;
    maxRunSpeed = 1000;
    maxFallSpeed = 3000;
    jumpForce = 900;
    runSpeed = 2.5;
    lookSpeed = (Math.PI * 2) / 12;

    fly = false;
    jumpable = false;

    /**
     * @type {THREE.Vector3} 플레이어의 가속도
     */
    velocity = null;
    damping = 1 / (this.baseSpeed * 10);
    gravity = 9.80665 * 3 * this.baseSpeed;

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
            CAMERA_FOV,
            RinEngine.ratio,
            CAMERA_NEAR,
            CAMERA_FAR
        );

        this.instance = scene.camera;
        this.instance.position.z = 3;
        this.instance.position.y = GROUND_MAX_LEVEL + 1;

        this.velocity = new THREE.Vector3(0, 0, 0);

        this.scene.scene.add(axis);
        this.scene.scene.add(selection);
        this.scene.scene.add(line);
    }

    onFrameUpdate(deltaTime) {
        // Log.info("카메라 프레임 업데이트", deltaTime);

        if (this.active === false) {
            return;
        }

        // 카메라 이동
        this.cameraMovement(deltaTime);

        // 플레이어 이동 벡터 계산
        this.inputVector = this.movementInput(deltaTime);

        const pointingBlock = this.getPointingBlock();

        if (pointingBlock && pointingBlock.distance < this.range) {
            axis.visible = true;
            selection.visible = true;

            axis.position.copy(pointingBlock.point);
            selection.position.copy(pointingBlock.coordinate);

            if (RinInput.getPointerDown(0)) {
                const x = pointingBlock.coordinate.x;
                const y = pointingBlock.coordinate.y;
                const z = pointingBlock.coordinate.z;

                this.scene.world.setBlock(x, y, z, 0);
            }

            if (RinInput.getPointerDown(2)) {
                const normal = pointingBlock.normal;
                const coordinate = pointingBlock.coordinate.clone().add(normal);

                const intersects = getPlayerIntersectCoordinates(
                    this.instance.position
                );

                if (intersects.some((item) => item.equals(coordinate))) {
                    return;
                }

                const x = coordinate.x;
                const y = coordinate.y;
                const z = coordinate.z;

                this.scene.world.setBlock(x, y, z, 6);
            }
        } else {
            axis.visible = false;
            selection.visible = false;
        }

        // 디버그 로그 띄우기
        if (RinInput.getKeyDown("Backquote")) {
            Log.info(this.instance.position);
            Log.info(RinEngine.renderer.info);
            Log.info(RinEngine.renderer.info.render);
        }

        // 포인터 잠금 toggle
        if (RinInput.getKeyDown("KeyP")) {
            RinInput.setPointerLock(!RinInput.pointerLock);
        }

        // fly mode toggle
        if (RinInput.getKeyDown("KeyO")) {
            this.fly = !this.fly;
            this.jumpable = false;
        }

        line.position.copy(
            this.instance.position.clone().add(new THREE.Vector3(0, -0.5, 0))
        );
    }

    onFixedUpdate(fixedDeltaTime) {
        // 플레이어 이동
        this.playerMovement(fixedDeltaTime);
    }

    movementInput(deltaTime) {
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
        if (this.fly) {
            if (RinInput.getKey("KeyQ")) {
                inputDirection.y -= 1;
            }

            if (RinInput.getKey("KeyE")) {
                inputDirection.y += 1;
            }
        }

        // 달리기
        if (RinInput.getKey("ControlLeft")) {
            runSpeed = this.runSpeed;
        }

        // 점프
        if (RinInput.getKeyDown("Space") && this.jumpable) {
            this.velocity.y += this.jumpForce;
            this.jumpable = false;
        }

        // 이동 벡터를 플레이어가 보는 방향으로 회전
        const direction = rotateVector3(inputDirection, this.horizontalAngle);

        // 이동 벡터를 적절한 속도로 지정
        direction.normalize();
        direction.multiplyScalar(deltaTime * this.moveSpeed * runSpeed);

        return direction;
    }

    playerMovement(deltaTime) {
        // 플레이어 입력 벡터
        const inputVector = this.movementInput(deltaTime);

        // velocity에 이동 벡터 더하기
        this.velocity.add(inputVector);

        let maxSpeed = RinInput.getKey("ControlLeft")
            ? this.maxRunSpeed
            : this.maxSpeed;

        // 날아다니면 속도 배수 적용
        if (this.fly) {
            maxSpeed *= this.flySpeedModifier;
        }

        // 걸어다니는 경우, y 가속도를 별도로 관리
        let _yVelocity = this.velocity.y;

        // 걸어다니는 경우 y 가속도를 별도로 관리
        if (this.fly === false) {
            // 걸어다니면 y에 중력 가속도 적용
            _yVelocity -= this.gravity * deltaTime;

            // velocity 크기 제한시 y 가속도를 포함하여 계산하지 않도록 y를 0으로
            this.velocity.y = 0;

            // y 가속도 제한
            if (Math.abs(_yVelocity) > this.maxFallSpeed) {
                _yVelocity = Math.sign(_yVelocity) * this.maxFallSpeed;
            }
        }

        // 가속도 감속
        this.velocity.multiplyScalar(Math.pow(this.damping, deltaTime));

        // velocity 크기 제한
        if (this.velocity.length() > maxSpeed) {
            this.velocity.normalize().multiplyScalar(maxSpeed);
        }

        // 가속도가 0.1보다 작으면 0으로 지정
        if (this.velocity.length() < 0.1) {
            this.velocity.set(0, 0, 0);
        }

        // 걸어다니는 경우, 별도로 관리하던 y 속도를 velocity에 적용
        if (this.fly === false) {
            this.velocity.y = _yVelocity;
        }

        // y 가속도가 0이 아니면 점프 불가
        if (this.velocity.y !== 0) {
            this.jumpable = false;
        }

        // 가속도를 플레이어 position에 적용

        const vector = this.velocity
            .clone()
            .multiplyScalar((1 / this.baseSpeed) * deltaTime);

        this.instance.position.add(vector);

        // 충돌 체크 및 처리
        const collisions = checkCollision(
            this.instance.position,
            this.scene.world
        );

        for (const collision of collisions) {
            const normal = collision.normal;
            const distance = collision.distance;
            const inverse = normal.clone().multiplyScalar(distance);

            // 바닥 혹은 천장에 닿은 경우에 따라서, 점프 가능 여부와 y velocity를 조정
            if (normal.y > 0) {
                if (this.velocity.y < 0) {
                    this.velocity.y = 0;
                }
                this.jumpable = true;
            } else if (normal.y < 0) {
                if (this.velocity.y > 0) {
                    this.velocity.y = 0;
                }
            }

            this.instance.position.add(inverse);
        }

        const p = this.instance.position
            .clone()
            .add(new THREE.Vector3(0, -PLAYER_SIZE[1] * (3 / 4), 0));
        const v = this.velocity.clone();
        const messages = [
            `pos: (${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})`,
            `vel: (${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`,
            `speed: ${v.length().toFixed(6)}`,
            `jumpable: ${this.jumpable}`,
        ];

        Log.watch(messages.join("\n"));
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
     * 현재 바라보고 있는 블록의 정보를 반환합니다.
     * @returns {object | null}
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

        const intersects = worldRaycast(position, direction);

        for (const intersect of intersects) {
            const x = intersect.coordinate.x;
            const y = intersect.coordinate.y;
            const z = intersect.coordinate.z;

            const block = this.scene.world.getBlock(x, y, z);

            if (block && block.active) {
                const point = intersect.point;
                const distance = intersect.distance;
                const coordinate = intersect.coordinate;
                const normal = intersect.normal;

                return { point, distance, coordinate, normal };
            }
        }

        return null;
    }
}
