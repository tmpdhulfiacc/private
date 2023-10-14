const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const translate = require('@iamtraction/google-translate');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = createServer(app);
const io = new Server(server);
let username = 'ossipovaa_' //'di.promashik';

function helper(data) {
    console.log(data)
    translate(data.comment, {to: 'ru'}).then(res => {
        io.emit('chat message', 
            res.from.language.iso, res.text, data.comment, data
        );
    }).catch(err => {
        io.emit('chat message', 
            '-', data.comment, data.comment, data
        );
    });
}

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    let tiktokLiveConnection = new WebcastPushConnection(username);

    tiktokLiveConnection.connect().then(state => {
        console.info(`Connected to roomId ${state.roomId}`);
        io.emit('live connected', state.roomId);
    }).catch(err => {
        io.emit('live error');
    })
    
    tiktokLiveConnection.on('chat', helper);

    socket.on('disconnect', () => {
        tiktokLiveConnection.off('chat', helper);
        tiktokLiveConnection.disconnect();
    });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
