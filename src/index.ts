
import { WebSocketServer, WebSocket } from 'ws';
import { httpServer } from './http_server/index';
import { RegistrationData, Room } from './types/types';
import { randomUUID } from 'crypto';


const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);


const wss = new WebSocketServer({ port: 3000 });

const players = [];
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
                createRoom(ws);
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

    players.push({ name: playerName, index: playerId, id: playerId });
}


function createRoom(_ws: WebSocket) {
    const roomId = rooms.length + 1;
    const room: Room = {
        roomId: roomId,
        roomUsers: [{ ws: _ws }],
    };
    rooms.push(room);
}
