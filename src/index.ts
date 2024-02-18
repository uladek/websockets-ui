
import { WebSocketServer, WebSocket } from 'ws';
import { httpServer } from './http_server/index';
import { RegistrationData, Room } from './types/types';
import { randomUUID } from 'crypto';

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

let registeredPlayerId: string;
let registeredName: string;
let currentRoomId: string | undefined;

// export interface CustomWebSocket extends WebSocket {
//     playerId?: string;
// }

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

            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
});




function registerPlayer(ws: WebSocket, data: RegistrationData): void{
    console.log('Received nestedData:', data);
    // const playerName = data.name;
    // const playerName = data.name;
    // const playerName = JSON.parse(data.data); // Парсим строку JSON в объект

    // const playerId = randomUUID();

    // registeredPlayerId = playerId;
    // registeredName = playerName;

    //
    const nestedData = JSON.parse(data.data); // Парсим строку JSON в объект
    const playerName = nestedData.name; // Получаем значение поля "name" из объекта

    const playerId = randomUUID();

    registeredPlayerId = playerId;
    registeredName = playerName;

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
    // updateRoomState()

}

function createRoom(ws: WebSocket, playerId: string): string | undefined {

//    const roomId = randomUUID();
   currentRoomId = randomUUID()

    const newRoom = {
        id: currentRoomId,
        players: [playerId]
    };
    rooms.push(newRoom);
    console.log("newRoom", newRoom)
    updateRoomState();


    return currentRoomId;
}



function updateRoomState(): void {
    const singlePlayerRooms = rooms.filter(room => room.players.length === 1);
    console.log("registeredName", registeredName)
    const formattedRooms = singlePlayerRooms.map(room => ({
        roomId: room.id,
        roomUsers: room.players.map(playerId => ({
            name: registeredName, // Assuming name is stored globally for now
            index: playerId
        }))
    }));

    const updateRoomMessage = {
        type: "update_room",
        data: JSON.stringify(formattedRooms),
        id: 0
    };
    console.log(" updateRoomMessage :",  updateRoomMessage )

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(updateRoomMessage));
        }
    });
}




// function updateRoomState(): void {
//     const roomData = JSON.stringify(rooms.map(room => ({
//         roomId: room.id,
//         roomUsers: room.players
//     })));

//     const updateRoomResponse = {
//         type: "update_room",
//         data: roomData,
//         id: 0
//     };
//     console.log("RoomData:", roomData)

//     wss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(JSON.stringify(updateRoomResponse));
//         }
//     });
// }

//
// function updateRoomState(registeredName: string): void {
//     const singlePlayerRooms = rooms.filter(room => room.players.length === 1);

//     const roomData = JSON.stringify(singlePlayerRooms.map(room => ({
//         roomId: room.id,
//         roomUsers: room.players.map(playerId => ({
//             name: registeredName,
//             index: playerId,
//         }))
//     })));
//     console.log("roomData :", roomData )

//     const updateRoomResponse = {
//         type: "update_room",
//         data: roomData,
//         id: 0
//     };

//     wss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(JSON.stringify(updateRoomResponse));
//         }
//     });
// }




// function addUserToRoom() {


//     const roomId = currentRoomId;

//     if (roomId !== undefined) {
//         console.log("roomIndex ", roomId);

//         const room = rooms.find(room => room.id === roomId);

//         console.log("roomIndex ", roomId);
//         console.log("room.id  ", rooms );

//         if (room) {
//             if (!room.players.includes(registeredPlayerId)) {
//                 console.log("Adding player to room");
//                 room.players.push(registeredPlayerId);
//                 updateRoomState();
//             } else {
//                 console.log("Player already exists in the room");
//             }
//         } else {
//             console.error("Room not found");
//         }
//     } else {
//         console.error("RoomId is undefined");
//     }
// }
// function addUserToRoom() {
//     const roomId = currentRoomId;

//     if (roomId !== undefined) {
//         const room = rooms.find(room => room.id === roomId);

//         if (room) {
//             if (!room.players.includes(registeredPlayerId)) {
//                 console.log("Adding player to room");
//                 room.players.push(registeredPlayerId);
//                 updateRoomState();

//                 // Create game session
//                 const gameId = generateGameId();
//                 const currentPlayerIndex = room.players.indexOf(registeredPlayerId);
//                 const enemyPlayerId = room.players.find(playerId => playerId !== registeredPlayerId);
//                 console.log("enemyPlayerId", enemyPlayerId)


//                 if (enemyPlayerId !== undefined) {
//                     // Send create_game message to both players
//                     const createGameMessage = {
//                         type: "create_game",
//                         data: {
//                             idGame: gameId,
//                             idPlayer: currentPlayerIndex, // Use currentPlayerIndex as idPlayer
//                         },
//                         id: 0
//                     };
//                     console.log("createGameMessage:", createGameMessage)

//                     // Send create_game message to both players
//                     wss.clients.forEach(client => {

//                         if ((client as CustomWebSocket).playerId === registeredPlayerId || (client as CustomWebSocket).playerId === enemyPlayerId) {
//                             client.send(JSON.stringify(createGameMessage));
//                             console.log("createGameMessage:", createGameMessage)
//                         }
//                     });


//                 } else {
//                     console.error("Enemy player ID is undefined");
//                 }
//             } else {
//                 console.log("Player already exists in the room");
//             }
//         } else {
//             console.error("Room not found");
//         }
//     } else {
//         console.error("RoomId is undefined");
//     }
// }

// function addUserToRoom() {
//     const roomId = currentRoomId;

//     if (roomId !== undefined) {
//         const room = rooms.find(room => room.id === roomId);

//         if (room) {
//             if (!room.players.includes(registeredPlayerId)) {
//                 console.log("Adding player to room");
//                 room.players.push(registeredPlayerId);
//                 updateRoomState();

//                 // Create game session
//                 const gameId = generateGameId();
//                 // const currentPlayerIndex = room.players.indexOf(registeredPlayerId);
//                 // const currentPlayerIndex = registeredPlayerId;

//                 const enemyPlayerId = room.players.find(playerId => playerId !== registeredPlayerId);
//                 console.log("enemyPlayerId", enemyPlayerId)

//                 if (enemyPlayerId !== undefined) {
//                     // Send create_game message to both players
//                     const createGameMessage = {
//                         type: "create_game",
//                         data: JSON.stringify({
//                             idGame: gameId,
//                             idPlayer: registeredPlayerId, // Use currentPlayerIndex as idPlayer
//                         }),
//                         id: 0
//                     };
//                     console.log("createGameMessage:", createGameMessage);


//                     // Send create_game message to both players
//                     wss.clients.forEach(client => {
//                         if ((client as CustomWebSocket).playerId === registeredPlayerId || (client as CustomWebSocket).playerId === enemyPlayerId) {
//                             console.log("Sending create_game message to client:", (client as CustomWebSocket).playerId);
//                             client.send(JSON.stringify(createGameMessage));
//                             console.log("createGameMessage:", createGameMessage)
//                         }
//                     });

//                 } else {
//                     console.error("Enemy player ID is undefined");
//                 }
//             } else {
//                 console.log("Player already exists in the room");
//             }
//         } else {
//             console.error("Room not found");
//         }
//     } else {
//         console.error("RoomId is undefined");
//     }
// }



// function generateGameId() {
//     return randomUUID();
//     // Generate a unique game ID here
//     // You can implement your own logic for generating game IDs
// }
