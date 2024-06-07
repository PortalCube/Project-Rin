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

    &.select {
        background-color: #7f7f7f;
        outline: 4px solid #efefef;
    }
`;

const Icon = styled.img`
    width: 36px;
    height: 36px;
    object-fit: contain;
    flex-grow: 1;
    image-rendering: pixelated;
`;

const tilemapImage = new Image();
tilemapImage.src = tilemap;

function QuickBar({ slots, active }) {
    const items = slots.map((item, index) => {
        const itemData = BlockData.find((data) => data.id === item);
        const textureId =
            typeof itemData.texture === "object"
                ? itemData.texture[0]
                : itemData.texture;
        const uvOffset = getUVOffset(textureId, 16);

        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(
            tilemapImage,
            uvOffset[0] * 16,
            (16 - uvOffset[1] - 1) * 16,
            16,
            16,
            0,
            0,
            16,
            16
        );
        const base64URL = canvas.toDataURL();

        return (
            <Item key={index} className={active === index ? "select" : ""}>
                <Icon src={base64URL} />
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
