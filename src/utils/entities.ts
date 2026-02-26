export interface Ball {
    x: number;
    y: number;
    size: number;
}

export interface Circle extends Ball {
    id: number;
    dx: number;
    dy: number;
}

export interface Physics {
    velocity: { x: number; y: number };
    acceleration: { x: number; y: number };
}

export interface Bubble {
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    velocity: { x: number; y: number };
}

export interface UpdateBubbles {
    bubbles: Bubble[];
    playerX: number;
    playerY: number;
    velocity: { x: number; y: number };
    nextBubbleId: number;
}

export interface GameConfig {
    BOARD_WIDTH: number;
    BOARD_HEIGHT: number;
    INITIAL_PLAYER_SIZE: number;
}

export interface HunterBall extends Circle {
    targetX: number;
    targetY: number;
    huntingSpeed: number;
    detectionRange: number;
    isHunting: boolean;
    lastPlayerX?: number;
    lastPlayerY?: number;
}

export const gameConfig: GameConfig = {
    BOARD_WIDTH: 3000,
    BOARD_HEIGHT: 3000,
    INITIAL_PLAYER_SIZE: 30
};
