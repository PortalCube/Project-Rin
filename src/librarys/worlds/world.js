import * as THREE from "three";
import { Log } from "../log.js";
import {
    CHUNK_SIZE,
    GROUND_MAX_LEVEL,
    GROUND_MIN_LEVEL,
    MAP_HEIGHT,
    SEA_LEVEL,
    TILE_MAP_SIZE,
} from "../setting.js";
import { getChunkCoordinate, getChunkIndex, getMinMax } from "../util.js";
import { Chunk } from "./chunk.js";
import { RinEngine } from "../engine.js";

import blockVertexShader from "../../assets/shaders/block.vert?raw";
import blockFragmentShader from "../../assets/shaders/block.frag?raw";
import { create2DNoiseFunction } from "../perlin-noise.js";
import { Model } from "../entities/model.js";
import { TeapotGeometry } from "three/examples/jsm/Addons.js";

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
     * @type {Map} 렌더링 정보 배열
     */
    renderInfos = null;

    /**
     * @type {number} 렌더링 정보 갯수
     */
    renderCount = 0;

    /**
     * @type {Model[]} 월드에 배치된 3D 모델의 배열
     */
    models = [];

    /**
     * @type {THREE.Vector3} directional light의 방향
     */
    lightDirection = new THREE.Vector3(1, 1, 0);

    width = 0;
    height = 0;
    depth = 0;

    minWorldValue = 0;
    maxWorldValue = 0;

    minChunkValue = 0;
    maxChunkValue = 0;

    /**
     * @type {Model} 플레이어 미리보기 모델
     */
    get previewModel() {
        return this.models[0];
    }

    constructor(scene) {
        this.scene = scene;

        // 예시 3D 모델을 생성
        const geometry = new TeapotGeometry(1);
        const previewModel = new Model(this.scene);

        previewModel.index = 0;
        previewModel.geometry = geometry;
        previewModel.createInstance();
        previewModel.createBoundingBox();
        previewModel.instance.position.set(0, 45, 0);

        this.models.push(previewModel);

        scene.addEventListener("frameUpdate", (event) =>
            this.onFrameUpdate(event.deltaTime)
        );
    }

    onFrameUpdate(deltaTime) {
        this.updateBlockLight();
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

        // 2. 맵 생성 알고리즘을 적용합니다. 펄린 노이즈를 사용하여 현실처럼 부드러운 지형을 만듧니다.
        let blockId = 0;

        // 펄린 노이즈 함수 생성
        const getLevelNoise = create2DNoiseFunction({
            min: GROUND_MIN_LEVEL,
            max: GROUND_MAX_LEVEL,
            frequency: 0.01,
            octaves: 12,
        });

        const getBeachNoise = create2DNoiseFunction({
            min: 0,
            max: 1,
            shiftX: 1,
            shiftY: 2,
            frequency: 0.03,
            octaves: 8,
        });

        const getTemperatureNoise = create2DNoiseFunction({
            min: 0,
            max: 1,
            amplitude: 1,
            frequency: 0.065,
            octaves: 16,
            shiftX: 100000,
            shiftY: 100000,
        });

        let arr = [];

        for (let x = this.minWorldValue; x <= this.maxWorldValue; x++) {
            let temp = [];
            for (let z = this.minWorldValue; z <= this.maxWorldValue; z++) {
                // 펄린 노이즈를 사용하여 level을 결정
                const _x = x - this.minWorldValue;
                const _z = z - this.minWorldValue;
                const level = Math.floor(getLevelNoise(_x, _z));
                const temperature = getTemperatureNoise(_x, _z);
                const beach = getBeachNoise(_x, _z);
                const isOcean = level < SEA_LEVEL;
                temp.push(level);

                for (let y = 0; y < this.depth; y++) {
                    if (y < 2) {
                        // # 월드 바닥
                        blockId = 7;
                    } else if (y < level - 3) {
                        // # 깊은 지표면
                        blockId = 1;
                    } else if (y < level) {
                        // # 얕은 지표면
                        if (isOcean) {
                            blockId = 12;
                        } else {
                            blockId = 3;
                        }
                    } else if (y === level) {
                        // # 지표면
                        if (isOcean) {
                            // 바다 바이옴
                            blockId = temperature < 0.35 ? 3 : 12;
                        } else if (level < SEA_LEVEL + 1) {
                            // 해변
                            blockId = beach < 0.6 ? 12 : 2;
                        } else {
                            blockId = 2;
                        }
                    } else {
                        // # 지표면 위
                        if (y <= SEA_LEVEL && isOcean) {
                            // 바다 바이옴에서 SEA_LEVEL 이하
                            blockId = 9;
                        } else {
                            blockId = 0;
                        }
                    }

                    // 블록 id를 지정
                    this.getBlock(x, y, z).id = blockId;
                }
            }
            arr.push(temp);
        }

        console.log(arr);
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

        // InstancedBufferGeometry에 PlaneGeometry의 attribute들을 복사
        geometry.setAttribute("position", planeGeometry.attributes.position);
        geometry.setAttribute("uv", planeGeometry.attributes.uv);
        geometry.index = planeGeometry.index;

        // ShaderMaterial을 생성하고 blockShader, textureImage 적용
        const material = new THREE.ShaderMaterial({
            uniforms: {
                lightDir: { value: [1.0, 1.0, 0.0] },
                lightAmbient: { value: [0.8, 0.8, 0.8, 1.0] },
                matDiffuse: { value: [0.5, 0.5, 0.5, 1.0] },
                matSpecular: { value: [0.3, 0.3, 0.3, 0.3] },
                matShininess: { value: 70 },
                textureImage: {
                    value: RinEngine.texture,
                },
                uvTileSize: {
                    value: TILE_MAP_SIZE,
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

        // 월드가 가장 먼저 렌더링되도록 설정
        mesh.renderOrder = -1;

        const uvOffsets = new Float32Array(this.renderCount * 2);
        const ambients = new Float32Array(this.renderCount);
        const normals = new Float32Array(this.renderCount * 3);

        let index = 0;
        let transparentItems = [];

        // 불투명 블록에 대한 렌더링 정보를 배열에 먼저 넣기
        for (const renderBlockInfo of this.renderInfos.values()) {
            for (const info of renderBlockInfo.infos) {
                if (info.transparent) {
                    transparentItems.push(info);
                    continue;
                }

                // index번째 instance에 instanceMatrix를 지정
                mesh.setMatrixAt(index, info.matrix);

                // ambient 정보를 배열에 넣기
                ambients[index] = info.ambient;

                // uvOffset 정보를 배열에 넣기
                uvOffsets.set(info.uvOffset, index * 2);

                // normal 정보를 배열에 넣기
                normals.set(info.normal.toArray(), index * 3);

                index++;
            }
        }

        // 투명 블록에 대한 렌더링 정보를 배열에 넣기
        for (const info of transparentItems) {
            // index번째 instance에 instanceMatrix를 지정
            mesh.setMatrixAt(index, info.matrix);

            // ambient 정보를 배열에 넣기
            ambients[index] = info.ambient;

            // uvOffset 정보를 배열에 넣기
            uvOffsets.set(info.uvOffset, index * 2);

            // normal 정보를 배열에 넣기
            normals.set(info.normal.toArray(), index * 3);

            index++;
        }

        geometry.setAttribute(
            "ambient",
            new THREE.InstancedBufferAttribute(ambients, 1)
        );
        geometry.setAttribute(
            "uvOffset",
            new THREE.InstancedBufferAttribute(uvOffsets, 2)
        );
        geometry.setAttribute(
            "normal",
            new THREE.InstancedBufferAttribute(normals, 3)
        );

        // 이전에 생성한 메쉬를 삭제
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();

            this.scene.scene.remove(this.mesh);
        }

        this.mesh = mesh;
        this.scene.scene.add(mesh);
        this.needRenderUpdate = false;

        // 블록 라이트 업데이트
        this.updateBlockLight();

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
     * @param {boolean} spread
     */
    _updateRender(block, spread = true) {
        const key = `${block.coordinate.x}:${block.coordinate.y}:${block.coordinate.z}`;
        const originalInfos = this.renderInfos.get(key);

        // hash 구하기
        let oldHash = originalInfos ? originalInfos.hash : 0;

        // 블록의 새로운 렌더링 정보를 가져옴
        const blockRenderInfos = block._getRenderInfos();

        // 새로운 hash 구하기
        let newHash = blockRenderInfos ? blockRenderInfos.hash : 0;

        // 주변 블록의 hash가 같으면 업데이트하지 않음
        if (spread === false && oldHash === newHash) {
            return false;
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

        if (spread) {
            // 인접한 블록의 렌더링 정보도 업데이트
            for (let direction = 0; direction < 6; direction++) {
                const nearBlock = block.getNearBlock(direction);

                if (nearBlock && nearBlock.active) {
                    this._updateRender(nearBlock, false);
                }
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
            if (block.id < 0) {
                // Model 삭제
                this.models[-block.id].destroy();
                return;
            }

            block.id = id;

            // 3D 모델이 아닌 경우, 렌더링 업데이트
            if (id >= 0) {
                this.updateRender(x, y, z);
            }
        }
    }

    /**
     * 블록 라이트를 업데이트합니다.
     */
    updateBlockLight() {
        if (this.mesh) {
            const camera = this.scene.player.instance;
            const lightDir = this.lightDirection.clone();

            // camera.matrixWorld          camera -> world  좌표계 변환 행렬
            // camera.matrixWorldInverse   world  -> camera 좌표계 변환 행렬

            // directional light의 방향은 world 좌표계의 방향이므로 camera 좌표계로 변환하여 사용
            lightDir.transformDirection(camera.matrixWorldInverse);

            // 갱신된 directional light의 방향을 셰이더로 넘겨주기
            this.mesh.material.uniforms.lightDir.value = lightDir.toArray();
        }
    }
}
