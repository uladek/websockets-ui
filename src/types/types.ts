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


// export interface Room {
//     roomId: number;
//     roomUsers: { ws: WebSocket }[];
// }


export interface Room {
    id: string;
    players: Player[];
}

export interface Player {
    name: string;
    index: string;
}





export interface CreateGameMessage {
    type: string;
    data: {
        idGame: number;
        idPlayer: number;
    };
    id: number;
}
