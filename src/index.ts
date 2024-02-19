
import { WebSocketServer, WebSocket } from 'ws';
import { httpServer } from './http_server/index';
import { AddShipsMessage, AddUserToRoomMessage, CustomWebSocket, RegistrationData, Room, Ship } from './types/types';
import { randomUUID } from 'crypto';

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

let registeredPlayerId: string;
let registeredName: string;
let currentRoomId: string | undefined;
const players: { [key: string]: { id: string, name: string, password: string } } = {};


const wss = new WebSocketServer({ port: 3000 }) as WebSocketServer & { clients: Set<CustomWebSocket> };

// const wss = new WebSocketServer({ port: 3000 });
// const players = [];



const rooms: Room[] = [];

// wss.on('connection', function connection(ws) {
// // wss.on('connection', function connection(ws: CustomWebSocket) {

//     ws.on('message', function incoming(message) {
//         const messageString = message.toString();
//         console.log('Received:', messageString);

//         try {
//             const data = JSON.parse(messageString);
//             if (data.type === 'reg') {
//                 registerPlayer(ws, data);
//             } else if (data.type === 'create_room') {
//                  createRoom(ws, registeredPlayerId);
//             } else if (data.type === 'add_user_to_room') {
//                 addUserToRoom(ws, data);
//             } else if (data.type === 'add_ships') {
//                 addShips(ws, data);
//             }
//         } catch (error) {
//             console.error('Error parsing JSON:', error);
//         }
//     });
// });

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        const messageString = message.toString();
        console.log('Received:', messageString);
        handleMessage(ws, messageString);
    });
});

function handleMessage(ws: WebSocket, message: string): void {
    try {
        const data = JSON.parse(message);
        if (data.type === 'reg') {
            registerPlayer(ws, data);
        } else if (data.type === 'create_room') {
            createRoom(ws, registeredPlayerId);
        } else if (data.type === 'add_user_to_room') {
            addUserToRoom(ws, data);
        } else if (data.type === 'add_ships') {
            addShips(ws, data);
        }
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
}



function registerPlayer(ws: WebSocket, data: RegistrationData): void {
    console.log('Received registration data:', data);

    const { name, password } = JSON.parse(data.data);

    console.log("players:", players)

    const existingPlayer = players[name];
    if (existingPlayer) {
        console.log('User with the same name already exists');

        if (existingPlayer.password !== password) {
            console.log('Incorrect password');
            return;
        }

        registeredPlayerId = existingPlayer.id;
        registeredName = existingPlayer.name;

        const responseData = {
            name: existingPlayer.name,
            index: existingPlayer.id,
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
        updateRoomState(existingPlayer.name);
    } else {
        const playerId = randomUUID();

        registeredPlayerId = playerId;
        registeredName = name;

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
        updateRoomState(name);
    }
}



function createRoom(ws: WebSocket, playerId: string): string | undefined {
    currentRoomId = randomUUID();
    const creatorName = registeredName;
    const newRoom: Room = {
        id: currentRoomId,
        players: [playerId],
        creatorName: creatorName
    };
    rooms.push(newRoom);
    console.log("newRoom", newRoom);
    updateRoomState(creatorName);

    return currentRoomId;
}


function updateRoomState(creatorName: string): void {
    const singlePlayerRooms = rooms.filter(room => room.players.length === 1);
    console.log("creatorName", creatorName);
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


// function addUserToRoom(ws: WebSocket, data: AddUserToRoomMessage): void {
function addUserToRoom(ws: WebSocket, data: AddUserToRoomMessage): void {

    console.log("data:", data)

    const indexRoom= JSON.parse(data.data).indexRoom;

    const room = rooms.find(room => room.id === indexRoom);

    if (room) {

        if (room.players.includes(registeredPlayerId)) {
            console.log('User is already in the room');
            return;
        }

        room.players.push(registeredPlayerId);

        const gameId = randomUUID();

        const createGameMessage = {
            type: "create_game",
            data: JSON.stringify({
                idGame: gameId,
                idPlayer: registeredPlayerId
            }),
            id: 0
        };


        // room.players.forEach(playerId => {
            console.log(" room.players: ",  room.players)
            // console.log(" playerId : ",  playerId )

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(createGameMessage));
                }
            });

            // ws.send(JSON.stringify(createGameMessage));
            // console.log('Create game message sent:', createGameMessage);

            // wss.clients.forEach(client => {
            //     if (client.readyState === WebSocket.OPEN && (client as CustomWebSocket).playerId !== playerId) {
            //         client.send(JSON.stringify(createGameMessage));
            //     }
            // });

            // wss.clients.forEach(client => {
            //     if (client.readyState === WebSocket.OPEN && (client as CustomWebSocket).playerId === playerId) {
            //         client.send(JSON.stringify(createGameMessage));
            //     }
            // });
        // });


        const roomIndex = rooms.indexOf(room);
        rooms.splice(roomIndex, 1);
        updateRoomState(registeredName);


    } else {
        console.error('Room not found');
    }
}




function addShips(ws: WebSocket, data: AddShipsMessage): void {
    console.log("data:", data )
    const { ships, indexPlayer } = JSON.parse(data.data);
    // const ships = JSON.parse(data.data).ships;

    console.log("ships:", ships)


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
}
