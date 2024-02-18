
import { WebSocketServer, WebSocket } from 'ws';
import { httpServer } from './http_server/index';
import { CustomWebSocket, RegistrationData, Room } from './types/types';
import { randomUUID } from 'crypto';

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

let registeredPlayerId: string;
let registeredName: string;
let currentRoomId: string | undefined;



const wss = new WebSocketServer({ port: 3000 }) as WebSocketServer & { clients: Set<CustomWebSocket> };

// const wss = new WebSocketServer({ port: 3000 });
// const players = [];
// const players: { [key: string]: string } = {};

const rooms: Room[] = [];

wss.on('connection', function connection(ws) {
// wss.on('connection', function connection(ws: CustomWebSocket) {

    ws.on('message', function incoming(message) {
        const messageString = message.toString();
        console.log('Received:', messageString);

        try {
            const data = JSON.parse(messageString);
            if (data.type === 'reg') {
                registerPlayer(ws, data);
            } else if (data.type === 'create_room') {
                 createRoom(ws, registeredPlayerId);
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
});



function registerPlayer(ws: WebSocket, data: RegistrationData): void{
    console.log('Received nestedData:', data);

    const nestedData = JSON.parse(data.data);
    const playerName = nestedData.name;

    const playerId = randomUUID();

    registeredPlayerId = playerId;
    registeredName = playerName;

    const responseData = {
        name: playerName,
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
    console.log('RegistrationResponse:', registrationResponse);
    // updateRoomState()
    updateRoomState(playerName);
}

// function createRoom(ws: WebSocket, playerId: string): string | undefined {

//    currentRoomId = randomUUID()
//     const newRoom = {
//         id: currentRoomId,
//         players: [playerId]
//     };
//     rooms.push(newRoom);
//     console.log("newRoom", newRoom)
//     updateRoomState();

//     return currentRoomId;
// }

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
