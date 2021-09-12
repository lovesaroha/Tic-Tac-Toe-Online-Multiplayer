// Require default node modules. 
var fs = require('fs');
var path = require('path');
var sha1 = require("sha1");
var server;

// Define default app variables.
server = require('http').createServer(handler);
const io = require('socket.io')(server, {});

// Default variables data.
var rooms = {};
const combinations = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];


// Port 3000.
const PORT = 3000;
console.log(`Server running at port ${PORT}`);
server.listen(PORT);

// Run this on socket connection.
io.on('connection', function (socket) {

     // On socket disconnect.
     socket.on("disconnect", function (request) {
          removeMember(socket, io);
     });

     // Where one member left the room.
     socket.on("leaveRoom", function (request) {
          removeMember(socket, io);
     });

     // Create room function creates new room.
     socket.on("createRoom", function (data, callback) {
          let newRoom = {
               _id: new Date().getTime(),
               password: sha1(data.password),
               playerOne: { emailAddress: data.emailAddress, _id: socket.id },
               playerTwo: {},
               nextMove: 1,
               grid: [0, 0, 0, 0, 0, 0, 0, 0, 0]
          };
          rooms[newRoom._id] = newRoom;
          socket.join(newRoom._id);
          io.emit("roomAvailable", roomInfo(newRoom));
          callback(roomInfo(newRoom));
     });

     // Join room function.
     socket.on("joinRoom", function (request, callback) {
          let room = rooms[request.roomID];
          if (!isRoomAvailable(request.roomID, request.password)) {
               callback({ error: "Cannot join this room." });
               return;
          }
          // Set player.
          if (rooms[room._id].playerOne.emailAddress) {
               rooms[room._id].playerTwo = { emailAddress: request.emailAddress, _id: socket.id };
          } else {
               rooms[room._id].playerOne = { emailAddress: request.emailAddress, _id: socket.id };
          }
          callback(roomInfo(room));
          socket.to(room._id).emit("playerJoined", { emailAddress: request.emailAddress, roomID: room._id, _id: socket.id });
          io.emit("roomUnavailable", { roomID: room._id });
          socket.join(room._id);
     });

     // This function update game's grid.
     socket.on("updateGame", function (request) {
          let room = rooms[request.roomID];
          if (!room) { return; }
          if ((room.nextMove == 1 && socket.id == room.playerTwo._id) || (room.nextMove == -1 && socket.id == room.playerOne._id)) { return; }
          if (invalidGrid(room.grid, request.grid)) { return; }
          rooms[room._id].grid[request.position] = room.nextMove;
          let result = checkGrid(rooms[room._id].grid);
          io.in(room._id).emit("gameUpdated", { roomID: room._id, move: room.nextMove, position: request.position, result: result });
          rooms[room._id].nextMove *= -1;
          if (result == 1) {
               resetRoom(room._id, 1);
          } else if (result == -1) {
               resetRoom(room._id, -1);
          } else if (result == 9) {
               // Draw reset.
               resetRoom(room._id, 1);
          }
     });

     // Create message event.
     socket.on("createMessage", function (request) {
          let room = rooms[request.roomID];
          if (!room) { return; }
          socket.to(room._id).emit("receiveMessage", request);
     });
});

// Function to remove room member.
function removeMember(socket, io) {
     Object.keys(rooms).forEach(_id => {
          let room = rooms[_id];
          let removed = false;
          if (rooms[_id].playerOne._id == socket.id) {
               // Player one left.
               rooms[_id].playerOne = {};
               removed = true;
          }
          if (rooms[_id].playerTwo._id == socket.id) {
               // Player two left.
               rooms[_id].playerTwo = {};
               removed = true;
          }
          if (!removed) { return; }
          if (!rooms[_id].playerOne.emailAddress && !rooms[_id].playerTwo.emailAddress) {
               // Remove room.
               io.emit("roomUnavailable", { roomID: _id });
               delete rooms[_id];
          } else {
               // Reset room.
               rooms[_id].grid = [0, 0, 0, 0, 0, 0, 0, 0, 0];
               rooms[_id].nextMove = 1;
               socket.to(room._id).emit("playerLeft", { roomID: _id, _id: socket.id });
               io.emit("roomAvailable", roomInfo(rooms[_id]));
          }
          socket.leave(room._id);
     });
}

// Analyze grid checks if someone won or not.
function checkGrid(grid) {
     let count = 1;
     for (let c = 0; c < 8; c++) {
          count = 1;
          for (let i = 0; i < 2; i++) {
               if (grid[combinations[c][i]] != 0) {
                    if (grid[combinations[c][i]] == grid[combinations[c][i + 1]]) {
                         count += 1;
                         if (count == 3) {
                              return grid[combinations[c][i]];
                         }
                    }
               }
          }
          count = 1;
     }
     if (grid.includes(0)) {
          return 0;
     }
     return 9;
}

// This function verify grid.
function invalidGrid(serverGrid, clientGrid) {
     for (let i = 0; i < 9; i++) {
          if (serverGrid[i] != clientGrid[i]) {
               return true;
          }
     }
     return false;
}

// This function reset given room.
function resetRoom(id, nextMove) {
     if (!rooms[id]) { return; }
     rooms[id].grid = [0, 0, 0, 0, 0, 0, 0, 0, 0];
     rooms[id].nextMove = nextMove;
}

// This function check if room is available or valid.
function isRoomAvailable(id, password) {
     if (!rooms[id]) { return false; }
     if (rooms[id].playerOne.emailAddress && rooms[id].playerTwo.emailAddress) { return false; }
     if (sha1(password) != rooms[id].password) { return false; }
     return true;
}

// This function return room info.
function roomInfo(room) {
     return { _id: room._id, playerOne: room.playerOne, playerTwo: room.playerTwo, password: room.password };
}

// Create http server and listen on port 3000.
function handler(request, response) {
     // If request method is get than call function based on matching route.
     if (request.method == 'GET') {
          if (request.url.match(new RegExp("/api/rooms", 'i'))) {
               let roomList = {};
               Object.keys(rooms).forEach(_id => {
                    if (rooms[_id].playerOne.emailAddress && rooms[_id].playerTwo.emailAddress) { return; }
                    roomList[_id] = roomInfo(rooms[_id]);
               });
               response.writeHead(200);
               response.end(JSON.stringify(roomList), 'utf-8');
               return;
          }
     }
     var filePath = './static' + request.url;
     if (filePath == './static/') { filePath = './static/index.html'; }
     // All the supported content types are defined here.
     var extname = String(path.extname(filePath)).toLowerCase();
     var mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.png': 'image/png'
     };
     var contentType = mimeTypes[extname] || 'application/json';
     // Read file from server based on request url.
     fs.readFile(filePath, function (error, content) {
          if (error) {
               response.writeHead(500);
               response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
          }
          else {
               response.writeHead(200, { 'Content-Type': contentType });
               response.end(content, 'utf-8');
          }
     });
}
