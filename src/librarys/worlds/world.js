import * as THREE from "three";
import { Log } from "../log.js";
import { CHUNK_SIZE, GROUND_LEVEL, MAP_HEIGHT } from "../setting.js";
import {
    getChunkCoordinate,
    getChunkIndex,
    getMinMax,
    randomRange,
} from "../util.js";
import { Chunk } from "./chunk.js";
import { Block, Direction } from "./block.js";
import { RinEngine } from "../engine.js";

import blockVertexShader from "../../assets/shaders/block.vert?raw";
import blockFragmentShader from "../../assets/shaders/block.frag?raw";
import { Player } from "../entities/player.js";

function getUVOffset(id, tileSize = 16) {
    const size = 1 / tileSize;
    const x = (id % tileSize) * size;
    const y = (tileSize - Math.floor(id / tileSize) - 1) * size;

    return [x, y];
}

export class World {
    /**
     * @type {RinScene}
     */
    scene = null;

    /**
     * @type {Chunk[][]} [x][z]
     */
    chunks = [];

    width = 0;
    height = 0;
    depth = 0;

    minWorldValue = 0;
    maxWorldValue = 0;

    minChunkValue = 0;
    maxChunkValue = 0;

    constructor(scene) {
        this.scene = scene;
    }

    /**
     * World에 청크와 블록을 채워서 생성합니다.
     */
    generate(size, depth = MAP_HEIGHT) {
        this.width = size;
        this.height = size;
        this.depth = depth;

        [this.minWorldValue, this.maxWorldValue] = getMinMax(this.width);
        this.minChunkValue = getChunkIndex(this.minWorldValue, CHUNK_SIZE);
        this.maxChunkValue = getChunkIndex(this.maxWorldValue, CHUNK_SIZE);

        Log.info(
            `world size [${this.minWorldValue} ~ ${this.maxWorldValue}] (${this.width})`
        );
        Log.info(
            `chunk size [${this.minChunkValue} ~ ${this.maxChunkValue}] (${CHUNK_SIZE})`
        );

        // 1. 청크를 생성합니다. 청크는 공기 블록으로 채워집니다.
        for (let x = this.minChunkValue; x <= this.maxChunkValue; x++) {
            const list = [];
            for (let z = this.minChunkValue; z <= this.maxChunkValue; z++) {
                const chunk = new Chunk(this, new THREE.Vector2(x, z));
                chunk.generate(this.depth);
                list.push(chunk);
            }
            this.chunks.push(list);
        }

        // 2. 맵 생성 알고리즘을 적용합니다. 여기서는 매우 간단한 알고리즘을 적용하였습니다.
        let blockId = 0;

        for (let x = this.minWorldValue; x <= this.maxWorldValue; x++) {
            for (let z = this.minWorldValue; z <= this.maxWorldValue; z++) {
                const level = randomRange(GROUND_LEVEL - 5, GROUND_LEVEL);
                for (let y = 0; y < this.depth; y++) {
                    // GROUND_LEVEL 미만의 y좌표는 돌로 채우기
                    // GROUND_LEVEL의 y좌표는 잔디로 채우기
                    // GROUND_LEVEL 초과의 y좌표는 공기로 채우기

                    if (y < level) {
                        blockId = 1;
                    } else if (y === level) {
                        blockId = 2;
                    } else {
                        blockId = 0;
                    }
                    const block = this.getBlock(x, y, z);
                    block.id = blockId;
                }
            }
        }
    }

    /**
     * World의 렌더링 정보를 생성합니다.
     * @param {Player} player
     * @param {number} distance
     * @returns {object[]} 렌더링 정보 배열
     */
    getRenderInfos(player, distance = 50) {
        const playerPosition = player.blockPosition;
        const playerChunkPosition = this.getChunk(
            playerPosition.x,
            playerPosition.z
        ).coordinate;

        let renderDistance = distance - 1;

        const minX = playerChunkPosition.x - renderDistance;
        const minZ = playerChunkPosition.y - renderDistance;

        const minXIndex = minX - this.minChunkValue;
        const maxXIndex = minXIndex + renderDistance * 2;

        const minZIndex = minZ - this.minChunkValue;
        const maxZIndex = minZIndex + renderDistance * 2;

        const infos = [];

        for (let x = minXIndex; x <= maxXIndex; x++) {
            if (x < 0 || x >= this.chunks.length) continue;

            for (let z = minZIndex; z <= maxZIndex; z++) {
                if (z < 0 || z >= this.chunks[x].length) continue;

                const chunk = this.chunks[x][z];

                if (chunk) {
                    infos.push(...chunk.getRenderInfos());
                }
            }
        }

        return infos;
    }

