import { WebSocket } from 'ws';


export interface RegistrationData {
    name: string;
    error: boolean;
    index: string;
    errorText?: string;
    data: string;
}

export interface AddUserToRoomMessage {
    type: string;
    data: {
        indexRoom: string;
    };
    id: number;
}


export type Player = string;

export interface Room {
    id: string;
    players: Player[];
}




export interface CreateGameMessage {
    type: string;
    data: {
        idGame: number;
        idPlayer: number;
    };
    id: number;
}
