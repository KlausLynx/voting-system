const express = require('express'); //Express framework for building the server
const cors = require('cors'); //CORS middleware for different site commucnication
const http = require('http'); //HTTP module for creating an HTTP server
const socketIo = require('socket.io'); //Socket.io module for real-Time communication
const fs = require('fs'); //File system module for reading and writing files
const path = require('path'); //Path module for file paths
const schedule = require('node-schedule'); //Node-schedule module for scheduling tasks
const admin = require('firebase-admin'); //Firebase Admin SDK for Firebase services
const { timeStamp, error } = require('console');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://voting-system-c2a0d-default-rtdb.firebaseio.com"
});

const database = admin.database();



const app = express(); //Create an Express application
const server = http.createServer(app); //Create an HTTP server using the Express app
// const io = socketIo(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"]
//     }
// });

// app.use(cors()); //Enable different site communication
const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.0.2:5173',
  'https://voting-upload-site.vercel.app',
  'https://wholemeal-noncoercively-seymour.ngrok-free.dev'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(null, true); // Allow all for now during testing
    }
  },
  credentials: true
}));

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});
app.use(express.json()); //Read body of requests as JSON
app.use('/images', express.static(path.join(__dirname, '..', 'images'))); // Use a static directory for serving images

// Data Folders and Registry
// create them if they dont exist
const dataDir = path.join(__dirname, '..', 'data');
const backupsDir = path.join(__dirname, '..', 'backups'); 
const archivesDir = path.join(__dirname, '..', 'archives');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);
if (!fs.existsSync(archivesDir)) fs.mkdirSync(archivesDir);

const centerRegistry = {
    1: {
        name: "Lagos Central",
        code: "CTR1-8K3N-PLM9",
        location: "Lagos Office"
    },
    2: {
        name: "Enugu Central",
        code: "CTR2-8K3N-QWE4",
        location: "Enugu Office"
    }
}

let candidates = {
    'Amuneke Party': {
        name: 'Gov Amune',
        votes: 0,
        image: '/images/amuneke.jpg',
        centerBreakdown: {
            1: 0,
            2: 0
        }
    },
    'WayForward Party': {
        name: 'Peter U.K.W',
        votes: 0,
        image: '/images/wayforward.jpg',
        centerBreakdown: {
            1: 0,
            2: 0
        }
    },
    'I Must Win': {
        name: 'Mamamia',
        votes: 0,
        image: '/images/imustwin.jpg',
        centerBreakdown: {
            1: 0,
            2: 0
        }
    }
};

let centerSubmissions = {
    1: {
        submitted: false,
        timestamp: null,
        officer: null,
        deviceLocked: false
    },
    2: {
        submitted: false,
        timestamp: null,
        officer: null,
        deviceLocked: false
    }
}

