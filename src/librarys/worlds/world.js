import * as THREE from "three";
import { Log } from "../log.js";
import {
    CHUNK_SIZE,
    GROUND_MAX_LEVEL,
    GROUND_MIN_LEVEL,
    MAP_HEIGHT,
    TILE_MAP_SIZE,
} from "../setting.js";
import { getChunkCoordinate, getChunkIndex, getMinMax } from "../util.js";
import { Chunk } from "./chunk.js";
import { RinEngine } from "../engine.js";

import blockVertexShader from "../../assets/shaders/block.vert?raw";
import blockFragmentShader from "../../assets/shaders/block.frag?raw";
import { create2DNoiseFunction } from "../perlin_noise.js";

export class World {
    /**
     * @type {RinScene}
     */
    scene = null;

    /**
     * @type {Chunk[][]} [x][z]
     */
    chunks = [];

    /**
     * @type {THREE.InstancedMesh}
     */
    mesh = null;

    /**
     * @type {THREE.InstancedMesh}
     */
    transparentMesh = null;

    /**
     * @type {Map} 렌더링 정보 배열
     */
    renderInfos = null;

    /**
     * @type {number} 렌더링 정보 갯수
     */
    renderCount = 0;

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

        // 2. 맵 생성 알고리즘을 적용합니다. 펄린 노이즈와 프랙탈 브라운 운동을 사용하여 현실과 같은 지형을 만듧니다.
        let blockId = 0;

        // 펄린 노이즈 함수 생성
        const getLevelNoise = create2DNoiseFunction({
            min: GROUND_MIN_LEVEL,
            max: GROUND_MAX_LEVEL,
            octaves: 12,
        });

        const getTemperatureNoise = create2DNoiseFunction({
            min: -3,
            max: 7,
            amplitude: 1,
            frequency: 0.01075,
            octaves: 8,
        });

