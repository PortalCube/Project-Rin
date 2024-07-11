import { useEffect, useRef, useState } from "react";
import "./App.css";
import styled from "styled-components";
import { useGame, useStats } from "./librarys/main.jsx";
import QuickBar from "./components/QuickBar.jsx";
import DragAndDrop from "./components/DragAndDrop.jsx";
import { Log } from "./librarys/log.js";

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    /* 텍스트 드래그 비활성화 */
    user-select: none;

    width: 100%;
    height: 100%;
`;

const Debug = styled.div`
    min-width: 300px;
    position: absolute;
    left: 12px;
    bottom: 12px;
    padding: 8px;
    background-color: black;
    color: white;

    font-family: "consolas", "Courier New", Courier, monospace;
    font-weight: 400;
    font-style: normal;

    white-space: pre-wrap;
`;

const Canvas = styled.canvas`
    width: 100%;
    height: 100%;
`;

function App() {
    const ref = useRef(null);
    const debugRef = useRef(null);
    const scene = useGame(ref);
    const stats = useStats();

    useEffect(() => {
        if (debugRef && debugRef.current) {
            Log.element = debugRef.current;
        }
    });

    return (
        <Container>
            {stats}
            <DragAndDrop scene={scene} />
            <QuickBar scene={scene} />
            <Debug ref={debugRef}></Debug>
            <Canvas ref={ref} />
        </Container>
    );
}

export default App;
