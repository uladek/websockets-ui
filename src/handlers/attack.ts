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
                            currentPlayer: indexPlayer, status: "killed"
                        }),
                        id: 0
                    };

                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(feedbackMessage));
                        }
                    });
                }

                for (let i = ship.position.x - 1; i <= ship.position.x + (isHorizontal ? 1 : ship.length); i++) {
                    for (let j = ship.position.y - 1; j <= ship.position.y + (isHorizontal ? ship.length : 1); j++) {
                        if (
                            i >= 0 && i < 10 && j >= 0 && j < 10 &&
                            !(i === x && j === y) &&
                            opponentShips.every(s => {
                                const isHorizontal = s.direction;
                                return !(
                                    isHorizontal ? i === s.position.x && j >= s.position.y && j < s.position.y + s.length :
                                        j === s.position.y && i >= s.position.x && i < s.position.x + s.length
                                );
                            })
                        ) {
                            const feedbackMessage = {
                                type: "attack",
                                data: JSON.stringify({
                                    position: { x: i, y: j },
                                    currentPlayer: indexPlayer,
                                    status: "miss"
                                }),
                                id: 0
                            };

                            wss.clients.forEach(client => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify(feedbackMessage));
                                }
                            });
                        }
                    }
                }
            } else {
                status = "shot";
            }
        } else {
            const isHorizontal = ship.direction;
            const aroundShip = isHorizontal ?
                (x === ship.position.x - 1 && y >= ship.position.y - 1 && y < ship.position.y + ship.length + 1) :
                (y === ship.position.y - 1 && x >= ship.position.x - 1 && x < ship.position.x + ship.length + 1);
            if (aroundShip) {
                status = "miss";
            }
        }
    });

    // playerRoom.attacks.push({ x, y, status });
    playerRoom.attacksByPlayer[indexPlayer].push({ x, y, status });



    if (status !== "killed") {
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
    }

    playerRoom.nextPlayerIndex = status === "miss" ? opponentId : indexPlayer;
    sendTurnInfo(ws);
}


// export function randomAttack(ws: CustomWebSocket, data: string): void {
//     const { gameId } = JSON.parse(data);
//     console.log('DATA', data);

//     const gameRoom = rooms.find(room => room.gameId === gameId);
//     console.log("gameRoom", gameRoom);

//     if (!gameRoom) {
//         console.error('Game room not found');
//         return;
//     }

//     let x = Math.floor(Math.random() * 10);
//     let y = Math.floor(Math.random() * 10);

//     let attackExists = gameRoom.attacks.some(attack => attack.x === x && attack.y === y);

//     while (attackExists) {
//         console.log(`Attack already made at position (${x}, ${y}). Generating new coordinates...`);
//         x = Math.floor(Math.random() * 10);
//         y = Math.floor(Math.random() * 10);
//         attackExists = gameRoom.attacks.some(attack => attack.x === x && attack.y === y)
//     }

//     const attackData = {
//         gameId,
//         x,
//         y,
//         indexPlayer: ws.playerId
//     };

//     attack(ws, { type: 'attack', data: JSON.stringify(attackData), id: 0 });
// }

export function randomAttack(ws: CustomWebSocket, data: string): void {
    const { gameId, indexPlayer } = JSON.parse(data);
    console.log('DATA', data);

    // Находим игровую комнату по gameId
    const gameRoom = rooms.find(room => room.gameId === gameId);
    console.log("gameRoom", gameRoom);

    if (!gameRoom) {
        console.error('Game room not found');
        return;
    }

    // Проверяем, есть ли информация об атаках в комнате для данного игрока
    if (!gameRoom.attacksByPlayer) {
        console.error('Attacks information not found for players in the game room');
        return;
    }

    // Получаем список атак для данного игрока
    let playerAttacks = gameRoom.attacksByPlayer[indexPlayer];
    console.log("playerAttacks ", playerAttacks )

    if (!playerAttacks) {
        // Если список атак для данного игрока еще не создан, создаем его
        playerAttacks = [];
        gameRoom.attacksByPlayer[indexPlayer] = playerAttacks;
    }

    let x = Math.floor(Math.random() * 10);
    let y = Math.floor(Math.random() * 10);

    // Проверяем, были ли уже атаки по этим координатам для данного игрока
    let attackExists = playerAttacks.some(attack => attack.x === x && attack.y === y);

    // Если атака уже существует, выводим сообщение и повторяем генерацию координат
    while (attackExists) {
        console.log(`Attack already made by player ${indexPlayer} at position (${x}, ${y}). Generating new coordinates...`);
        x = Math.floor(Math.random() * 10);
        y = Math.floor(Math.random() * 10);
        attackExists = playerAttacks.some(attack => attack.x === x && attack.y === y);
    }


    const attackData = {
        gameId,
        x,
        y,
        indexPlayer: ws.playerId
    };

    attack(ws, { type: 'attack', data: JSON.stringify(attackData), id: 0 });
}
