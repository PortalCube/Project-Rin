import * as THREE from "three";
import {
    BLOCK_SET_DELAY,
    CAMERA_FAR,
    CAMERA_FOV,
    CAMERA_NEAR,
    GROUND_MAX_LEVEL,
    JUMP_DELAY,
    PLAYER_SIZE,
} from "../setting.js";
import { RinEngine } from "../engine.js";
import { Log } from "../log.js";
import { RinInput } from "../input.js";
import { clamp, rotateVector3 } from "../util.js";
import { Entity } from "./entity.js";

import selectionVertexShader from "../../assets/shaders/selection.vert?raw";
import selectionFragmentShader from "../../assets/shaders/selection.frag?raw";
import {
    checkCollision,
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
        depthTest: false,
    })
);

// xyz axis line
const axis = new THREE.AxesHelper(2);

// create wireframe
// const geometry = new THREE.BoxGeometry(...PLAYER_SIZE);
const geometry = new THREE.CylinderGeometry(
    PLAYER_SIZE[0] / 2,
    PLAYER_SIZE[0] / 2,
    PLAYER_SIZE[1]
);
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
    maxSwimFallSpeed = 1000;
    jumpForce = 830;
    swimJumpForce = 280;
    runSpeed = 2.5;
    swimSpeed = 0.6;
    lookSpeed = (Math.PI * 2) / 1200;

    jumpDelay = 0;
    blockDelay = 0;

    fly = true;
    swim = false;
    jumpable = false;

    /**
     * @type {THREE.Vector3} 플레이어의 가속도
     */
    velocity = null;
    damping = 1 / (this.baseSpeed * 10);
    swimDamping = 1 / (this.baseSpeed * 0.1);
    gravity = 9.80665 * 3 * this.baseSpeed;

    horizontalAngle = 0;
    verticalAngle = 0;

    quickSlot = [1, 2, 3, 4, 5, 12, 20, 45];
    currentSlot = 0;

    debugObjects = [];

    get position() {
        return this.instance.position;
    }

    get equippedBlock() {
        return this.quickSlot[this.currentSlot];
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
        this.instance.position.y = GROUND_MAX_LEVEL + 10;

        this.velocity = new THREE.Vector3(0, 0, 0);

        this.scene.scene.add(axis);
        this.scene.scene.add(selection);
        // this.scene.scene.add(line);
    }

    onFrameUpdate(deltaTime) {
        // Log.info("카메라 프레임 업데이트", deltaTime);

        if (this.active === false) {
            return;
        }

        // 카메라 이동
        this.cameraMovement(deltaTime);

        this.scrollInput(deltaTime);

        // 플레이어 이동 벡터 계산
        this.inputVector = this.movementInput(deltaTime);

        const pointingBlock = this.getPointingBlock();

        if (this.blockDelay > 0) {
            this.blockDelay -= deltaTime;
        }

        if (this.jumpDelay > 0) {
            this.jumpDelay -= deltaTime;
        }

        if (pointingBlock && pointingBlock.distance < this.range) {
            axis.visible = true;
            selection.visible = true;

            axis.position.copy(pointingBlock.point);
            selection.position.copy(pointingBlock.coordinate);

            if (
                RinInput.getPointerDown(0) ||
                (this.blockDelay <= 0 && RinInput.getPointer(0))
            ) {
                const x = pointingBlock.coordinate.x;
                const y = pointingBlock.coordinate.y;
                const z = pointingBlock.coordinate.z;

                this.scene.world.setBlock(x, y, z, 0);

                this.blockDelay = BLOCK_SET_DELAY;
            }

            if (
                RinInput.getPointerDown(2) ||
                (this.blockDelay <= 0 && RinInput.getPointer(2))
            ) {
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

                this.scene.world.setBlock(x, y, z, this.equippedBlock);

                this.blockDelay = BLOCK_SET_DELAY;
            }
        } else {
            axis.visible = false;
            selection.visible = false;
        }

        // 디버그 로그 띄우기
        if (RinInput.getKeyDown("Backquote")) {
            Log.info(this.instance.position);
            if (pointingBlock) {
                Log.info(pointingBlock.coordinate);
            }
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

        // collision wireframe
        line.position.copy(
            this.instance.position
                .clone()
                .add(new THREE.Vector3(0, -PLAYER_SIZE[1] * (1 / 4), 0))
        );
    }

    onFixedUpdate(fixedDeltaTime) {
        if (this.debugObjects.length > 0) {
            for (const obj of this.debugObjects) {
                if (obj.geometry) {
                    obj.geometry.dispose();
                }

                if (obj.material) {
                    obj.material.dispose();
                }

                this.scene.scene.remove(obj);
            }
            this.debugObjects = [];
        }

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
        if (RinInput.getKey("ShiftLeft")) {
            runSpeed = this.runSpeed;
        }

        // 점프
        if (RinInput.getKey("Space") && this.jumpDelay <= 0) {
            if (this.swim) {
                // 수영하고 있을 때
                this.velocity.y += this.swimJumpForce;
                this.jumpable = false;
                this.jumpDelay = JUMP_DELAY;
            } else if (this.jumpable) {
                // 일반 점프
                this.velocity.y += this.jumpForce;
                this.jumpable = false;
                this.jumpDelay = JUMP_DELAY;
            }
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

        let maxSpeed = RinInput.getKey("ShiftLeft")
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

            // velocity 크기 제한시 y 가속도를 포함하여 계산하지 않도록 y를 0으로
            this.velocity.y = 0;

            if (this.swim) {
                _yVelocity -= this.gravity * 0.5 * deltaTime;

                // y 가속도 제한
                if (Math.abs(_yVelocity) > this.maxSwimFallSpeed) {
                    _yVelocity = Math.sign(_yVelocity) * this.maxSwimFallSpeed;
                }
            } else {
                _yVelocity -= this.gravity * deltaTime;

                // y 가속도 제한
                if (Math.abs(_yVelocity) > this.maxFallSpeed) {
                    _yVelocity = Math.sign(_yVelocity) * this.maxFallSpeed;
                }
            }
        }

        // 가속도 감속
        if (this.swim) {
            this.velocity.multiplyScalar(Math.pow(this.swimDamping, deltaTime));
        } else {
            this.velocity.multiplyScalar(Math.pow(this.damping, deltaTime));
        }

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

        // y 가속도가 0 이상이면 점프 불가
        if (this.velocity.y > 0) {
            this.jumpable = false;
        }

        // 가속도를 플레이어 position에 적용

        const vector = this.velocity
            .clone()
            .multiplyScalar((1 / this.baseSpeed) * deltaTime);

        if (this.swim) {
            vector.multiplyScalar(this.swimSpeed);
        }

        const predictedPosition = this.instance.position.clone().add(vector);

        let collisionWithLiquid = false;

        // 걸어다니면 충돌 체크 및 처리
        if (this.fly === false) {
            const collisions = checkCollision(
                predictedPosition,
                this.scene.world
            );

            for (const collision of collisions) {
                const normal = collision.normal;
                const length = collision.length;
                const inverse = normal.clone().multiplyScalar(length);
                const block = collision.block;

                if (block.isLiquid) {
                    collisionWithLiquid = true;
                    continue;
                }

                // 바닥 혹은 천장에 닿은 경우에 따라서, 점프 가능 여부와 y velocity를 조정

                if (normal.y > 0) {
                    if (this.velocity.y < 0) {
                        this.velocity.y = 0;
                        this.jumpable = true;
                    }
                } else if (normal.y < 0) {
                    if (this.velocity.y > 0) {
                        this.velocity.y = 0;
                    }
                }

                vector.add(inverse);
            }
        }

        this.instance.position.add(vector);

        this.swim = collisionWithLiquid;

        Log.watch("swim", this.swim);

        const player = new THREE.Vector3(
            this.position.x,
            this.position.y - PLAYER_SIZE[1] * (3 / 4),
            this.position.z
        );
        Log.watchVector("pos", player);
        Log.watchVector("vel", this.velocity);
        Log.watch("speed", this.velocity.length().toFixed(2));
        Log.watch("jumpable", this.jumpable);
    }

    cameraMovement(deltaTime) {
        const dx = RinInput.pointerPosition.dx;
        const dy = RinInput.pointerPosition.dy;

        this.horizontalAngle -= dx * this.lookSpeed;
        this.verticalAngle -= dy * this.lookSpeed;

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

    scrollInput(deltaTime) {
        if (RinInput.wheelDelta > 0) {
            // 아래로 내림 -> 다음
            this.currentSlot = (this.currentSlot + 1) % this.quickSlot.length;
        } else if (RinInput.wheelDelta < 0) {
            // 위로 올림 -> 이전
            this.currentSlot =
                (this.currentSlot - 1 + this.quickSlot.length) %
                this.quickSlot.length;
        }
        Log.watch("wheel", RinInput.wheelDelta);
        Log.watch("currentSlot", this.currentSlot);
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

            if (block && block.active && block.isLiquid === false) {
                const point = intersect.point;
                const distance = intersect.distance;
                const coordinate = intersect.coordinate;
                const normal = intersect.normal;

                return { point, distance, coordinate, normal, block };
            }
        }

        return null;
    }
}
