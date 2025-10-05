
// import { Server } from "socket.io";

// let connections = {};
// let messages = {};
// let timeOnline = {};

// export const connectToSocket = (server) => {
//   const io = new Server(server, {
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"],
//       allowedHeaders: ["*"],
//       credentials: true,
//     },
//   });

//   io.on("connection", (socket) => {
//     socket.on("join-call", (path) => {
//       if (connections[path] === undefined) {
//         connections[path] = [];
//       }
//       connections[path].push(socket.id);
//       timeOnline[socket.id] = new Date();
//       socket.join(path);

//       for (let a = 0; a < connections[path].length; a++) {
//         io.to(connections[path][a]).emit("user-joined", socket.id);
//       }

//       if (messages[path] !== undefined) {
//         for (let b = 0; b < messages[path].length; b++) {
//           io.to(socket.id).emit(
//             "chat-message",
//             messages[path][b]["data"],
//             messages[path][b]["sender"],
//             messages[path][b]["socket-id-sender"]
//           );
//         }
//       }
//     });

//     socket.on("signal", (toId, message) => {
//       io.to(toId).emit("signal", socket.id, message);
//     });

//     socket.on("chat-message", (data, sender) => {
//       const [matchingRoom, found] = Object.entries(connections).reduce(
//         ([room, isFound], [roomKey, roomValue]) => {
//           if (!isFound && roomValue.includes(socket.id)) {
//             return [roomKey, true];
//           }
//           return [room, isFound];
//         },
//         [null, false]
//       );
//       if (found === true) {
//         if (messages[matchingRoom] === undefined) {
//           messages[matchingRoom] = [];
//         }
//         messages[matchingRoom].push({
//           data: data,
//           sender: sender,
//           "socket-id-sender": socket.id,
//         });
//         // for (let a = 0; a < connections[matchingRoom].length; a++) {
//         //     io.to(connections[matchingRoom][a]).emit("chat-message", data, sender, socket.id);
//         // }
//         console.log("message", Key, ":", sender, data);
//         connections[matchingRoom].forEach((socketId) => {
//           io.to(elem).emit("chat-message", data, sender, socket.id);
//         });
//       }
//     });

//     socket.on("disconnect", () => {
//       var diffTime = Math.abs(timeOnline[socket.id] - new Date());
//       var Key;

//       for (const [k, v] of JSON.parse(
//         JSON.stringify(Object.entries(connections))
//       )) {
//         for (let a = 0; a < v.length; a++) {
//           if (v[a] === socket.id) {
//             Key = k;
//             for (let a = 0; a < connections[Key].length; a++) {
//               io.to(connections[Key][a]).emit("user-left", socket.id);
//             }
//             var index = connections[k].indexOf(socket.id);
//             connections[k].splice(index, 1);

//             if (connections[key].length === 0) {
//               delete connections[k];
//             }
//           }
//         }
//       }
//     });
//   });

//   return io;
// };

import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};


export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-call", (path) => {
      // Initialize connections for the room if it doesn't exist
      if (connections[path] === undefined) {
        connections[path] = [];
      }
      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();
      socket.join(path);

      // Notify all existing users in the room that a new user has joined
      // Use forEach for cleaner array iteration
      connections[path].forEach(socketId => {
        io.to(socketId).emit("user-joined", socket.id);
      });

      // Send historical messages to the newly joined user
      if (messages[path] !== undefined) {
        // Use forEach for cleaner array iteration
        messages[path].forEach(message => {
          io.to(socket.id).emit(
            "chat-message",
            message["data"],
            message["sender"],
            message["socket-id-sender"]
          );
        });
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      // NOTE: This logic uses reduce which is complicated for this task.
      // It assumes 'connections' is an object { path: [socketIds] }
      // This part is unchanged as it finds the matching room.
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && Array.isArray(roomValue) && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        },
        [null, false]
      );

      if (found === true && matchingRoom) { // Added check for matchingRoom not being null
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }
        messages[matchingRoom].push({
          data: data,
          sender: sender,
          "socket-id-sender": socket.id,
        });

        console.log("message", matchingRoom, ":", sender, data);

        // This is where you use forEach - it should be safe because 'connections[matchingRoom]'
        // is populated in 'join-call' and never deleted while users are present.
        // It's safe to use forEach here *because* of the checks above.
        connections[matchingRoom].forEach((socketId) => {
          io.to(socketId).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
      var diffTime = Math.abs(timeOnline[socket.id] - new Date());
      // No need to declare roomKey here, it's defined inside the loop later

      // Iterate through connections to find the room the disconnected socket was in
      for (const [roomKey, socketIds] of Object.entries(connections)) {
        const index = socketIds.indexOf(socket.id);

        if (index > -1) {
          // Notify other users in the room
          socketIds.forEach(socketId => {
            if (socketId !== socket.id) { // Don't send 'user-left' to the leaving user
                io.to(socketId).emit("user-left", socket.id);
            }
          });
          
          // Remove the socket ID from the connections list
          socketIds.splice(index, 1);

          // If the room is now empty, delete the room
          if (socketIds.length === 0) { 
            delete connections[roomKey];
            delete messages[roomKey]; // Also clear chat history for the empty room
          }
          // Break the loop once the room is found and processed
          break; 
        }
      }
      delete timeOnline[socket.id]; // Clean up timeOnline
    });
  });

  return io;
};