import { useEffect, useState } from "react";
import styled from "styled-components";
import { Log } from "../librarys/log.js";
import PropTypes from "prop-types";

const Container = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    z-index: 1;

    display: flex;
    justify-content: center;
    align-items: center;

    background-color: rgba(0, 0, 0, 0.7);
    color: white;

    font-size: 48px;
    font-weight: 500;

    &.hidden {
        display: none;
    }
`;

const Message = styled.div`
    padding: 32px;
    border: 2px dashed #ffffff;
    border-radius: 16px;
    background-color: #2f2f2f;

    display: flex;
    justify-content: center;
    align-items: center;
`;

// 외부 3D 모델 로드에 사용될 예정이었던 컴포넌트
// 여러 사정상 미구현
function DragAndDrop({ scene }) {
    const [active, setActive] = useState(false);

    // DnD 컴포넌트가 처음에는 활성화 되어 있지 않으므로
    // window 객체에 dragenter 이벤트를 등록
    useEffect(() => {
        window.addEventListener("dragenter", onDragEnter);

        return () => {
            window.removeEventListener("dragenter", onDragEnter);
        };
    });

    /**
     * @param {DragEvent} event
     */
    function onDrop(event) {
        event.preventDefault();
        handleDropItems(event.dataTransfer.items);
        setActive(false);
    }

    function onDragEnter(event) {
        setActive(true);
    }

    function onDragOver(event) {
        event.preventDefault();
    }

    function onDragLeave(event) {
        setActive(false);
    }

    function handleDropItems(items) {
        if (!items) {
            // 드랍된 아이템이 없음
            return;
        }

        const item = items[0];

        if (item.kind !== "file") {
            // 드랍된 아이템이 파일이 아님
            return;
        }

        const file = item.getAsFile();

        if (file.name.endsWith(".glb") === false) {
            // 드랍된 파일이 glb가 아님
            return;
        }

        // File 정보를 ArrayBuffer로 읽어들이기
        const reader = new FileReader();

        reader.onload = (event) => {
            const arrayBuffer = event.target.result;

            // if (scene && scene.world) {
            //     scene.world.customModelBuffer = arrayBuffer;
            // }
        };

        reader.readAsArrayBuffer(file);
    }

    return (
        <Container
            className={active ? "" : "hidden"}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            불러올 glb 파일을 여기로 드래그 앤 드롭하세요.
        </Container>
    );
}

DragAndDrop.propTypes = {
    scene: PropTypes.object,
};

export default DragAndDrop;
