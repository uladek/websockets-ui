import { WebSocket } from 'ws';


export interface RegistrationData {
    name: string;
    error: boolean;
    errorText: string;
    data: string;
}

export interface AddUserToRoomMessage {
    type: string;
    data: {
        indexRoom: number;
    };
    id: number;
}


export interface Room {
    roomId: number;
    roomUsers: { ws: WebSocket }[];
}

export interface CreateGameMessage {
    type: string;
    data: {
        idGame: number;
        idPlayer: number;
    };
    id: number;
}
