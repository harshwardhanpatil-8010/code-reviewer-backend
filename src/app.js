const express = require('express');
const aiRoutes = require('./routes/ai.routes');
const cors = require('cors');

const dotenv = require('dotenv');

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const app = express();
connectDB();
app.use(cors());
dotenv.config();

app.use(express.json());

app.get('/',(req,res)=>{
    res.send('Hello World');
});

app.use('/ai',aiRoutes);
app.use("/api/auth", authRoutes);
module.exports = app;