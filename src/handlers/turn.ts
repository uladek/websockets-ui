import { WebSocket } from 'ws';
import { rooms, wss } from "../constants/constants";
import { CustomWebSocket } from "../ws/customwebsocket";

export function sendTurnInfo(ws: WebSocket): void {

    const customWS = ws as CustomWebSocket;

    console.log("customWS.currentRoomId", customWS.currentRoomId)
    const room = rooms.find(room => room.id === customWS.currentRoomId);
    console.log("rooms", rooms)
    console.log("ROOM", room)

    if (!room) {
        console.error('Room not found for player');
        return;
    }
    const turnMessage = {
        type: "turn",
        data: JSON.stringify({
            currentPlayer: room.nextPlayerIndex,
        }),
        id: 0
    };

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(turnMessage));
        }
    });
}
