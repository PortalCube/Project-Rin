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

export const RinInput = {
    _pointerPosition: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
    },

    _latestPointerPosition: {
        x: 0,
        y: 0,
    },

    _wheelDelta: 0,

    _pointerDown: new Set(),
    _pointer: new Set(),
    _pointerUp: new Set(),

    _keyDown: new Set(),
    _key: new Set(),
    _keyUp: new Set(),

    get pointerPosition() {
        return this._pointerPosition;
    },

    get wheelDelta() {
        return this._wheelDelta;
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
     * 이전 프레임에서 변경된 입력 상태들을 업데이트합니다.
     */
    _preUpdate() {
        this._pointerPosition.dx =
            this._latestPointerPosition.x - this._pointerPosition.x;
        this._pointerPosition.dy =
            this._latestPointerPosition.y - this._pointerPosition.y;
        this._pointerPosition.x = this._latestPointerPosition.x;
        this._pointerPosition.y = this._latestPointerPosition.y;
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
    },
};

// 이벤트 리스너 등록
window.addEventListener("mousemove", (event) => {
    RinInput._latestPointerPosition.x = event.clientX;
    RinInput._latestPointerPosition.y = event.clientY;
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
