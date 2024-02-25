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


export enum GameState {
    WaitingForPlayers = 'waiting_for_players',
    PlacingShips = 'placing_ships',
    InProgress = 'in_progress'
}

export interface Room {
    id: string;
    players: string[];
    creatorName: string;
    ships: { [playerId: string]: Ship[] };
    state: GameState;
    creatorId: string;
    nextPlayerIndex: string | undefined;
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
    hits: boolean[];
}

export interface AttackMessage {
    type: "attack";
    data: string;
    id: 0;
}
