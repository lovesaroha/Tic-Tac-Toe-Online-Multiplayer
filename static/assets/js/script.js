"use-strict";

/*  Love Saroha
    lovesaroha1994@gmail.com (email address)
    https://www.lovesaroha.com (website)
    https://github.com/lovesaroha  (github)
*/

var canvas;
var ctx;
let activeRoom = {};
let pause = false;

// Routes defined.
// Room page.
appRoutes["/#/room"] = function (urlParameters) {
    if (!isLogged()) { return; }
    // Check active room.
    if (!isRoomMember()) {
        // Room not found or not a member.
        window.location = "/#/";
        return;
    }
    resetRoom(1);
    view.innerHTML = document.getElementById("roomPageTemplate_id").innerHTML;
    document.getElementById("roomName_id").innerText = `Room-${activeRoom._id}`;
    // Update DOM elements.
    showPlayerCards();
    // Get canvas info from DOM.
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");
    // Add input function.
    canvas.addEventListener("mousedown", function (e) {
        addUserInput(e.offsetX, e.offsetY);
    });
    draw();
}

// Set default.
function setDefault() {
    rooms = {};
    activeRoom = {};
    localStorage.clear();
    user.emailAddress = "";
}

// This function shows player info.
function showPlayerCards() {
    let playersInfoEl = document.getElementById("playersInfo_id");
    if (playersInfoEl == null) { return; }
    let playerOneCard = waitingTemplate;
    let playerTwoCard = waitingTemplate;
    if (activeRoom.playerOne.emailAddress) {
        // Show player one info.
        playerOneCard = `<div class="p-2 card mb-1 px-4 max-w-md shadow-md md:flex border-3 ${activeRoom.nextMove == 1 ? 'border-primary' : 'border-transparent'}">
        <i class="fad fa-circle mr-3 text-primary fa-4x"></i>
        <div class="media-body truncate"><h3 class="font-bold mb-0">Zero <font class="text-primary">${activeRoom.playerOne.score}</font></h3><h4 class="text-subtitle">${activeRoom.playerOne.emailAddress}</h4></div></div>`;
    }
    if (activeRoom.playerTwo.emailAddress) {
        // Show player two info.
        playerTwoCard = `<div class="p-2 card mb-1 max-w-md px-4 shadow-md md:flex border-3 ${activeRoom.nextMove == -1 ? 'border-primary' : 'border-transparent'}">
        <i class="fad fa-times mr-3 text-primary fa-4x"></i>
        <div class="media-body truncate"><h3 class="font-bold mb-0">Cross <font class="text-primary">${activeRoom.playerTwo.score}</font></h3><h4 class="text-subtitle">${activeRoom.playerTwo.emailAddress}</h4></div></div>`;
    }
    playersInfoEl.innerHTML = `${playerOneCard}${playerTwoCard}`;
}

// Player eaiting temnplate.
const waitingTemplate = `<div class="p-2 card mb-1 px-4 shadow-md md:flex  border-3 border-transparent">
<i class="fad fa-spinner-third fa-spin mr-3 text-primary fa-4x"></i>
<div class="media-body"><h3 class="font-bold mb-0">Waiting..</h3><h4 class="text-subtitle">for opponent</h4></div></div>`;


// Reset room function.
function resetRoom(nextMove) {
    resetGame(nextMove);
    activeRoom.messages = [];
    if (activeRoom.playerOne.emailAddress) {
        activeRoom.playerOne.score = 0;
    }
    if (activeRoom.playerTwo.emailAddress) {
        activeRoom.playerTwo.score = 0;
    }
}

// This function handle player joined.
function handlePlayerJoined(response) {
    if (!activeRoom._id) { return; }
    addPlayerToRoom(response);
    resetRoom(1);
    showPlayerCards();
}

// This function handle player left.
function handlePlayerLeft(response) {
    if (!activeRoom._id) { return; }
    if (activeRoom.playerOne._id == response._id) {
        activeRoom.playerOne = {};
    } else if (activeRoom.playerTwo._id == response._id) {
        activeRoom.playerTwo = {};
    }
    resetRoom(1);
    showPlayerCards();
}