        for (let x = this.minWorldValue; x <= this.maxWorldValue; x++) {
            for (let z = this.minWorldValue; z <= this.maxWorldValue; z++) {
                // 펄린 노이즈를 사용하여 level을 결정
                const _x = x - this.minWorldValue;
                const _z = z - this.minWorldValue;
                const level = Math.floor(getLevelNoise(_x, _z));
                const temperature = Math.floor(getTemperatureNoise(_x, _z));

                for (let y = 0; y < this.depth; y++) {
                    if (y < 2) {
                        // y축이 2보다 작으면 베드락
                        blockId = 7;
                    } else if (y < level - 3) {
                        //level - 3보다 작으면 돌
                        blockId = 1;
                    } else if (y < level) {
                        // level보다 작으면 흙
                        blockId = temperature > 0 ? 3 : 12;
                    } else if (y === level && level >= 28) {
                        // level이면 잔디
                        blockId = temperature > 0 ? 2 : 12;
                    } else if (y < 28) {
                        // level이 28보다 작을때, level부터 16까지 물로 채우기
                        blockId = 9;
                    } else {
                        // level보다 크면 공기
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
     * @param {Map} infos 렌더링 정보
     * @param {number} distance
     * @returns {number} 렌더링 크기
     */
    getRenderInfos(infos, distance = 15) {
        const player = this.scene.player;
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

        let count = 0;

        for (let x = minXIndex; x <= maxXIndex; x++) {
            if (x < 0 || x >= this.chunks.length) continue;

            for (let z = minZIndex; z <= maxZIndex; z++) {
                if (z < 0 || z >= this.chunks[x].length) continue;

                const chunk = this.chunks[x][z];

                if (chunk) {
                    count += chunk.getRenderInfos(infos);
                }
            }
        }

        return count;
    }

    /**
     * World의 렌더링 정보와 InstancedMesh를 생성하고 반환합니다.
     * @param {number} distance 렌더링 거리
     * @returns {THREE.InstancedMesh} InstancedMesh
     */
    render(distance = 30) {
        // 렌더링 정보를 저장할 Map을 생성
        this.renderInfos = new Map();

        // 렌더링할 블록에 대한 정보를 저장
        this.renderCount = this.getRenderInfos(this.renderInfos, distance);

        // 렌더링 정보가 없다면 렌더링하지 않음
        if (this.renderCount < 1) {
            return;
        }

        // infos 배열로 InstancedMesh를 만들어서 Scene에 렌더링
        return this.buildMesh();
    }

    /**
     * World의 렌더링 정보로 InstancedMesh를 만들어서 Scene에 렌더링합니다.
     */
    buildMesh() {
        const planeGeometry = new THREE.PlaneGeometry();
        const geometry = new THREE.InstancedBufferGeometry();
        const transparentGeometry = new THREE.InstancedBufferGeometry();

        // InstancedBufferGeometry에 PlaneGeometry의 attribute들을 복사
        geometry.setAttribute("position", planeGeometry.attributes.position);
        geometry.setAttribute("normal", planeGeometry.attributes.normal);
        geometry.index = planeGeometry.index;

        transparentGeometry.setAttribute(
            "position",
            planeGeometry.attributes.position
        );
        transparentGeometry.setAttribute(
            "normal",
            planeGeometry.attributes.normal
        );
        transparentGeometry.index = planeGeometry.index;

        // UV
        const uvs = [
            0,
            1 / TILE_MAP_SIZE,
            1 / TILE_MAP_SIZE,
            1 / TILE_MAP_SIZE,
            0,
            0,
            1 / TILE_MAP_SIZE,
            0,
        ];
        geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
        transparentGeometry.setAttribute(
            "uv",
            new THREE.Float32BufferAttribute(uvs, 2)
        );

        // ShaderMaterial을 생성하고 blockShader, textureImage 적용
        const material = new THREE.ShaderMaterial({
            uniforms: {
                textureImage: {
                    value: RinEngine.texture,
                },
            },
            vertexShader: blockVertexShader,
            fragmentShader: blockFragmentShader,
        });

        const transparentMaterial = new THREE.ShaderMaterial({
            uniforms: {
                textureImage: {
                    value: RinEngine.texture,
                },
            },
            vertexShader: blockVertexShader,
            fragmentShader: blockFragmentShader,
            transparent: true,
        });

        const mesh = new THREE.InstancedMesh(
            geometry,
            material,
            this.renderCount
        );

        mesh.renderOrder = -2;

        const uvOffsets = new Float32Array(this.renderCount * 2);
        let index = 0;

        let transparentItems = [];

        for (const renderBlockInfo of this.renderInfos.values()) {
            for (const info of renderBlockInfo.infos) {
                if (info.transparent) {
                    transparentItems.push(info);
                    continue;
                }

                // index번째 instance에 instanceMatrix를 지정
                mesh.setMatrixAt(index, info.matrix);

                // uvOffset 정보를 배열에 넣기
                uvOffsets.set(info.uvOffset, index++ * 2);
            }
        }

        // 각 instance에 대한 uvOffset을 InstancedBufferAttribute로 추가
        geometry.setAttribute(
            "uvOffset",
            new THREE.InstancedBufferAttribute(uvOffsets, 2)
        );

        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();

            this.scene.scene.remove(this.mesh);
        }

        if (this.transparentMesh) {
            this.transparentMesh.geometry.dispose();
            this.transparentMesh.material.dispose();

            this.scene.scene.remove(this.transparentMesh);
        }

        this.mesh = mesh;
        this.scene.scene.add(mesh);

        // 투명 블록을 위한 InstancedMesh 생성
        if (transparentItems.length > 0) {
            const mesh = new THREE.InstancedMesh(
                transparentGeometry,
                transparentMaterial,
                transparentItems.length
            );

            mesh.renderOrder = -1;

            const uvOffsets = new Float32Array(transparentItems.length * 2);
            index = 0;

            for (const info of transparentItems) {
                // index번째 instance에 instanceMatrix를 지정
                mesh.setMatrixAt(index, info.matrix);

                // uvOffset 정보를 배열에 넣기
                uvOffsets.set(info.uvOffset, index++ * 2);
            }
            // 각 instance에 대한 uvOffset을 InstancedBufferAttribute로 추가
            transparentGeometry.setAttribute(
                "uvOffset",
                new THREE.InstancedBufferAttribute(uvOffsets, 2)
            );

            this.transparentMesh = mesh;
            this.scene.scene.add(mesh);
        }

        this.needRenderUpdate = false;

        return mesh;
    }

    /**
     * World의 x, y, z 좌표의 렌더링을 업데이트합니다.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    updateRender(x, y, z) {
        const block = this.getBlock(x, y, z);

        // World 경계 밖인 경우 - 업데이트하지 않음
        if (block === null) {
            return;
        }

        // 렌더링 정보 업데이트
        const needUpdate = this._updateRender(block, true);

        // 렌더링 정보가 변했다면, mesh를 새로 빌드
        if (needUpdate) {
            this.buildMesh();
        }
    }

    /**
     * World의 block의 렌더링을 업데이트합니다. (내부 함수)
     * @param {Block} block
     * @param {number} depth
     */
    _updateRender(block, depth = 0) {
        const key = `${block.coordinate.x}:${block.coordinate.y}:${block.coordinate.z}`;
        const originalInfos = this.renderInfos.get(key);

        // hash 구하기
        let oldHash = originalInfos ? originalInfos.hash : 0;

        // 블록의 새로운 렌더링 정보를 가져옴
        const blockRenderInfos = block._getRenderInfos();

        // 새로운 hash 구하기
        let newHash = blockRenderInfos ? blockRenderInfos.hash : 0;

        // hash가 같으면 업데이트하지 않음
        if (oldHash === newHash) {
            if (depth++ > 1) {
                return false;
            }
        }

        // 렌더링 정보 업데이트
        if (blockRenderInfos === null) {
            this.renderInfos.delete(key);
        } else {
            this.renderInfos.set(key, blockRenderInfos);
        }

        let oldLength = originalInfos ? originalInfos.infos.length : 0;
        let newLength = blockRenderInfos ? blockRenderInfos.infos.length : 0;

        // 렌더링 정보 갯수 업데이트
        this.renderCount += newLength - oldLength;

        // 인접한 블록의 렌더링 정보도 업데이트
        for (let direction = 0; direction < 6; direction++) {
            const nearBlock = block.getNearBlock(direction);

            if (nearBlock) {
                this._updateRender(nearBlock, depth);
            }
        }

        return true;
    }

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
     * x, y, z world 좌표가 가리키는 블록의 id를 지정합니다.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} id 블록 id
     */
    setBlock(x, y, z, id) {
        const block = this.getBlock(x, y, z);

        if (block) {
            block.id = id;
            this.updateRender(x, y, z);
        }
    }
}
