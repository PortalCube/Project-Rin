import { useEffect, useRef } from "react";
import "./App.css";
import styled from "styled-components";
import { createGame } from "./librarys/main.js";

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    width: 100%;
    height: 100%;
`;

const Canvas = styled.canvas`
    width: 100%;
    height: 100%;
`;

function App() {
    const ref = useRef(null);

    useEffect(() => {
        if (ref && ref.current) {
            createGame(ref.current);
        }
    }, [ref]);

    return (
        <Container>
            <Canvas ref={ref} />
        </Container>
    );
}

export default App;
