import { WebSocket } from 'ws';


export interface RegistrationData {
    name: string;
    error: boolean;
    index: string;
    errorText?: string;
    data: string;
}

export interface AddUserToRoomMessage {
    type: "add_user_to_room";
    data: string;
    id: number;
}


export type Player = string;

export interface Room {
    id: string;
    players: string[];
    creatorName: string;
}

export interface CustomWebSocket extends WebSocket {
    playerId?: string;
}

export interface AddShipsMessage {
    type: "add_ships";
    data: string;
    id: number;
}

export interface Ship {
    position: {
        x: number;
        y: number;
    };
    direction: boolean;
    length: number;
    type: "small" | "medium" | "large" | "huge";
}