    /**
     * World의 InstanceMesh를 생성합니다.
     * @param {Player} player 플레이어 객체
     * @param {number} distance 렌더링 거리
     * @returns {THREE.InstancedMesh} InstancedMesh
     */
    render(player, distance = 15) {
        // 렌더링할 블록에 대한 정보를 저장
        const infos = this.getRenderInfos(player, distance);

        if (infos.length < 1) {
            return;
        }

        // infos 배열로 InstancedMesh를 만들어서 Scene에 렌더링
        const geometry = new THREE.PlaneGeometry();
        const instancedGeometry = new THREE.InstancedBufferGeometry();

        // InstancedBufferGeometry에 PlaneGeometry의 attribute를 복사

        instancedGeometry.setAttribute(
            "position",
            geometry.attributes.position
        );
        instancedGeometry.setAttribute("normal", geometry.attributes.normal);
        instancedGeometry.index = geometry.index;

        const uvs = [0, 0.0625, 0.0625, 0.0625, 0, 0, 0.0625, 0];
        instancedGeometry.setAttribute(
            "uv",
            new THREE.Float32BufferAttribute(uvs, 2)
        );

        const material = new THREE.ShaderMaterial({
            uniforms: {
                textureImage: {
                    value: RinEngine.texture,
                },
            },
            vertexShader: blockVertexShader,
            fragmentShader: blockFragmentShader,
        });

        const mesh = new THREE.InstancedMesh(
            instancedGeometry,
            material,
            infos.length
        );

        const PI_2 = Math.PI / 2;
        const uvOffsets = [];

        for (let i = 0; i < infos.length; i++) {
            const info = infos[i];
            const matrix = new THREE.Matrix4();
            const directionVector = Block.getDirectionVector(info.direction);

            // instanceMatrix를 계산
            // 행렬곱은 아래부터 위로 역순으로 적용

            // (3) block의 world coordinate으로 translation
            matrix.multiply(
                new THREE.Matrix4().makeTranslation(info.coordinate)
            );

            // (2) block의 face의 위치로 translation
            matrix.multiply(
                new THREE.Matrix4().makeTranslation(
                    directionVector.multiplyScalar(0.5)
                )
            );

            // (1) block의 face의 방향으로 rotation
            switch (info.direction) {
                case Direction.Right:
                    matrix.multiply(new THREE.Matrix4().makeRotationY(PI_2));
                    break;
                case Direction.Left:
                    matrix.multiply(new THREE.Matrix4().makeRotationY(-PI_2));
                    break;
                case Direction.Up:
                    matrix.multiply(new THREE.Matrix4().makeRotationX(-PI_2));
                    break;
                case Direction.Down:
                    matrix.multiply(new THREE.Matrix4().makeRotationX(PI_2));
                    break;
                case Direction.Front:
                    break;
                case Direction.Back:
                    matrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
                    break;
            }

            // 4. mesh의 i번 instance에 instanceMatrix를 지정
            mesh.setMatrixAt(i, matrix);

            // 블록 uv coordinate offset을 계산
            const uvOffset = getUVOffset(info.texture, 16);

            // uvOffsets 배열에 push
            uvOffsets.push(...uvOffset);
        }

        instancedGeometry.setAttribute(
            "uvOffset",
            new THREE.InstancedBufferAttribute(new Float32Array(uvOffsets), 2)
        );

        return mesh;
    }

    /**
     * 변경사항에 대해 렌더링을 업데이트합니다.
     */
    updateRender() {}

    /**
     * x, z world 좌표가 가리키는 청크를 구합니다.
     * @param {number} x
     * @param {number} z
     * @returns {Chunk}
     */
    getChunk(x, z) {
        const i = getChunkIndex(x, CHUNK_SIZE) - this.minChunkValue;
        const j = getChunkIndex(z, CHUNK_SIZE) - this.minChunkValue;

        const yList = this.chunks[i];
        if (!yList) return null;

        return yList[j] || null;
    }

    /**
     * x, z world 좌표가 가리키는 청크를 지정합니다.
     * @param {number} x
     * @param {number} z
     * @param {Chunk} chunk
     */
    setChunk(x, z, chunk) {
        const i = getChunkIndex(x, CHUNK_SIZE) - this.minChunkValue;
        const j = getChunkIndex(z, CHUNK_SIZE) - this.minChunkValue;
        this.chunks[i][j] = chunk;
    }

    /**
     * x, y, z world 좌표가 가리키는 블록을 반환합니다.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Block}
     */
    getBlock(x, y, z) {
        const chunk = this.getChunk(x, z);

        if (!chunk) {
            return null;
        }

        const _x = getChunkCoordinate(x, CHUNK_SIZE);
        const _z = getChunkCoordinate(z, CHUNK_SIZE);

        return chunk.getBlock(_x, y, _z);
    }

    /**
     * x, y, z world 좌표가 가리키는 블록을 지정합니다.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {Block} block world 좌표에 지정할 블록
     */
    setBlock(x, y, z, block) {
        const chunk = this.getChunk(x, z);

        if (!chunk) {
            return;
        }

        const _x = getChunkCoordinate(x, CHUNK_SIZE);
        const _z = getChunkCoordinate(z, CHUNK_SIZE);

        chunk.setBlock(_x, y, _z, block);
    }
}
