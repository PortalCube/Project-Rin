import styled from "styled-components";
import PropTypes from "prop-types";
import { getUVOffset } from "../librarys/worlds/block.js";
import tilemap from "../assets/textures/tilemap.png";
import BlockData from "../assets/json/blocks.json";
import { useEffect, useState } from "react";
import { GameScene } from "../librarys/scenes/game.js";

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

    /* perspective를 크게 지정하여 3d rotate를 isometric view처럼 보이게 만들기 */
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

    /* CSS rotate3D를 사용하여 cube 그리기 */
    &.right {
        transform-style: preserve-3d;
        transform: rotateX(-30deg) rotateY(45deg) translateZ(12px);
        filter: brightness(0.7);
    }

    &.front {
        transform-style: preserve-3d;
        transform: rotateX(-30deg) rotateY(-45deg) translateZ(12px);
        filter: brightness(0.9);
    }

    &.up {
        transform-style: preserve-3d;
        transform: rotateX(-30deg) rotateY(45deg) rotateX(90deg)
            translateZ(12px);
    }
`;

const tilemapImage = new Image();
tilemapImage.src = tilemap;

/**
 * Canvas element를 사용하여 tilemap에서 특정 tile의 이미지를 base64로 추출합니다.
 * @param {number} id 타일 ID
 * @param {number} tileSize 타일 크기
 * @returns {string} base64 img string
 */
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

function QuickBar({ scene }) {
    const [active, setActive] = useState(0);
    const [slots, setQuickSlotItems] = useState([]);

    useEffect(() => {
        if (scene !== null) {
            // Scene에 이벤트 등록
            scene.addEventListener("playerSlotChange", (event) => {
                setActive(event.value);
            });

            scene.addEventListener("playerSlotListChange", (event) => {
                setQuickSlotItems(event.value.slice(0));
            });

            if (scene.player) {
                // 게임에서 퀵 슬롯 값을 가져오기
                setQuickSlotItems(scene.player.quickSlot.slice(0));
            }
        }
    }, [scene]);

    // 퀵 슬롯 데이터를 이미지 element로 생성
    const items = slots.map((item, index) => {
        const itemData = BlockData.find((data) => data.id === item);

        let rightTexture = null; // X+
        let upTexture = null; // Y+
        let frontTexture = null; // Z+

        if (itemData === undefined) {
            // do nothing
        } else if (typeof itemData.texture === "object") {
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
    scene: PropTypes.object,
};

export default QuickBar;
