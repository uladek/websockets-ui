
import { WebSocketServer, WebSocket } from 'ws';
import { httpServer } from './http_server/index';
import {  RegistrationData, Room } from './types/types';
import { randomUUID } from 'crypto';

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);


const wss = new WebSocketServer({ port: 3000 });
//
// const players = [];
// const players: { [key: string]: string } = {};

const rooms: Room[] = [];

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        const messageString = message.toString();
        console.log('Received:', messageString);

        try {
            const data = JSON.parse(messageString);
            if (data.type === 'reg') {
            registerPlayer(ws, data);

            } else if (data.type === 'create_room') {
                const roomId = createRoom();
                // const roomId = createRoom(ws, data);


                if (roomId !== undefined) {
                    // addPlayerToRoom(ws, roomId);
                }
            } else if (data.type === 'add_user_to_room') {
            console.log('data.type:', data.type)
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
});



function registerPlayer(ws: WebSocket, data: RegistrationData): void {
    console.log('Received nestedData:', data);
    const playerName = data.name;
    const playerId = randomUUID();


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

    // players.push({ name: playerName, index: playerId });
}

// function createRoom(ws: WebSocket, registrationData: RegistrationData): string | undefined {
    function createRoom(): string | undefined {


    const roomId = randomUUID();

    const newRoom = {
        id: roomId,
        players: []
        // players: [{ name: registrationData.name, index: registrationData.index }]

    };
    rooms.push(newRoom);

    // addPlayerToRoom(ws, roomId);



    updateRoomState();

    return roomId;
}


// async function addPlayerToRoom(ws: WebSocket, roomId: string): Promise<void> {
//     try {
//         const playerName = await getPlayerName(ws);
//         const playerId = await getPlayerId(ws);

//         const room = rooms.find(room => room.id === roomId);
//         if (room) {
//             room.players.push({ name: playerName, index: playerId });

//             updateRoomState();
//         }
//     } catch (error) {
//         console.error('Error adding player to room:', error);
//     }
// }


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


// function getPlayerName(ws: WebSocket): Promise<string> {
//     return new Promise((resolve, reject) => {
//         ws.once('message', (message: string) => {
//             try {
//                 const data = JSON.parse(message);
//                 if (data.type === 'reg') {
//                     resolve(data.name);
//                 } else {
//                     reject(new Error('Invalid registration message type'));
//                 }
//             } catch (error) {
//                 reject(error);
//             }
//         });
//     });
// }

// function getPlayerId(ws: WebSocket): Promise<string> {
//     return new Promise((resolve, reject) => {
//         ws.once('message', (message: string) => {
//             try {
//                 const data = JSON.parse(message);
//                 if (data.type === 'reg') {
//                     resolve(data.index);
//                 } else {
//                     reject(new Error('Invalid registration message type'));
//                 }
//             } catch (error) {
//                 reject(error);
//             }
//         });
//     });
// }

/////
