
import WebSocket from 'ws';

export class CustomWebSocket extends WebSocket {
    playerId: string | undefined;
    name: string | undefined;
    currentRoomId: string | undefined;


    constructor(address: string, protocols?: string | string[]) {
        super(address, protocols);
        this.playerId = undefined;
        this.name = undefined;
        this.currentRoomId = undefined;
    }
}
