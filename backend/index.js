require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Make io accessible to our router
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Create routes connection
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB ✅');
    
    // Socket.io connection logic
    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));
