const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

connectDB();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/workorders', require('./routes/workorders'));
app.use('/api/pm', require('./routes/pm'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/technicians', require('./routes/technicians'));
app.use('/api/notifications', require('./routes/notifications'));

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Start background scheduler after server starts
try {
	const { start } = require('./scheduler');
	start();
} catch (_) {}