function saveVotes(data, reason = 'update') {
    try {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('-').slice(0, 3).join('-');

        const activeFile = path.join(dataDir, 'votes-data.json');
        fs.writeFileSync(activeFile, JSON.stringify(data, null, 2));
        console.log('Active data saved');

        const backupFile = path.join(backupsDir, `backup-${timestamp}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));

        cleanupOldBackups();

        return true;
    } catch(error) {
        console.error('Error saving votes',error);
        return false
    }
}

function cleanupOldBackups() {
    try {
        const backups = fs.readdirSync(backupsDir)
        .filter(file => file.startsWith('backup-'))
        .sort()
        .reverse();

        if (backups.length > 50) {
            const toDelete = backups.slice(50);
            toDelete.forEach(file => {
                fs.unlinkSync(path.join(backupsDir, file));
            });
            console.log(`Cleaned up ${toDelete.length} old backups`);
        }
    } catch (error) {
        console.error('Error cleaning backups:', error);
    }
}

function loadVotes() {
    try {
        const activeFile = path.join(dataDir, 'votes-data.json');

        if (fs.existsSync(activeFile)) {
            const data = JSON.parse(fs.readFileSync(activeFile, 'utf-8'));
            candidates = data.candidates;
            centerSubmissions = data.centerSubmissions;
            console.log('Votes loaded from file')
            return true;
        } else {
            console.log('No saved data found, starting fresh')
            return false;
        }
    } catch (error) {
        console.error('Error Loading votes, trying backup...');
        return loadFromBackup();
    }
}

function loadFromBackup() {
    try {
        const backups = fs.readdirSync(backupsDir)
        .filter(file => file.startsWith('backup-'))
        .sort()
        .reverse();

        for (const backup of backups) {
            try {
                const backupPath = path.join(backupsDir, backup);
                const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
                candidates = data.candidates;
                centerSubmissions = data.centerSubmissions;
                console.log(`Restored from backup: ${backup}`);
                return true;
            } catch (err) {
                continue;
            }
        }
        console.log('No valid backups found, starting fresh');
        return false;
    } catch (error) {
        console.error('Error loading from backup:', error);
        return false;
    }
}

function createDailyArchive() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const archiveFile = path.join(archivesDir, `archive-${today}.json`);

        const archiveData = {
            date: today,
            candidates: candidates,
            centerSubmissions,
            timeStamp: new Date().toISOString()
        };

        fs.writeFileSync(archiveFile, JSON.stringify(archiveData, null, 2))
        console.log(`Daily archive created: ${today}`);
    } catch (error) {
        console.error('Error creating daily archive:', error);

    }
}

async function saveToCloud(data) {
    try {
        await database.ref('votes').set({
            candidates: data.candidates || candidates,
            centerSubmissions: data.centerSubmissions || centerSubmissions,
            lastUpdated: new Date().toISOString()
        });
        console.log('Synced to cloud');
        return true;
    } catch(error) {
        console.error('Cloud sync failed (offline?), data saved locally');
        return false;
    }
}

async function loadFromCloud() {
    try {
        const snapshot = await database.ref('votes').once('value');
        if (snapshot.exists()) {
            const cloudData = snapshot.val();
            console.log('Data retrieved from cloud');
            return cloudData;
        } else {
            console.log('No data found in cloud');
            return null;
        }
    } catch (error) {
        console.error('Could not reach Cloud (offline?)', error);
        return null;
    }
}

async function syncHybrid() {
    try {
        let localData = null;
        let cloudData = null;

        const activeFile = path.join(dataDir, 'votes-data.json');
        if (fs.existsSync(activeFile)) {
            localData = JSON.parse(fs.readFileSync(activeFile, 'utf-8'));
            console.log('Local data found');
        }

        cloudData = await loadFromCloud();

        if(!localData && !cloudData) {
            console.log('No data found, starting fresh');
            return false;
        } else if (localData && !cloudData) {
            console.log('Syncing local data (cloud empty)');
            candidates = localData.candidates;
            centerSubmissions = localData.centerSubmissions;
            await saveToCloud({candidates, centerSubmissions});
            return true;
        } else if (!localData && cloudData) {
            console.log('Using cloud data (local empty)');
            candidates = cloudData.candidates;
            centerSubmissions = cloudData.centerSubmissions;
            saveVotes({candidates, centerSubmissions});
            return true;
        } else {
           const localTime = new Date(localData.lastUpdated || 0).getTime();
           const cloudTime = new Date(cloudData.lastUpdated || 0).getTime();

           if (cloudTime> localTime) {
                console.log('Cloud data is newer, using that');
                candidates = cloudData.candidates;
                centerSubmissions = cloudData.centerSubmissions;
                saveVotes({candidates, centerSubmissions});
            } else {
                console.log('Local data is newer, using that');
                candidates = localData.candidates;
                centerSubmissions = localData.centerSubmissions;
                await saveToCloud({candidates, centerSubmissions});
            }
            return true;
        }

    } catch (error) {
        console.error('Error in hybrid sync:', error);
        return loadVotes();
    }

}

app.post('/submit-vote', async (req, res) => {
    try {
        const {centerCode, results, officer} = req.body;

        const centerNumber = Object.keys(centerRegistry).find(num => centerRegistry[num].code === centerCode);

        if (!centerNumber) {
            return res.status(400).json({error: 'Invalid center code'});
        }

        if (centerSubmissions[centerNumber].submitted) {
            return res.status(400).json({
                error: 'Center already submitted',
                submittedAt: centerSubmissions[centerNumber].timestamp
            });
        }

        results.forEach(result => {
            const {party, votes} = result
            if (candidates[party]) {
                candidates[party].votes += votes;
                candidates[party].centerBreakdown[centerNumber] += votes;
            }
        });

        centerSubmissions[centerNumber] = {
            submitted: true,
            timestamp: new Date().toISOString(),
            officer: officer,
            deviceLocked: true
        };

        const dataToSave = { candidates, centerSubmissions, lastUpdated: new Date().toISOString() };
        saveVotes(dataToSave, 'vote-submission');
        await saveToCloud(dataToSave);

        io.emit('vote-update', {
            candidates,
            centerSubmissions,
            newSubmission: {
                centerNumber,
                centerName: centerRegistry[centerNumber].name,
                timestamp: new Date().toISOString(),
                officer,
                results,
                timeStamp: new Date().toISOString()
            }
        });

        res.json({success: true, message: 'Vote submitted successfully',candidates, centerSubmissions});
    } catch (error) {
        console.error('Error submitting vote:', error);
        res.status(500).json({error: 'Error submitting vote'});
    }
})

// Get list of centers
app.get('/get-centers', (req, res) => {
  const centers = Object.keys(centerRegistry).map(key => ({
    id: key,
    name: centerRegistry[key].name,
    code: centerRegistry[key].code,
    location: centerRegistry[key].location
  }));
  
  res.json(centers);
});

io.on('connection', (socket) => {
    console.log('Display Connected:', socket.id);

    socket.emit('initial-data', {candidates, centerSubmissions, centerRegistry});

    socket.on('disconnect', () => {
        console.log('Display Disconnected:', socket.id);
    });
});

// Start Server
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        console.log('starting server...');
        await syncHybrid();

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Local access: http://localhost:${PORT}`);
            console.log(`Network access: http://YOUR-IP:${PORT}`);
            console.log('');
            console.log(`=== Voting System Ready ===`);
            console.log(`Centers registered: ${Object.keys(centerRegistry).length}`);
            console.log(`Total votes: ${Object.values(candidates).reduce((total, candidate) => total + candidate.votes, 0)}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();

schedule.scheduleJob('59 59 * * *', () => {
    console.log('Creating end-of-day archive...');
    createDailyArchive();
});

setInterval(() => {
    if (Object.values(candidates).some(candidate => candidate.votes > 0)) {
        console.log('Auto-backup...')
        saveToCloud({candidates, centerSubmissions, lastUpdated: new Date().toISOString()});
    }
}, 5 * 60 * 1000);