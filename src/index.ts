import { WebSocket } from 'ws';
import { httpServer } from './http_server/index';
import { AddShipsMessage,  AddUserToRoomMessage,  AttackMessage,  RegistrationData, Room, Ship } from './types/types';
import { randomUUID } from 'crypto';
import { CustomWebSocket } from './ws/customwebsocket';
import { HTTP_PORT, players, wss } from './constants/constants';


console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

export const rooms: Room[] = [];
export const roomsOpen: Room[] = [];



wss.on('connection', function connection(ws: CustomWebSocket) {
    ws.on('message', function incoming(message) {
        const messageString = message.toString();
        console.log('Received:', messageString);
        handleMessage(ws, messageString);
    });

    ws.playerId = '';
    ws.name = '';

    ws.on('close', function close() {
        ws.playerId = undefined;
        ws.name = undefined;
    });
})

function handleMessage(ws: CustomWebSocket, message: string): void {
    try {
        const data = JSON.parse(message);
        if (data.type === 'reg') {
            registerPlayer(ws, data);
        } else if (data.type === 'create_room') {
            createRoom(ws);
        } else if (data.type === 'add_user_to_room') {
            addUserToRoom(ws, data);
        } else if (data.type === 'add_ships') {
            addShips(ws, data);
        }  else if (data.type === 'attack') {
            attack(ws, data);
        }
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
}


function registerPlayer(ws: CustomWebSocket, data: RegistrationData): void {
    console.log('Received registration data:', data);

    const { name, password } = JSON.parse(data.data);

    console.log("players:", players)

    const existingPlayer = players[name];
    if (existingPlayer) {
        console.log('User with the same name already exists online');

        if (existingPlayer.password !== password) {
            console.log('Incorrect password');
            return;
        }

        ws.playerId = existingPlayer.id;
        ws.name = existingPlayer.name;

        const responseData = {
            name: ws.name,
            index: ws.playerId,
            error: false,
            errorText: ""
        };
        const responseString = JSON.stringify(responseData);
        const registrationResponse = {
            type: "reg",
            data: responseString,
            id: 0
        };
        ws.send(JSON.stringify(registrationResponse));
        console.log('Registration response sent:', registrationResponse);
        updateRoomState();
    } else {
        const playerId = randomUUID();

        ws.playerId = playerId;
        ws.name = name;

        players[name] = { id: playerId, name: name, password: password };

        const responseData = {
            name: name,
            index: playerId,
            error: false,
            errorText: ""
        };
        const responseString = JSON.stringify(responseData);
        const registrationResponse = {
            type: "reg",
            data: responseString,
            id: 0
        };
        ws.send(JSON.stringify(registrationResponse));
        console.log('Registration response sent:', registrationResponse);
        updateRoomState();
    }
}


function createRoom(ws: WebSocket): string | undefined {
    // function createRoom(ws: WebSocket): { roomId: string, rooms: Room[] } | undefined {

    const customWS = ws as CustomWebSocket;

    console.log("playerId:", customWS.playerId);
    console.log("name:", customWS.name);

    if (!customWS.playerId || !customWS.name) {
        console.error('PlayerId or name is not set.');
        return;
    }

    customWS.currentRoomId = randomUUID();
    // const newRoom: Room = {
    //     id: customWS.currentRoomId,
    //     players: [customWS.playerId],
    //     creatorName: customWS.name
    // };

    // const newRoom: Room = {
    //     id: customWS.currentRoomId,
    //     players: [customWS.playerId],
    //     creatorName: customWS.name,
    //     ships: { [customWS.playerId]: [] }
    // };

    const newRoom: Room = {
        id: customWS.currentRoomId,
        players: [customWS.playerId],
        creatorName: customWS.name,
        ships: {}
    };


    rooms.push(newRoom);
    roomsOpen.push(newRoom);

    console.log("newRoom", newRoom);
    console.log("rooms", rooms);

    updateRoomState();

    return  customWS.currentRoomId;

}


function updateRoomState(): void {

    const singlePlayerRooms = roomsOpen.filter(room => room.players.length === 1);
    const formattedRooms = singlePlayerRooms.map(room => ({
        roomId: room.id,
        roomUsers: room.players.map(playerId => ({
            name: room.creatorName,
            index: playerId
        }))
    }));

    const updateRoomMessage = {
        type: "update_room",
        data: JSON.stringify(formattedRooms),
        id: 0
    };
    console.log("updateRoomMessage:", updateRoomMessage);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(updateRoomMessage));
        }
    });
}



