import * as THREE from "three";

export class Entity {
    /**
     * @type {RinScene}
     */
    scene = null;

    /**
     * @type {THREE.Object3D}
     */
    instance = null;

    /**
     * 엔티티를 생성합니다.
     * @param {RinScene} scene
     */
    constructor(scene) {
        this.scene = scene;

        // 이벤트 등록
        // arrow function을 사용하여 this의 context를 Entity로 유지
        scene.addEventListener("load", () => this.onLoad());
        scene.addEventListener("update", (event) =>
            this.onUpdate(event.deltaTime)
        );
        scene.addEventListener("frameUpdate", (event) =>
            this.onFrameUpdate(event.deltaTime)
        );
        scene.addEventListener("fixedUpdate", (event) =>
            this.onFixedUpdate(event.fixedDeltaTime)
        );
        scene.addEventListener("unload", () => this.onUnload());
    }

    onLoad() {}

    onUpdate(deltaTime) {}

    onFrameUpdate(deltaTime) {}

    onFixedUpdate(fixedDeltaTime) {}

    onUnload() {}
}
