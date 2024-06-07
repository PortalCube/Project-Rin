import { RinEngine } from "./engine.js";
import { RinInput } from "./input.js";

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
            // 브라우저 크기가 변경될 때 Scene도 함께 크기를 변경
            const width = window.innerWidth;
            const height = window.innerHeight;

            RinEngine.scene.onResize();
            RinEngine.renderer.setSize(width, height);
        }
    });
}

export function registerCanvasInputEvent(canvas) {
    canvas.addEventListener("click", () => {
        // 사용자 입력을 감지하고 포인터 잠금 업데이트
        RinInput._userGesture = true;
        RinInput.updatePointerLock();
    });
}

export function disableContextMenu(canvas) {
    canvas.addEventListener("contextmenu", (e) => {
        // 마우스 우클릭 했을때 컨텍스트 메뉴 안뜨도록
        e.preventDefault();
    });
}
