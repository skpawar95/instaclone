import express, { urlencoded } from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import connectDB from './utils/db.js';
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import messageRoute from "./routes/message.route.js"
import { app, server } from './socket/socket.js';
import path from "path";

dotenv.config({});


const PORT = process.env.PORT;
const __dirname = path.resolve();



app.get("/", (_, res) => {
    return res.status(200).json({
        message: "i am coming from backend",
        success: true
    })
})

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));


const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true
}

app.use(cors(corsOptions));

app.use("/api/v1/user", userRoute);
app.use("/api/v1/post", postRoute);
app.use("/api/v1/message", messageRoute);


// "http://localhost:8000/api/v1/user/register"

// p83imSj88WfdtDZx
// mongodb+srv://skpawar6468:p83imSj88WfdtDZx@cluster0.uenq5.mongodb.net/

app.use(express.static(path.join(__dirname, "/frontend/dist")));
app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
})



server.listen(PORT, () => {
    connectDB();
    console.log(`Server listen at port ${PORT}`)
})