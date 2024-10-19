const dotenv = require('dotenv');
const path = require('path');
const app = require('./app');

// Set the port
const PORT = process.env.PORT || 3001;

// Load environment variables from config.env
dotenv.config({ path: path.join(__dirname, './config.env') });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('Unhandled Rejection, shutting down...');
    server.close(() => {
        process.exit(1);
    });
});

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message);
    console.log('Uncaught Exception, shutting down...');
    server.close(() => {
        process.exit(1);
    });
});
