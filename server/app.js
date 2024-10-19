const express = require('express');
const dotenv = require('dotenv');
const app = express(); // This line initializes your Express app
const path = require('path');
const cors = require('cors');
const Pusher = require('pusher');


dotenv.config({ path: path.join(__dirname, './config.env') });

const corsOptions = {
    origin: (origin, callback) => {
        if (process.env.NODE_ENV === 'production') {
            callback(null, true); // Allow all origins in production
        } else if (origin === 'http://localhost:3000') {
            callback(null, true); // Allow local dev server
        } else {
            callback(new Error('Not allowed by CORS')); // Reject other origins
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());


app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Store messages in-memory
const messages = {};

// Initialize Pusher with your credentials from environment variables
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
});


// console.log('Environment Variables:', {
//     appId: process.env.PUSHER_APP_ID,
//     key: process.env.PUSHER_KEY,
//     secret: process.env.PUSHER_SECRET,
//     cluster: process.env.PUSHER_CLUSTER,
// });


// API route to trigger a message
app.post('/api/trigger-message', async (req, res) => {
    try {
        const { message, id } = req.body;

        // Validate input
        if (!message || !id) {
            return res.status(400).json({ error: 'Message and ID are required' });
        }

        // Store the message
        messages[id] = { message, id };

        // Set a timeout to delete the message after 5 minutes
        setTimeout(() => {
            delete messages[id];
            console.log(`Message with ID ${id} deleted after 5 minutes`);
        }, 5 * 60 * 1000); // 5 minutes in milliseconds

        // Trigger an event in Pusher
        await pusher.trigger("my-channel", "my-event", { message, id });

        return res.status(200).json({ success: 'Message sent' });
    } catch (error) {
        console.error('Error triggering message:', error);
        return res.status(500).json({ error: 'Failed to send message', error });
    }
});

// API route to get a message by ID
app.get('/api/messages/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the message exists
        if (!messages[id]) {
            return res.status(404).json({ error: 'Message not found' });
        }

        return res.status(200).json([messages[id]]);
    } catch (error) {
        console.error('Error retrieving message:', error);
        return res.status(500).json({ error: 'Failed to retrieve message' });
    }
});


if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client/build/index.html'));
    });
}

// Export app to use in server.js
module.exports = app;
