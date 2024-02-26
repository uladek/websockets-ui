import { WebSocket } from 'ws';
import { httpServer } from './http_server/index';
import { AddShipsMessage,  AddUserToRoomMessage, GameState,  RegistrationData, Room, Ship } from './types/types';
import { randomUUID } from 'crypto';
import { CustomWebSocket } from './ws/customwebsocket';
import { HTTP_PORT, players, usersCreatingRooms, wss } from './constants/constants';
import { rooms, roomsOpen } from '../src/constants/constants'
import { attack, randomAttack } from './handlers/attack';


console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);


wss.on('connection', function connection(ws: CustomWebSocket) {
    ws.on('message', function incoming(message) {
        const messageString = message.toString();
        console.log('Received:', messageString);
        handleMessage(ws, messageString);
    });

    ws.playerId = '';
    ws.name = '';
    ws.currentRoomId = '';
    ws.gameId = '';


    ws.on('close', function close() {
        if (typeof ws.playerId !== 'undefined' && usersCreatingRooms[ws.playerId]) {
            delete usersCreatingRooms[ws.playerId];
        }
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
        else if (data.type === 'randomAttack') {
            randomAttack(ws, data.data);
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

    const customWS = ws as CustomWebSocket;

    console.log("playerId:", customWS.playerId);
    console.log("name:", customWS.name);

    if (!customWS.playerId || !customWS.name) {
        console.error('PlayerId or name is not set.');
        return;
    }

    if (usersCreatingRooms[customWS.playerId]) {
        console.error('User has already created a room.');
        return;
    }

    if (roomsOpen.some(room => room.players.length === 2)) {
        console.error('There are already 2 players in a room.');
        return;
    }

    customWS.currentRoomId = randomUUID();

    const newRoom: Room = {
        id: customWS.currentRoomId,
        players: [customWS.playerId],
        creatorName: customWS.name,
        ships: {},
        state: GameState.PlacingShips,
        creatorId: customWS.playerId,
        nextPlayerIndex:'',
        gameId: customWS.gameId,
        attacksByPlayer: {
            [customWS.playerId]: [],
        },

    };

    customWS.currentRoomId = newRoom.id;


    rooms.push(newRoom);
    roomsOpen.push(newRoom);

    console.log("newRoom", newRoom);
    console.log("rooms", rooms);

    usersCreatingRooms[customWS.playerId] = true;


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
    customWS.currentRoomId = indexRoom;


    if (!roomOpen) {
        console.error('Room not found');
        return;
    }

    if (roomOpen.players.length >= 2) {
        console.error('Room is already full');
        return;
    }


    if (roomOpen) {
        if (roomOpen.players.length >= 2) {
            console.error('Room is already full');
            return;
        }


        if (roomOpen.players.includes(customWS.playerId as string)) {
            console.log('User is already in the room');
            return;
        }

        const userCreatedRoomIndex = roomsOpen.findIndex(room => room.creatorId === customWS.playerId);

        console.log("333 userCreatedRoomIndex", userCreatedRoomIndex)
        if (userCreatedRoomIndex !== -1) {
            roomsOpen.splice(userCreatedRoomIndex, 1);
            console.log('User created room removed');
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

        roomOpen.gameId =  gameId;


        const roomIndex = roomsOpen.indexOf(roomOpen);
        roomsOpen.splice(roomIndex, 1);

        updateRoomState( );
    } else {
        console.error('Room not found');
    }
}


function addShips(ws: WebSocket, data: AddShipsMessage): void {
    const customWS = ws as CustomWebSocket;
    const { ships, indexPlayer } = JSON.parse(data.data);

    // const room = rooms.find(room => room.players.includes(indexPlayer));
    const room = rooms.find(room => room.id === customWS.currentRoomId);


    if (!room) {
        console.error('Room not found');
        return;
    }



    room.ships[indexPlayer] = ships.map((ship: Ship) => ({
        ...ship,
        hits: new Array(ship.length).fill(false)
    }));

    // room.ships[indexPlayer] = ships;


    const allPlayersPlacedShips = room.players.every(playerId => room.ships[playerId]);


    // if (allPlayersPlacedShips) {
        if (allPlayersPlacedShips && room.players.length === 2) { // Проверка, что в комнате присутствуют оба игрок

        room.state = GameState.InProgress;
        console.log('rooms addShips', rooms)
        console.log('roomsOpen addShips', roomsOpen)


        const gameShipsPlayer1 = room.ships[room.players[0]];
        const gameShipsPlayer2 = room.ships[room.players[1]];
        console.log("gameShipsPlayer1", gameShipsPlayer1)
        console.log("gameShipsPlayer2", gameShipsPlayer2)



        if (!gameShipsPlayer1 || !Array.isArray(gameShipsPlayer1) ||
            !gameShipsPlayer2 || !Array.isArray(gameShipsPlayer2)) {
            console.error('Invalid ships data');
            return;
        }

        const startGameMessage = {
                type: "start_game",
                data: JSON.stringify({
                    currentPlayerIndex: customWS.playerId
                }),
                id: 0
        };

        wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(startGameMessage));
        }
    });
    room.nextPlayerIndex =  customWS.playerId;


        sendTurnInfo(customWS);
    }
}



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
console.log("!!!! room.nextPlayerIndex", room.nextPlayerIndex)
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
