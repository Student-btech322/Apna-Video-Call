import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManger.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 5000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use("/api/v1/users", userRoutes);

const start = async () => {
  app.set("mongo_user", process.env.MONGO_USER);
  app.set("mongo_password", process.env.MONGO_PASSWORD);
  const connectDb = await mongoose.connect(
    "mongodb+srv://madhusudankumar8631_db_user:RdheUuo2r8zwUpGH@zerodhaclonecluster.3jdptnl.mongodb.net/video_conferencing?retryWrites=true&w=majority&appName=ZerodhaCloneCluster"
  );

  console.log(`MongoDB connected: ${connectDb.connection.host}`);
  server.listen(app.get("port"), () => {
    console.log(`Server is running on port ${app.get("port")}`);
  });
};

start();
