import * as THREE from "three";
import { Entity } from "./entity.js";
import { RinScene } from "../scenes/scene.js";
import modelVertexShader from "../../assets/shaders/model.vert?raw";
import modelFragmentShader from "../../assets/shaders/model.frag?raw";
import boxVertexShader from "../../assets/shaders/box.vert?raw";
import boxFragmentShader from "../../assets/shaders/box.frag?raw";

export class Model extends Entity {
    /**
     * @type {THREE.Group} 3D 모델의 오브젝트 인스턴스
     */
    instance = null;

    /**
     * @type {THREE.BufferGeometry} 3D 모델의 Geometry
     */
    geometry = null;

    /**
     * @type {THREE.Material} 3D 모델의 Material
     */
    material = null;

    /**
     * @type {THREE.Mesh} 3D 모델의 바운딩 박스 인스턴스
     */
    boundingBox = null;

    /**
     * @type {boolean} World에 배치된 Block과 충돌 여부
     */
    isCollide = false;

    /**
     * @type {boolean} World의 models 배열 index
     */
    index = -1;

    /**
     * @type {number} Y축 회전 각도
     */
    angle = 0;

    get position() {
        return this.instance.position;
    }

    get visible() {
        return this.instance.visible;
    }

    set visible(value) {
        this.instance.visible = value;
    }

    /**
     * @type {boolean} 3D 모델이 배치되었는지 여부
     */
    get isPlaced() {
        return this.index > 0;
    }

    /**
     * @type {THREE.Vector3} 3D 모델의 실제 크기
     */
    get size() {
        return this._size;
    }

    /**
     * @type {THREE.Vector3} 3D 모델의 블록 크기
     */
    get blockSize() {
        return this._blockSize;
    }

    /**
     * @type {THREE.Vector3} 3D 모델의 최소 블록 좌표
     */
    get minBlockCoordinate() {
        let x = Math.round(this.position.x - Math.floor(this.blockSize.x / 2));
        const y = Math.round(this.position.y);
        let z = Math.round(this.position.z - Math.floor(this.blockSize.z / 2));

        if (this.blockSize.x % 2 === 0) {
            x += 1;
        }

        if (this.blockSize.z % 2 === 0) {
            z += 1;
        }

        return new THREE.Vector3(x, y, z);
    }

    /**
     * @type {THREE.Vector3}
     */
    _blockSize = null;

    /**
     * @type {THREE.Vector3}
     */
    _size = null;

    /**
     * 모델 클래스 생성자
     * @param {RinScene} scene
     */
    constructor(scene) {
        super(scene);
    }

    /**
     * 3D Model의 인스턴스를 생성합니다.
     * @param {THREE.Vector3} position
     * @returns {THREE.Group}
     */
    createInstance(position = new THREE.Vector3(0, 0, 0)) {
        if (this.geometry === null) {
            return null;
        }

        if (this.material === null) {
            this.material = new THREE.ShaderMaterial({
                uniforms: {
                    lightDir: { value: [1.0, 1.0, 0.0] },
                    matAmbient: { value: [0.3, 0.3, 0.3, 1.0] },
                    matDiffuse: { value: [0.1, 0.1, 0.8, 1.0] },
                    matSpecular: { value: [1.0, 1.0, 1.0, 1.0] },
                    matShininess: { value: 200 },
                },
                vertexShader: modelVertexShader,
                fragmentShader: modelFragmentShader,
            });
        }

        // geometry의 vertex들을 순회하면서 메쉬의 크기를 구하기
        this._size = this.getModelSize();
        this._blockSize = new THREE.Vector3(
            Math.ceil(this.size.x),
            Math.ceil(this.size.y),
            Math.ceil(this.size.z)
        );

        if (this.angle % 180 === 90) {
            const xSize = this._size.x;
            const zSize = this._size.z;

            this._size.x = zSize;
            this._size.z = xSize;

            const xBlockSize = this._blockSize.x;
            const zBlockSize = this._blockSize.z;

            this._blockSize.x = zBlockSize;
            this._blockSize.z = xBlockSize;
        }

        const x = this.blockSize.x % 2 ? 0 : 0.5;
        const y = this.size.y / 2 - 0.5;
        const z = this.blockSize.z % 2 ? 0 : 0.5;

        // 메쉬를 생성하고 local position 지정
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(x, y, z);
        this.mesh.rotation.y = THREE.MathUtils.degToRad(this.angle);

        // 그룹 오브젝트를 생성하고, mesh를 그룹 오브젝트에 추가
        this.instance = new THREE.Group();
        this.instance.add(this.mesh);
        this.instance.renderOrder = 1;
        this.instance.position.copy(position);

        // Scene에 3D 모델을 추가
        this.scene.scene.add(this.instance);

        return this.instance;
    }

