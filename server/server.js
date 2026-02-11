const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { error } = require('console');

const app = express();
const server = http.createServer(app);
const io = socketIo(server)

app.use(cors());
app.use(express.json());
app.use('/images', express.static('../images'));

const candidates = {
    'Amuneke Party': {name: 'Gov Amune', Votes: 0, image: './images/amune.jpg'},
    'WayForward Party': {name: 'Peter Akah', Votes: 0, image: './images/peter.jpg'},
    'I Must Win': {name: 'Mamamia', Votes: 0, image: './images/mamamia.jpg'},
};

app.post('/submit-vote', (req, res) => {
    const {party, votes} = req.body;

    if (candidates[party]) {
       candidates[party].Votes += votes;
       io.emit('Vote-Updated', candidates);
       res.json({success: true, candidates});
    } else {
        res.status(400).json({error: 'Invalid Party'});
    }
})
;

