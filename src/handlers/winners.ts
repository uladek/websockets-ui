import { WebSocket } from 'ws';
import { players, winners, wss } from "../constants/constants";

export function updateWinners(winPlayer?: string): void {
    if (!winPlayer) {
        console.log('No winner found. Updating winners with current data:', winners);

        const updateWinnersMessage = {
            type: "update_winners",
            data: JSON.stringify(winners),
            id: 0
        };

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(updateWinnersMessage));
            }
        });
        return;
    }



    const winnerIndex = winners.findIndex(winner => winner.name === winPlayer);
    const winnerData = Object.values(players).find(player => player.id === winPlayer);
    const winnerName = winnerData ? winnerData.name : '';


    if (winnerIndex !== -1) {
        winners[winnerIndex].wins++;
    } else {
        winners.push({ name: winnerName, wins: 1 });
    }

    const winnersData = winners.map(winner => ({
        name: winner.name,
        wins: winner.wins
    }));

    const updateWinnersMessage = {
        type: "update_winners",
        data: JSON.stringify(winnersData),
        id: 0
    };

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(updateWinnersMessage));
        }
    });
}