function addUserToRoom(ws: WebSocket, data: AddUserToRoomMessage): void {

    const customWS = ws as CustomWebSocket;

    const { indexRoom } = JSON.parse(data.data);

    const roomOpen = roomsOpen.find(room => room.id === indexRoom);

    if (roomOpen) {
        if (roomOpen.players.includes(customWS.playerId as string)) {
            console.log('User is already in the room');
            return;
        }

        roomOpen.players.push(customWS.playerId as string);

        const gameId = randomUUID();

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                const customClient = client as CustomWebSocket;
                const createGameMessage = {
                    type: "create_game",
                    data: JSON.stringify({
                        idGame: gameId,
                        idPlayer: customClient.playerId
                    }),
                    id: 0
                };
                customClient.send(JSON.stringify(createGameMessage));
            }
        });

        const roomIndex = roomsOpen.indexOf(roomOpen);
        roomsOpen.splice(roomIndex, 1);
        updateRoomState();
    } else {
        console.error('Room not found');
    }
}




function addShips(ws: WebSocket, data: AddShipsMessage): void {
    console.log("roons addShis2", rooms)

    console.log("data:", data )
    const { ships, indexPlayer } = JSON.parse(data.data);


    const room = rooms.find(room => room.players.includes(indexPlayer));
    console.log("rooms:", rooms)
    console.log("roomsOPen:", roomsOpen)
    console.log("room:", room)


    // const room = rooms.find(room => room.players.includes(indexPlayer));
    // if (room) {
    //     room.ships[indexPlayer] = ships;

    // }
    console.log("room22:", room)
    console.log("SHIPS:", ships)


    if (!ships || !Array.isArray(ships) || ships.length === 0) {
        console.error('No ships data received');
        return;
    }



    const gameShips = ships.map((ship: Ship) => ({
        position: { x: ship.position.x, y: ship.position.y },
        direction: ship.direction,
        length: ship.length,
        type: ship.type
    }));

    const startGameMessage = {
        type: "start_game",
        data: JSON.stringify({
            ships: gameShips,
            currentPlayerIndex: indexPlayer
        }),
        id: 0
    };

    ws.send(JSON.stringify(startGameMessage));
    sendTurnInfo(indexPlayer);
}


function attack(ws: CustomWebSocket, data: AttackMessage): void {
    const { gameId, x, y, indexPlayer } = JSON.parse(data.data);
    console.log("DATA", data)
    console.log("DATA", data.data, x, y)

//
console.log("roons Atack", rooms)

const opponentRoom = rooms.find(room => room.players.includes(indexPlayer));
console.log("vopponentRoom :", opponentRoom )
    // if (!opponentRoom) {
    //     console.error('Room not found');
    //     return;
    // }


    const position = { x, y };
    const status = "shot"

    const feedbackMessage = {
        type: "attack",
        data: JSON.stringify({
            position: position,
            currentPlayer: indexPlayer,
            status: status
        }),
        id: 0
    };

    // ws.send(JSON.stringify(feedbackMessage));


    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(feedbackMessage));
        }
    });
    sendTurnInfo(indexPlayer);
}



function sendTurnInfo(currentPlayer: number): void {
    const turnMessage = {
        type: "turn",
        data: JSON.stringify({
            currentPlayer
        }),
        id: 0
    };


    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(turnMessage));
        }
    });
}
