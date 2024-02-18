
import { WebSocketServer, WebSocket } from 'ws';
import { httpServer } from './http_server/index';
import { RegistrationData, Room } from './types/types';
import { randomUUID } from 'crypto';

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

let registeredPlayerId: string;

export interface CustomWebSocket extends WebSocket {
    playerId?: string;
}

// const wss = new WebSocketServer({ port: 3000 }) as WebSocketServer & { clients: Set<CustomWebSocket> };

const wss = new WebSocketServer({ port: 3000 });

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

                // const roomId = createRoom(ws, registeredPlayerId);
                // if (roomId !== undefined) {
                //     // addPlayerToRoom(ws, roomId);
                // }
            } else if (data.type === 'add_user_to_room') {
                addUserToRoom(ws, data);
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
});




function registerPlayer(ws: WebSocket, data: RegistrationData): void{
    console.log('Received nestedData:', data);
    const playerName = data.name;
    const playerId = randomUUID();

    registeredPlayerId = playerId;

    // players[playerId] = playerName;
    const responseData = {
        name: playerName,
        index: playerId,
        error: false,
        errorText: ""
    };
    const responseString = JSON.stringify(responseData);
    //  именно JSON.stringify в json формат
    const registrationResponse = {
        type: "reg",
        data: responseString,
        id: 0
    };
    ws.send(JSON.stringify(registrationResponse));
    console.log('RegistrationResponse:', registrationResponse);
    updateRoomState()

}

function createRoom(ws: WebSocket, playerId: string): string | undefined {

   const roomId = randomUUID();

    const newRoom = {
        id: roomId,
        players: [playerId]
    };
    rooms.push(newRoom);

    updateRoomState();
    return roomId;
}



function updateRoomState(): void {
    const roomData = JSON.stringify(rooms.map(room => ({
        roomId: room.id,
        roomUsers: room.players
    })));

    const updateRoomResponse = {
        type: "update_room",
        data: roomData,
        id: 0
    };
    console.log("RoomData:", roomData)

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(updateRoomResponse));
        }
    });
}

function addUserToRoom(ws: WebSocket, data: { type: string, data: { indexRoom: number }, id: number }) {
    const roomIndex = data.data.indexRoom;
    const room = rooms[roomIndex];

    if (room) {
        // ?? надо ли
        room.players.push(registeredPlayerId);

        //  createGame(ws, room);

        updateRoomState();
    }
}
