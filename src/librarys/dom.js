import { Rin } from "./engine.js";

export function registerVisibilityChangeEvent() {
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            // 브라우저가 비활성화 상태에서 다시 활성화될 때
            // 마지막 프레임 갱신 시각들을 현재 시각으로 설정
            const currentTime = performance.now();

            Rin._latestUpdateTime = currentTime;
            Rin._latestFrameUpdateTime = currentTime;
            Rin._latestTickUpdateTime = currentTime;

            // 프레임 업데이트 시간 간격 초기화
            Rin._frameElapsedTime = 0;
            Rin._tickElapsedTime = 0;
        }
    });
}

export function registerResizeEvent() {
    window.addEventListener("resize", () => {
        if (Rin.camera && Rin.renderer) {
            const element = Rin.renderer.domElement;
            const width = element.innerWidth;
            const height = element.innerHeight;

            Rin.camera.aspect = width / height;
            Rin.camera.updateProjectionMatrix();

            Rin.renderer.setSize(width, height);
        }
    });
}
