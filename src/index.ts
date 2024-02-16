

// import { httpServer } from './src/http_server/index.ts';
import { WebSocketServer } from 'ws';
import { httpServer } from './http_server/index';


const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({ port: 3000});



const players = [];


// wss.on('message', function incoming(message: string) {
//     // Преобразовать буфер в строку
//     const messageString = message.toString();
//     console.log('Received:', messageString);

//     try {
//         // Преобразовать строку JSON в объект
//         const data = JSON.parse(messageString);
//         if (data.type === 'reg') {
//             // Преобразовать вложенную строку JSON в объект
//             const nestedData = JSON.parse(data.data);
//             if (nestedData.error) {
//                 console.error('Registration error:', nestedData.errorText);
//             } else {
//                 console.log('Registration successful for player:', nestedData.name);
//                 // Отправить тот же ответ обратно клиенту
//                 ws.send(JSON.stringify(data));
//             }
//         }
//     } catch (error) {
//         console.error('Error parsing JSON:', error);
//     }
// });
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message: string) {
        // Convert buffer to string
        const messageString = message.toString();
        console.log('Received:', messageString);

        try {
            // Parse JSON string to object
            const data = JSON.parse(messageString);
            if (data.type === 'reg') {
                // Parse nested JSON string to object
                const nestedData = JSON.parse(data.data);
                if (nestedData.error) {
                    console.error('Registration error:', nestedData.errorText);
                } else {
                    console.log('Registration successful for player:', nestedData.name);
                    // Send the same response back to the client
                    ws.send(JSON.stringify(data));
                }
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
});





// function registerPlayer(name: string, password: string) {
//     const player = { name, password, wins: 0 };
//     players.push(player);
//     return player;
// }
