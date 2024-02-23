import { WebSocketServer } from "ws";
import { CustomWebSocket } from "../ws/customwebsocket";
import { Room } from "../types/types";

export const HTTP_PORT = 8181;
export const players: {
        [key: string]: {
            id: string,
            name: string,
            password: string }
        } = {};
export const wss = new WebSocketServer(
    { port: 3000 }) as WebSocketServer & { clients: Set<CustomWebSocket>
    };

export const usersCreatingRooms: { [userId: string]: boolean } = {};
