import { useEffect, useRef } from "react";
import "./App.css";
import styled from "styled-components";
import { createGame, useStats } from "./librarys/main.jsx";

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    width: 100%;
    height: 100%;
`;

const Debug = styled.div`
    position: absolute;
    right: 12px;
    top: 12px;
    padding: 8px;
    background-color: black;
    color: white;

    font-family: "Courier New", Courier, monospace;
    font-weight: 400;
    font-style: normal;
`;

const Canvas = styled.canvas`
    width: 100%;
    height: 100%;
`;

function App() {
    const ref = useRef(null);
    const debugRef = useRef(null);

    useEffect(() => {
        if (ref && ref.current && debugRef && debugRef.current) {
            createGame(ref.current, debugRef.current);
        }
    }, [ref]);

    const stats = useStats();

    return (
        <Container>
            {stats}
            <Debug ref={debugRef}></Debug>
            <Canvas ref={ref} />
        </Container>
    );
}

export default App;
