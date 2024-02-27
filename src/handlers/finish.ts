import { WebSocket } from 'ws';
import { wss } from "../constants/constants";
import { updateWinners } from "./winners";

export function finishGame(winPlayer: string): void {
    const finishMessage = {
        type: "finish",
        data: JSON.stringify({
            winPlayer
        }),
        id: 0
    };

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(finishMessage));
        }
    });

    updateWinners(winPlayer);
}
