import styled from "styled-components";
import PropTypes from "prop-types";
import { getUVOffset } from "../librarys/worlds/block.js";
import tilemap from "../assets/textures/tilemap.png";
import BlockData from "../assets/json/blocks.json";

const Container = styled.div`
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);

    display: flex;
    align-items: center;
    gap: 8px;
`;

const Item = styled.div`
    width: 48px;
    height: 48px;
    background-color: #6f6f6f;
    border: 2px solid #3f3f3f;

    display: flex;
    align-items: center;
    justify-content: center;

    perspective: 1000px;

    &.select {
        background-color: #7f7f7f;
        outline: 4px solid #efefef;
    }
`;

const Icon = styled.img`
    position: absolute;

    width: 24px;
    height: 24px;
    object-fit: contain;
    flex-grow: 1;
    image-rendering: pixelated;

    &.right {
        transform-style: preserve-3d;
        transform: rotateX(-30deg) rotateY(-45deg) translateZ(12px);
    }

    &.front {
        transform-style: preserve-3d;
        transform: rotateX(-30deg) rotateY(45deg) translateZ(12px);
    }

    &.up {
        transform-style: preserve-3d;
        transform: rotateX(-30deg) rotateY(45deg) rotateX(90deg)
            translateZ(12px);
    }
`;

const tilemapImage = new Image();
tilemapImage.src = tilemap;

function getTileImage(id, tileSize) {
    const [x, y] = getUVOffset(id, tileSize);
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(
        tilemapImage,
        x * 16,
        (16 - y - 1) * 16,
        16,
        16,
        0,
        0,
        16,
        16
    );
    return canvas.toDataURL();
}

function QuickBar({ slots, active }) {
    const items = slots.map((item, index) => {
        const itemData = BlockData.find((data) => data.id === item);

        let rightTexture = null; // X+
        let upTexture = null; // Y+
        let frontTexture = null; // Z+

        if (typeof itemData.texture === "object") {
            rightTexture = getTileImage(itemData.texture[0]);
            upTexture = getTileImage(itemData.texture[2]);
            frontTexture = getTileImage(itemData.texture[4]);
        } else {
            rightTexture = getTileImage(itemData.texture);
            upTexture = getTileImage(itemData.texture);
            frontTexture = getTileImage(itemData.texture);
        }

        return (
            <Item key={index} className={active === index ? "select" : ""}>
                <Icon className="right" src={rightTexture} />
                <Icon className="up" src={upTexture} />
                <Icon className="front" src={frontTexture} />
            </Item>
        );
    });

    return <Container>{items}</Container>;
}

QuickBar.propTypes = {
    slots: PropTypes.array,
    active: PropTypes.number,
};

QuickBar.defaultProps = {
    slots: [],
    active: 0,
};

export default QuickBar;
