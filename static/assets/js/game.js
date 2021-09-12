/*  Love Saroha
    lovesaroha1994@gmail.com (email address)
    https://www.lovesaroha.com (website)
    https://github.com/lovesaroha  (github)
*/
// All function related to game.
// Default values.
let combinations = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
let lines = [[20, 70, 400, 70], [20, 210, 400, 210], [20, 350, 400, 350], [70, 20, 70, 400], [210, 20, 210, 400], [350, 20, 350, 400], [20, 20, 400, 400], [400, 20, 20, 400]];
let iconPositions = [{ x: 70, y: 110 }, { x: 210, y: 110 }, { x: 350, y: 110 }, { x: 70, y: 250 }, { x: 210, y: 250 }, { x: 350, y: 250 }, { x: 70, y: 390 }, { x: 210, y: 390 }, { x: 350, y: 390 }];

// Show grid function shows grid on canvas.
function showGrid() {
  if (!activeRoom._id) { return; }
  let lineIndex = checkGrid(activeRoom.grid);
  if (lineIndex > -1) { showLine(lineIndex); }
  ctx.font = `100px "Font Awesome 5 Pro"`;
  ctx.fillStyle = colorTheme.normal;
  ctx.textAlign = 'center';
  for (let i = 0; i < 9; i++) {
    if (activeRoom.grid[i] == -1) {
      // Show cross icon.
      ctx.fillText("\uf00d", iconPositions[i].x, iconPositions[i].y);
    } else if (activeRoom.grid[i] == 1) {
      // Show zero icon.
      ctx.fillText("\uf111", iconPositions[i].x, iconPositions[i].y);
    }
  }
}

// Show line function.
function showLine(index) {
  if (canvas == null) { return; }
  ctx.beginPath();
  ctx.lineWidth = 5;
  ctx.moveTo(lines[index][0], lines[index][1]);
  ctx.lineTo(lines[index][2], lines[index][3]);
  ctx.strokeStyle = "#666";
  ctx.stroke();
}

// Add user input function.
function addUserInput(x, y) {
  if (!activeRoom._id || pause) { return; }
  if (!activeRoom.playerOne._id || !activeRoom.playerTwo._id || !isRoomMember()) { return; }
  if ((activeRoom.nextMove == 1 && user.socket.id == activeRoom.playerTwo._id) || (activeRoom.nextMove == -1 && user.socket.id == activeRoom.playerOne._id)) { return; }
  let r = 1;
  let c = 1;
  for (let i = 0; i < 9; i++) {
    if (x > ((r * 140) - 140) && x < r * 140 && y > ((c * 140) - 140) && y < c * 140) {
      if (activeRoom.grid[i] == 0) {
        user.socket.emit("updateGame", { roomID: activeRoom._id, position: i, grid: activeRoom.grid });
        return;
      }
    }
    r++;
    if ((i + 1) % 3 == 0) {
      c++;
      r = 1;
    }
  }
}

// Check result.
function checkGameResult(result) {
  if (!activeRoom._id) { return; }
  if (result == -1 || result == 1 || result == 9) {
    pause = true;
    activeRoom.nextMove = 1;
    if (result == 1) {
      activeRoom.playerOne.score++;
    } else if (result == -1) {
      activeRoom.playerTwo.score++;
      activeRoom.nextMove = -1;
    }
    showPlayerCards();
    setTimeout(function () {
      resetGame(activeRoom.nextMove);
    }, 1000);
  }
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
            return c;
          }
        }
      }
    }
    count = 1;
  }
  return -1;
}

// Reset game function.
function resetGame(nextMove) {
  if (!activeRoom._id) { return; }
  activeRoom.grid = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  activeRoom.nextMove = nextMove;
  pause = false;
}

// Add player to active room.
function addPlayerToRoom(player) {
  if (!activeRoom._id) { return; }
  if (activeRoom.playerOne.emailAddress) {
    activeRoom.playerTwo = { emailAddress: player.emailAddress, score: 0, _id: player._id };
  } else {
    activeRoom.playerOne = { emailAddress: player.emailAddress, score: 0, _id: player._id };
  }
}

// On game updated.
user.socket.on("gameUpdated", function (response) {
  if (!activeRoom._id) { return; }
  activeRoom.grid[response.position] = response.move;
  activeRoom.nextMove *= -1;
  showPlayerCards();
  checkGameResult(response.result);
});

// Draw.
function draw() {
  if (!window.location.hash.includes(activeRoom._id)) { return; }
  ctx.globalCompositeOperation = 'destination-over';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  showGrid();
  window.requestAnimationFrame(draw);
}