/* JS에서 입력을 처리하기 위해서는 window 객체에 KeyboardEvent나 MouseEvent의 리스너를 등록해야 합니다.
 * RinScene 객체에서 직접 window에 이벤트 리스너를 등록하여 사용할 경우,
 * RinEngine의 Lifecycle에 따라서 사용자의 입력을 처리하지 않고 사용자가 입력하는 즉시 코드가 실행되게 됩니다.
 *
 * 따라서, RinEngine의 Lifecycle을 유지하기 위해서 별도의 RinInput 객체를 통해서 입력을 제어합니다.
 *
 * RinInput은 자체적으로 window에 이벤트 리스너를 등록하여 실시간으로 사용자의 입력 값을 업데이트하고,
 * RinEngine은 매 sceneUpdate마다 RinInput 객체에서 오래된 값 (keydown, keyup, pointerPositionDelta)들을 업데이트합니다.
 * RinScene의 오브젝트들은 매 update 주기마다 싱글톤 패턴으로 관리되는 RinInput 객체를 통해서 사용자의 입력을 처리합니다.
 */

import { RinEngine } from "./engine.js";
import { Log } from "./log.js";

export const RinInput = {
    _userGesture: false,
    _latestLockTime: 0,

    _pointerPosition: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
    },

    _latestPointerPosition: {
        dx: 0,
        dy: 0,
    },

    _wheelDelta: 0,

    _pointerDown: new Set(),
    _pointer: new Set(),
    _pointerUp: new Set(),

    _keyDown: new Set(),
    _key: new Set(),
    _keyUp: new Set(),

    _pointerLock: false,

    get pointerPosition() {
        return this._pointerPosition;
    },

    get wheelDelta() {
        return this._wheelDelta;
    },

    get pointerLockApplyed() {
        return document.pointerLockElement === RinEngine.renderer.domElement;
    },

    get pointerLock() {
        return this._pointerLock;
    },

    /**
     * 주어진 포인터(마우스) 버튼이 press 되었는지 반환합니다.
     * @param {number} buttonCode MouseEvent의 event.button 값을 받습니다.
     * @returns {boolean}
     */
    getPointer(buttonCode) {
        return this._pointer.has(buttonCode);
    },

    /**
     * 주어진 포인터(마우스) 버튼이 pressdown 되었는지 반환합니다.
     * @param {number} buttonCode MouseEvent의 event.button 값을 받습니다.
     * @returns {boolean}
     */
    getPointerDown(buttonCode) {
        return this._pointerDown.has(buttonCode);
    },

    /**
     * 주어진 포인터(마우스) 버튼이 pressup 되었는지 반환합니다.
     * @param {number} buttonCode MouseEvent의 event.button 값을 받습니다.
     * @returns {boolean}
     */

    getPointerUp(buttonCode) {
        return this._pointerUp.has(buttonCode);
    },

    /**
     * 주어진 키가 press 되었는지 반환합니다.
     * @param {string} keyCode Keyboard event의 event.code 값을 받습니다.
     * @returns {boolean}
     */
    getKey(keyCode) {
        return this._key.has(keyCode);
    },

    /**
     * 주어진 키가 keydown 되었는지 반환합니다.
     * @param {string} keyCode Keyboard event의 event.code 값을 받습니다.
     * @returns {boolean}
     */
    getKeyDown(keyCode) {
        return this._keyDown.has(keyCode);
    },

    /**
     * 주어진 키가 keyup 되었는지 반환합니다.
     * @param {string} keyCode Keyboard event의 event.code 값을 받습니다.
     * @returns {boolean}
     */
    getKeyUp(keyCode) {
        return this._keyUp.has(keyCode);
    },

    /**
     * 포인터 잠금 상태를 지정합니다.
     * @param {boolean} value
     */
    async setPointerLock(value) {
        this._pointerLock = value;

        if (value) {
            this.requestPointerLock();
        } else {
            document.exitPointerLock();
        }
    },

    /**
     * 포인터 잠가서 화면에서 숨기고, 화면 밖으로 나가지 않게 합니다.
     */
    async requestPointerLock() {
        // 사용자가 브라우저와 상호작용(click)을 했는가?
        if (this._userGesture === false) {
            return;
        }

        // 사용자가 1500ms 이내로 포인터 잠금을 강제로 푼 적이 있는가?
        // -> 1500ms 이내로 다시 요청하면 브라우저에서 에러를 발생시킴
        if (performance.now() - this._latestLockTime < 1500) {
            return;
        }

        // 포인터 잠금을 요청
        const canvas = RinEngine.renderer.domElement;
        await canvas.requestPointerLock({
            unadjustedMovement: true,
        });
    },

    /**
     * 브라우저의 포인터 잠금 상태를 내부 상태에 맞게 업데이트합니다.
     * 사용자가 ESC키를 눌렀거나, Alt-tab 등으로 RinEngine이 의도치 않게 포인트 잠금이 풀린 경우 이 함수를 사용합니다.
     */
    async updatePointerLock() {
        if (this.pointerLock && this.pointerLockApplyed === false) {
            this.requestPointerLock();
        }
    },

    /**
     * 이전 프레임에서 변경된 입력 상태들을 업데이트합니다.
     */
    _preUpdate() {
        const latest = this._latestPointerPosition;
        const current = this._pointerPosition;

        current.x += latest.dx;
        current.y += latest.dy;
        current.dx = latest.dx;
        current.dy = latest.dy;
    },

    /**
     * 다음 프레임을 위해서 오래된 입력 상태를 초기화합니다.
     */
    _postUpdate() {
        this._wheelDelta = 0;
        this._pointerDown.clear();
        this._pointerUp.clear();
        this._keyDown.clear();
        this._keyUp.clear();

        this._latestPointerPosition.dx = 0;
        this._latestPointerPosition.dy = 0;
    },
};

// 이벤트 리스너 등록
window.addEventListener("click", () => {
    RinInput._userGesture = true;
});

document.addEventListener("pointerlockchange", () => {
    // 포인터 잠금이 강제로 해제되었을 때
    if (
        RinInput.pointerLockApplyed === false &&
        RinInput.pointerLock === true
    ) {
        RinInput._latestLockTime = performance.now();
    }
});

window.addEventListener("mousemove", (event) => {
    if (RinInput.pointerLockApplyed) {
        RinInput._latestPointerPosition.dx += event.movementX;
        RinInput._latestPointerPosition.dy += event.movementY;
    }
});

window.addEventListener("wheel", (event) => {
    RinInput._wheelDelta += event.deltaY;
});

window.addEventListener("mousedown", (event) => {
    RinInput._pointerDown.add(event.button);
    RinInput._pointer.add(event.button);
});
window.addEventListener("mouseup", (event) => {
    RinInput._pointerUp.add(event.button);
    RinInput._pointer.delete(event.button);
});

window.addEventListener("keydown", (event) => {
    if (event.repeat) return;

    RinInput._keyDown.add(event.code);
    RinInput._key.add(event.code);
});
window.addEventListener("keyup", (event) => {
    RinInput._keyUp.add(event.code);
    RinInput._key.delete(event.code);
});

window.addEventListener("blur", () => {
    RinInput._wheelDelta = 0;
    RinInput._pointerDown.clear();
    RinInput._pointer.clear();
    RinInput._pointerUp.clear();
    RinInput._keyDown.clear();
    RinInput._key.clear();
    RinInput._keyUp.clear();
});
