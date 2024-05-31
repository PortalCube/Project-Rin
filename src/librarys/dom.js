import { RinEngine } from "./engine.js";

export function registerVisibilityChangeEvent() {
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            // 브라우저가 비활성화 상태에서 다시 활성화될 때
            // 마지막 프레임 갱신 시각들을 현재 시각으로 설정
            const currentTime = performance.now();

            RinEngine._latestUpdateTime = currentTime;
            RinEngine._latestFrameUpdateTime = currentTime;
            RinEngine._latestTickUpdateTime = currentTime;

            // 프레임 업데이트 시간 간격 초기화
            RinEngine._frameElapsedTime = 0;
            RinEngine._tickElapsedTime = 0;
        }
    });
}

export function registerResizeEvent() {
    window.addEventListener("resize", () => {
        if (RinEngine.scene) {
            const width = window.innerWidth;
            const height = window.innerHeight;

            RinEngine.scene.onResize();
            RinEngine.renderer.setSize(width, height);
        }
    });
}