    /**
     * 3D 모델의 바운딩 박스를 추가합니다. 미리보기에 사용됩니다.
     */
    createBoundingBox() {
        if (this.instance === null) {
            return null;
        }

        const _x = this.blockSize.x;
        const _y = this.blockSize.y;
        const _z = this.blockSize.z;

        const _yOffset = (this.blockSize.y - this.size.y) / 2;

        const boxGeometry = new THREE.BoxGeometry(1);
        const boxMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: [1.0, 0.0, 0.0] },
            },
            opacity: 0.3,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            vertexShader: boxVertexShader,
            fragmentShader: boxFragmentShader,
        });

        this.boundingBox = new THREE.Mesh(boxGeometry, boxMaterial);
        this.boundingBox.scale.set(_x, _y, _z);
        this.boundingBox.position.copy(this.mesh.position);
        this.boundingBox.position.y += _yOffset;
        this.instance.add(this.boundingBox);

        return this.boundingBox;
    }

    /**
     * geomerty의 vertex를 순회하면서 3d model의 크기를 계산합니다.
     * @returns {THREE.Vector3}
     */
    getModelSize() {
        if (this.geometry === null) {
            return null;
        }

        let minX, minY, minZ, maxX, maxY, maxZ;
        minX = minY = minZ = Number.MAX_SAFE_INTEGER;
        maxX = maxY = maxZ = Number.MIN_SAFE_INTEGER;

        const vertices = this.geometry.attributes.position.array;

        for (let i = 0; i < vertices.length; i += 3) {
            let x = vertices[i];
            let y = vertices[i + 1];
            let z = vertices[i + 2];

            // 최소, 최대값 갱신
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (z < minZ) minZ = z;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            if (z > maxZ) maxZ = z;
        }

        const size = new THREE.Vector3(maxX - minX, maxY - minY, maxZ - minZ);
        return size;
    }

    /**
     * 주어진 좌표로 3D 모델의 위치를 업데이트합니다.
     * @param {THREE.Vector3} coordinate
     */
    setPosition(coordinate) {
        if (this.instance === null) {
            return;
        }

        this.instance.position.copy(coordinate);

        // 충돌 체크
        const isCollide = this.checkCollision();

        if (this.boundingBox) {
            // 바운딩 박스의 색상을 변경
            const value = isCollide ? [1.0, 0.0, 0.0] : [0.0, 1.0, 0.0];
            this.boundingBox.material.uniforms.uColor.value = value;
        }

        return isCollide;
    }

    /**
     * 3D 모델을 90도 회전합니다.
     * @param {number} angle
     */
    rotate() {
        if (this.instance === null) {
            return;
        }

        this.angle = (this.angle + 90) % 360;

        // 90도 회전이므로 x축과 z축을 서로 교환함
        const xSize = this._size.x;
        const zSize = this._size.z;

        this._size.x = zSize;
        this._size.z = xSize;

        const xBlockSize = this._blockSize.x;
        const zBlockSize = this._blockSize.z;

        this._blockSize.x = zBlockSize;
        this._blockSize.z = xBlockSize;

        // mesh의 position, rotation을 갱신
        if (this.mesh) {
            const x = this.blockSize.x % 2 ? 0 : 0.5;
            const y = this.size.y / 2 - 0.5;
            const z = this.blockSize.z % 2 ? 0 : 0.5;

            this.mesh.position.set(x, y, z);
            this.mesh.rotation.y = THREE.MathUtils.degToRad(this.angle);
        }

        // 바운딩 박스가 있다면, 충돌 체크 후 position, rotation, scale을 갱신
        if (this.boundingBox) {
            const isCollide = this.checkCollision();

            const _x = this.blockSize.x;
            const _y = this.blockSize.y;
            const _z = this.blockSize.z;

            const _yOffset = (this.blockSize.y - this.size.y) / 2;

            this.boundingBox.scale.set(_x, _y, _z);
            this.boundingBox.position.copy(this.mesh.position);
            this.boundingBox.position.y += _yOffset;

            // 바운딩 박스의 색상을 변경
            this.boundingBox.material.uniforms.uColor.value = isCollide
                ? [1.0, 0.0, 0.0]
                : [0.0, 1.0, 0.0];
        }
    }

    checkCollision() {
        if (this.scene.world === null) {
            return false;
        }

        const world = this.scene.world;
        const size = this.blockSize;
        const minPos = this.minBlockCoordinate;

        const x = minPos.x;
        const y = minPos.y;
        const z = minPos.z;

        for (let i = 0; i < size.x; i++) {
            for (let j = 0; j < size.y; j++) {
                for (let k = 0; k < size.z; k++) {
                    const block = world.getBlock(x + i, y + j, z + k);

                    if (block === null) {
                        // 월드 밖에는 설치할 수 없음
                        return true;
                    }

                    if (block.id !== 0) {
                        // 다른 블록과 충돌
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * 현재 3D 모델의 사본을 월드에 배치합니다.
     */
    place() {
        if (this.scene.world === null) {
            return false;
        }

        if (this.checkCollision()) {
            return false;
        }

        const world = this.scene.world;
        const size = this.blockSize;
        const minPos = this.minBlockCoordinate;
        const newIndex = world.models.length;

        const x = minPos.x;
        const y = minPos.y;
        const z = minPos.z;

        for (let i = 0; i < size.x; i++) {
            for (let j = 0; j < size.y; j++) {
                for (let k = 0; k < size.z; k++) {
                    // Model은 음수 인덱스로 저장
                    world.setBlock(x + i, y + j, z + k, -newIndex);
                }
            }
        }

        // 사본을 생성하고 world models에 추가
        const model = new Model(this.scene);
        model.geometry = this.geometry;
        model.material = this.material;
        model.angle = this.angle;
        model.createInstance(this.instance.position);
        model.index = newIndex;

        world.models.push(model);
    }

    /**
     * 3D 모델을 월드에서 제거합니다.
     */
    destroy() {
        const world = this.scene.world;
        const size = this.blockSize;
        const minPos = this.minBlockCoordinate;

        const x = minPos.x;
        const y = minPos.y;
        const z = minPos.z;

        for (let i = 0; i < size.x; i++) {
            for (let j = 0; j < size.y; j++) {
                for (let k = 0; k < size.z; k++) {
                    const block = world.getBlock(x + i, y + j, z + k);
                    if (block && block.id === -this.index) {
                        block.id = 0;
                    }
                }
            }
        }

        world.models[this.index] = null;

        this.scene.scene.remove(this.instance);
    }

    // onLoad() {}

    // onUpdate(deltaTime) {}

    onFrameUpdate(deltaTime) {
        if (this.material) {
            const camera = this.scene.player.instance;

            // 3D 모델의 directional light 방향을 업데이트
            const lightDir = this.scene.world.lightDirection.clone();
            lightDir.transformDirection(camera.matrixWorldInverse);

            this.material.uniforms.lightDir.value = lightDir.toArray();
        }
    }

    // onUnload() {}
}
