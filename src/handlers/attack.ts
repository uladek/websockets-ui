import { WebSocket } from 'ws';

import { wss } from "../constants/constants";
import { AttackMessage } from "../types/types";
import { CustomWebSocket } from "../ws/customwebsocket";
import { rooms } from '../constants/constants';
import { sendTurnInfo } from '..';

export function attack(ws: CustomWebSocket, data: AttackMessage): void {
    const { gameId, x, y, indexPlayer } = JSON.parse(data.data);
    const playerRoom = rooms.find(room => room.players.includes(indexPlayer));
    if (!playerRoom) {
        console.error('Player room not found');
        return;
    }

    if (playerRoom.nextPlayerIndex !== indexPlayer) {
        console.error('It is not your turn to attack');
        return;
    }

    const opponentId = playerRoom.players.find(playerId => playerId !== indexPlayer);
    if (!opponentId) {
        console.error('Opponent not found');
        return;
    }

    const opponentShips = playerRoom.ships[opponentId];
    if (!opponentShips) {
        console.error('Opponent ships not found');
        return;
    }

    const position = { x, y };
    let status = "miss";



    opponentShips.forEach(ship => {
        const isHorizontal = ship.direction;
        const posCheck = isHorizontal ? x === ship.position.x && y >= ship.position.y && y < ship.position.y + ship.length :
                                        y === ship.position.y && x >= ship.position.x && x < ship.position.x + ship.length;
        if (posCheck) {
            const index = isHorizontal ? y - ship.position.y : x - ship.position.x;
            ship.hits[index] = true;
            if (ship.hits.every(hit => hit)) {
                status = "killed";
                for (let i = 0; i < ship.length; i++) {
                    ship.hits[i] = true;
                    const feedbackMessage = {
                        type: "attack",
                        data: JSON.stringify({
                            position: isHorizontal ? { x: ship.position.x, y: ship.position.y + i } : { x: ship.position.x + i, y: ship.position.y },
                            currentPlayer: indexPlayer, status: "killed" }),
                            id: 0 };

                    wss.clients.forEach(client => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify(feedbackMessage));
                                }
                            });
                }
            } else status = "shot";
        }
    });


    const feedbackMessage = {
        type: "attack",
        data: JSON.stringify({
            position: position,
            currentPlayer: indexPlayer,
            status: status
        }),
        id: 0
    };

    wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(feedbackMessage));
                }
            });

    playerRoom.nextPlayerIndex = status === "miss" ? opponentId : indexPlayer;
    sendTurnInfo(ws);
}
