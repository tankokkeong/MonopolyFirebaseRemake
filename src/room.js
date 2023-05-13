import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set, get, child, update, onDisconnect, onValue, query, orderByChild} from "firebase/database";
import { route, getUrlParams, getFormattedTimeStamp
    , displayHTMLElementByClass, doubleDigitFormatter, setFormValue 
    , getFormattedTime, getTimestamp, removeHTMLElementByClass, displayCustomMessage,
    displayHTMLElement, priceFormatter, removeHTMLElement, setCookie, getCookie
} from '../dist/script/module-helper';

const firebaseConfig = {
    apiKey: "AIzaSyAOaIjem-aPiQrmxn4K6Rnm-X9UcRg9q9c",
    authDomain: "ewa-assignment-2.firebaseapp.com",
    databaseURL: "https://ewa-assignment-2-default-rtdb.firebaseio.com",
    projectId: "ewa-assignment-2",
    storageBucket: "ewa-assignment-2.appspot.com",
    messagingSenderId: "654792555384",
    appId: "1:654792555384:web:e9099310e35dce591aa68d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();
const dbRef = ref(getDatabase());
var roomID;
var userID;
var username;
var myPiecePosition;
var IAmReady = false;
var currentSeqeunce;
var currentRoomDice;
var diceStatus;
var diceRoller;
var diceCounter = 0;
var liveDiceCounter = 0;

const gamePiece =
[`<i class="fa fa-car player-color-1" aria-hidden="true"></i> `,
`<i class="fa fa-bug player-color-2" aria-hidden="true"></i>`,
`<i class="fa fa-motorcycle player-color-3" aria-hidden="true"></i>`,
`<i class="fa fa-fighter-jet player-color-4" aria-hidden="true"></i>`];

const playerPieceOnBoard = 
[ `<div id="player-1" class="player-choice player-color-1">
        <i class="fa fa-car" aria-hidden="true"></i>
    </div>`,
    `<div id="player-2" class="player-choice player-color-2">
        <i class="fa fa-bug" aria-hidden="true"></i>
    </div>`,
    `<div id="player-3" class="player-choice player-color-3">
        <i class="fa fa-motorcycle" aria-hidden="true"></i>
    </div>`,
    `<div id="player-4" class="player-choice player-color-4">
        <i class="fa fa-fighter-jet" aria-hidden="true"></i>
    </div>`
];

const StartBtn = document.getElementById("startBtn");
const ReadyBtn = document.getElementById("readyBtn");
const ChatDisplayContainer = document.getElementById("chat-display-container");

onAuthStateChanged(auth, (user) => {
    if (!user) {
        route("Index");
    } 
    else{
        setCookie("userID", user.uid);

        // Set user online
        set(ref(db, 'Online/' + getCookie("userID")), {
            recordTime: getFormattedTimeStamp(),
            status: "Online"
        });

        get(child(dbRef, `users/${getCookie("userID")}`)).then((snapshot) => {
            if (snapshot.exists()) {
                setCookie("username", snapshot.val().username);
                setCookie("roomID", getUrlParams("room"));

                if(getCookie("roomID") == null){
                    route("Home");
                }
                else{
                    //Check if game started
                    onValue(ref(db, "GameStatus/" + getCookie("roomID") + "/"), (snapshot) => {
                        if(snapshot.exists()){
                            if(snapshot.val().status == "Started"){
                                //Remove action button
                                StartBtn.style.display = "none";
                                ReadyBtn.style.display = "none";
                                removeHTMLElementByClass("kick-btn");
                                removeHTMLElementByClass("player-ready-state");
                                startGame();
                                gameStartedTimer();
                                setCookie("GameStatus", "Started", 7);
                            }
                            else{
                                setCookie("GameStatus", "Waiting", 7);
                            }
                        }
                        else{
                            setCookie("GameStatus", "Waiting", 7);
                        }
                    });

                    //Check kicked
                    onValue(ref(db, "Kicked/" + getCookie("roomID") + "/"), (snapshot) => {
                        snapshot.forEach((childSnap) =>{
                            if(childSnap.key == getCookie("userID")){
                                route("Home", "HostKicked");
                            }
                        });
                    });

                    //Display chat message
                    onValue(query(ref(db, "GameChat/" + getCookie("roomID")), orderByChild("timestamp")), (snapshot) => {
                        //Remove the previous record
                        ChatDisplayContainer.innerHTML = "";

                        snapshot.forEach((childSnap) => {
                            ChatDisplayContainer.innerHTML += 
                            `<div class="mt-2 bg-light chat-message-container">

                                <div class="message-sender">
                                    <strong>${childSnap.val().sender}</strong>
                                </div>

                                <span class="chat-message-content">
                                    ${childSnap.val().message}
                                </span>

                                <div class="text-right text-muted message-sent-time">
                                    ${childSnap.val().displayTime}
                                </div>
                            </div>`;
                        });

                        ChatDisplayContainer.scrollTo(0, ChatDisplayContainer.scrollHeight);
                    });

                    console.log("b4 check multiple tab")
                    //Check if there are multiple tabs with the same account
                    get(child(dbRef, `Connection/${getCookie("roomID")}/${getCookie("userID")}`)).then((snapshot) => {

                        if(snapshot.exists() && snapshot.val().status == "Online"){
                            route("Home", "MultipleAccount");
                        }
                        else
                        {
                            console.log("b4 check room exists")

                            //Check room exists
                            get(child(dbRef, `rooms/${getCookie("roomID")}`)).then((snapshot) => {
                                if(snapshot.exists()){
                                    //Display game timer
                                    gameTimer(snapshot.val().createdAt);

                                    //Used to detect whether admin closes the room
                                    onValue(ref(db, "rooms"), (snapshot) => {
                                        get(child(dbRef, `AdminClosed/${getCookie("roomID")}`)).then((snapshot) => {
                                            if(snapshot.exists()){
                                                route("Home", "AdminClosed");
                                            }
                                        });
                                    });

                                    //Used to detect the room changes
                                    onValue(ref(db, "rooms/" + getCookie("roomID")), (snapshot) => {
                                        setCookie("currentSeqeunce", snapshot.val().CurrentPlayerSequence, 7);
                                        setCookie("currentRoomDice", snapshot.val().CurrentDiceNumber, 7);
                                        setCookie("diceStatus", snapshot.val().DiceStatus, 7);
                                        setCookie("diceRoller", snapshot.val().DiceRoller, 7);
                                        setCookie("Player1Position", snapshot.val().Player1Position, 7);
                                        setCookie("Player2Position", snapshot.val().Player2Position, 7);
                                        setCookie("Player3Position", snapshot.val().Player3Position, 7);
                                        setCookie("Player4Position", snapshot.val().Player4Position, 7);
                                        setCookie("PieceMoving", snapshot.val().PieceMoving, 7);

                                        if(getCookie("diceStatus") == "Stopped"){

                                            if(getCookie("GameStatus") == "Started" && getCookie("PieceMoving") == "Yes"){
                                                //Remove the dice container
                                                setTimeout(function(){
                                                    removeHTMLElement("dice-display-container");

                                                    const sequence = parseInt(getCookie("currentSeqeunce"));
                                                    const origin = parseInt(getCookie(`Player${sequence + 1}Position`));
                                                    const diceNumber = parseInt(getCookie("currentRoomDice"));
                                                    console.log(sequence, diceNumber, origin);
                                                    movePlayerAnimation(sequence + 1, diceNumber, origin); 

                                                }, 2000);
                                            }
                                            
                                        }
                                        else if(getCookie("diceStatus") == "Rolling"){
                                            if(getCookie("diceRoller") != getCookie("username")){
                                                displayLiveDice(getCookie("diceRoller"));
                                            }
                                        }
                                    });

                                    JoinRoom(getCookie("userID"));

                                    //Display player List
                                    onValue(ref(db, "Connection/" + getCookie("roomID") + "/"), (snapshot) => {
                                        const playerListContainer = document.getElementById("player-display-list");
                                        var playerInRoom = 0;
                                        var readyUser = 0;
                                        var hostCount = 0;
                                        var hostID = "";

                                        //Remove the previous html tag
                                        playerListContainer.innerHTML = "";

                                        //Remove user pieces by Default
                                        removeHTMLElementByClass("player-choice");

                                        snapshot.forEach((childSnapshot) => {
                                            var IsYou = "";
                                            const host = childSnapshot.val().hasOwnProperty("host") ? 
                                            `<span id="player-` + childSnapshot.key + `-host-state" class="room-host">
                                            <i class="fa fa-user-circle" aria-hidden="true"></i>
                                            </span>` : "";

                                            const kickAction = childSnapshot.val().hasOwnProperty("host") ? 
                                            "" 
                                            :
                                            `<button class='btn btn-danger ml-1 kick-btn p-1' data-value="${childSnapshot.key}" style="display:none;">
                                                <i class='fa fa-trash' aria-hidden='true'></i>
                                            </button>`;

                                            //Check if the user is kicked
                                            if(childSnapshot.val().hasOwnProperty("kicked") && childSnapshot.key == getCookie("userID")){
                                                route("Home", "HostKicked");
                                            }

                                            if(host != ""){
                                                hostCount++;
                                                hostID = childSnapshot.key;
                                            }

                                            if(childSnapshot.key == getCookie("userID")){
                                                IsYou = "(You)";
                                                myPiecePosition = childSnapshot.val().pieceIndex;
                                            }

                                            var ready = "";

                                            if(childSnapshot.val().status == "Online"){

                                                // Display user's piece
                                                displayHTMLElement(`player-${childSnapshot.val().pieceIndex + 1}`);

                                                if(childSnapshot.val().hasOwnProperty("gameStatus")){
                                                    if(childSnapshot.val().gameStatus === "Ready"){
                                                        readyUser++;
                                                        ready =  
                                                        `<span id="player-` + childSnapshot.key + `-ready-state" class="player-ready-state">
                                                        <i class="fa fa-check" aria-hidden="true"></i>
                                                        </span>`;
                                                    }
                                                }

                                                playerInRoom++;

                                                playerListContainer.innerHTML += 
                                                `<div class="player-display-container bg-light text-dark mt-2">
                                                    <div class="player-name-container">` +  
                                                    gamePiece[childSnapshot.val().pieceIndex]
                                                        + `
                                                        <span id="player-` + childSnapshot.key +  `-piece"></span>
                                                        <span id="player-` + childSnapshot.key +  `-name">
                                                            ` + childSnapshot.val().name + IsYou + ` 
                                                        </span>`+
                                                        host + 
                                                        ready +
                                                        kickAction +
                                                    `</div>

                                                    <div id="player-balance-container">
                                                        <i class="fa fa-money" aria-hidden="true"></i> 

                                                        <span class="text-success">
                                                            RM 
                                                            <span id="player-` + childSnapshot.key + `-balance">
                                                                -
                                                            </span>
                                                            
                                                        </span>
                                                    </div>

                                                    <div class="player-property-container">
                                                        <i class="fa fa-home" aria-hidden="true"></i>
                                                        <span class="text-info" id="player-`+ childSnapshot.key + `-property">-</span>
                                                    </div>
                                                </div>`; 

                                            }

                                            if(hostCount > 1){
                                                const userInfo = {
                                                    status : "Online",
                                                    name: childSnapshot.val().name,
                                                    pieceIndex: childSnapshot.val().pieceIndex + 1
                                                };
                    
                                                set(ref(db, "Connection/" + getCookie("roomID") + "/" + childSnapshot.key), userInfo)
                                            }
                                            
                                        });

                                        //If less than two player game status become waiting
                                        if(playerInRoom < 2){
                                            const updates = {};
                                            updates["GameStatus/" + getCookie("roomID") + "/status"] = "Waiting";
                                            update(ref(db), updates);
                                        }

                                        //Select a new host if the old one left
                                        if(hostCount == 0){
                                            const userInfo = {
                                                status : "Online",
                                                name: getCookie("username"),
                                                host: true,
                                                pieceIndex: 0
                                            };
                
                                            set(ref(db, "Connection/" + getCookie("roomID") + "/" + getCookie("userID")), userInfo)
                                        }

                                        if(playerInRoom - 1 == readyUser && playerInRoom != 1){
                                            StartBtn.disabled = false;
                                        }
                                        else{
                                            StartBtn.disabled = true;
                                        }

                                        if(hostID == getCookie("userID")){
                                            displayHTMLElementByClass("kick-btn");

                                            const KickBtn = document.getElementsByClassName("kick-btn");
                                            for(var i = 0; i < KickBtn.length; i++){
                                                KickBtn[i].addEventListener("click", (e) =>{
                                                    if(window.confirm("Do you want to kick this player?")){
                                                        const kickID = e.currentTarget.getAttribute("data-value");

                                                        set(ref(db, "Kicked/" + getCookie("roomID") + "/" + kickID), {
                                                            kickedAt: getFormattedTimeStamp(),
                                                        })
                                                        .then(() => {
                                                            set(ref(db, "Connection/" + getCookie("roomID") + "/" + kickID), {
                                                                status: "Offline",
                                                            });
                                                        })
                                                        
                                                    }
                                                });
                                            }

                                            StartBtn.style.display = "";
                                        }
                                        else{
                                            StartBtn.style.display = "none";
                                        }

                                    });

                                    //Listen for Cash Changes
                                    onValue(ref(db, "Cash/" + getCookie("roomID") + "/"), (snapshot) => {
                                        snapshot.forEach((childSnap) =>{
                                            displayCustomMessage(`player-${childSnap.key}-balance`, priceFormatter(childSnap.val().balance));
                                        });
                                    });

                                    //Listen for Property Changes
                                    onValue(ref(db, "Property/" + getCookie("roomID") + "/"), (snapshot) => {
                                        snapshot.forEach((childSnap) =>{
                                            displayCustomMessage(`player-${childSnap.key}-property`, priceFormatter(childSnap.val().quantity));
                                        });
                                    });

                                    //If disconnected
                                    onDisconnect(ref(db, "Connection/" + getCookie("roomID") + "/" + getCookie("userID"))).set({
                                        status: "Offline"
                                    });
                
                                    onDisconnect(ref(db, "Online/" + getCookie("userID"))).set({
                                        recordTime: getFormattedTimeStamp(),
                                        status: "Offline"
                                    });;
                                }
                                else{
                                    route("Home");
                                }
                            });
                        }
                    });

                }
            } 
            else {
                console.log("Invalid User");
            }
        }).catch((error) => {
            console.error(error);
        });

    }
});

function JoinRoom(uid){
    console.log("I am in join")

    get(child(dbRef, "Kicked/" + getCookie("roomID") + "/" + uid)).then((snapshot) => {
        if(snapshot.exists()){
            route("Home", "KickedRejoin");
        }
        else{
            get(child(dbRef, "Connection/" + getCookie("roomID"))).then((snapshot) => {
                var currentInRoom = 0;
                var alreadyInRoom = false;
        
                snapshot.forEach(childSnap => {
                    if(childSnap.val().status == "Online"){
                        currentInRoom++;
        
                        if(childSnap.key == getCookie("userID")){
                            alreadyInRoom = true;
                        }
                    }
        
                    if(childSnap.val().hasOwnProperty("gameStatus")){
                        if(child.val().gameStatus == "Ready"){
                            readyCount++;
                        }
                    }
        
                });
        
        
                if(!alreadyInRoom){
                    var newUser;
        
                    //Check Is Host
                    if(currentInRoom == 0){
                        newUser = {
                            status : "Online",
                            name: getCookie("username"),
                            host: true,
                            pieceIndex: currentInRoom
                        }
            
                        //Show start button
                        StartBtn.style.display = "";
                    }
                    else
                    {
                        newUser = {
                            status : "Online",
                            name: getCookie("username"),
                            pieceIndex: currentInRoom
                        }
            
                        //Show ready button
                        ReadyBtn.style.display = "";
                    }
            
                    //If the room is not full
                    if(currentInRoom < 4){
                        set(ref(db, "Connection/" + getCookie("roomID") + "/" + uid), newUser);
                    }
                    else{
                        route("Home");
                    }
                }
                else
                {
                    route("Home");
                }
                
            })
            .catch((error) => {
                console.error(error);
            });
        }
    });

}

const ExitRoomBtn = document.getElementById("exit-room-btn");
ExitRoomBtn.addEventListener("click", (e) => {
    LeaveRoom();
});

function LeaveRoom(){
    set(ref(db, "Connection/" + getCookie("roomID") + "/" + getCookie("userID")), {
        status : "Offline"
    })
    .then(() => {
        route("Home");
    });
}

ReadyBtn.addEventListener("click", (e) => {
    //Ready Action

    if(!IAmReady){
        const updates = {};
        updates["Connection/" + getCookie("roomID") + "/" + getCookie("userID") + "/" + "gameStatus"] = "Ready";
        update(ref(db), updates);
        IAmReady = true;
        ReadyBtn.innerHTML = "Cancel Ready";
        ReadyBtn.style.background = "#ffcc00";
        ReadyBtn.style.color = "black"
    }
    else{
        const updates = {};
        updates["Connection/" + getCookie("roomID") + "/" + getCookie("userID") + "/" + "gameStatus"] = "Not Ready";
        update(ref(db), updates);
        IAmReady = false;
        ReadyBtn.innerHTML = "Get Ready";
        ReadyBtn.style.background = "";
        ReadyBtn.style.color = ""
    }
    
});

StartBtn.addEventListener("click", (e) => {
    const updates = {};
    updates["GameStatus/" + getCookie("roomID") + "/status"] = "Started";
    update(ref(db), updates);
});

const backgroundMusic = document.getElementById("background-music");
//Play background music by default
backgroundMusic.play();

function muteVolume(){

    var input = document.getElementById("volume-adjust-input");

    if(input.value != 0){
        input.value = 0;
    }
    else{
        input.value = 100;
    }

    adjustVolume();
}

function adjustVolume(){
    var music = document.getElementById("background-music");
    var input = document.getElementById("volume-adjust-input");
    var volumeIcon = document.getElementById("volume-icon");

    if(input.value <= 100 && input.value > 70){
        volumeIcon.innerHTML = `<i class="fa fa-volume-up" aria-hidden="true"></i>`;
    }
    else if(input.value <= 70 && input.value != 0){
        volumeIcon.innerHTML = `<i class="fa fa-volume-down" aria-hidden="true"></i>`;
    }
    else if(input.value == 0){
        volumeIcon.innerHTML = `<i class="fa fa-volume-off" aria-hidden="true"></i>`;
    }

    music.volume = parseFloat(input.value / 100);

    //console.log("volume: " + (input / 100).toFixed());
}

const MuteButton = document.getElementById("volume-icon");
MuteButton.addEventListener("click", (e) => {
    muteVolume();
});

const VolumeBar = document.getElementById("volume-adjust-input");
VolumeBar.addEventListener("input", (e) => {
    adjustVolume();
});

function gameTimer(date) {
    const countDownDate = new Date(date).getTime();

    setInterval(function() {
        // Get today's date and time
        var now = new Date().getTime();
                
        // Find the distance between now and the count down date
        var distance = now - countDownDate;
            
        // Time calculations for days, hours, minutes and seconds
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
        // Output the result in an element with id="demo"
        document.getElementById("game-time-display").innerHTML =  
        doubleDigitFormatter(hours) + ":" + doubleDigitFormatter(minutes) + ":" + doubleDigitFormatter(seconds);
    }, 1000);

}

const GameChatInput = document.getElementById("game-chat-input");
GameChatInput.addEventListener("keyup", (e) =>{
    if (e.keyCode === 13) {
        const randomID = crypto.randomUUID();
        const chatMessage = GameChatInput.value.trim();

        if(chatMessage.length != 0){

            set(ref(db, 'GameChat/' + getCookie("roomID") + "/" + randomID), {
                sentTime: getFormattedTimeStamp(),
                displayTime: getFormattedTime(),
                message: chatMessage,
                sender: getCookie("username"),
                senderID: getCookie("userID"),
                timestamp: getTimestamp()
            })
            .then(() => {
                //Empty the input field
                setFormValue("game-chat-input", "");
            });
        }
    }
});

//Double click tab section to scroll to bottom automatically
const ChatTab = document.getElementById("nav-chat-tab");
ChatTab.addEventListener("click", (e) => {
    ChatDisplayContainer.scrollTo(0, ChatDisplayContainer.scrollHeight);
});

function startGame(){

    get(child(dbRef, "Connection/" + getCookie("roomID"))).then((snapshot) => {
        const userID = [];

        snapshot.forEach((childSnap) => {
            if(childSnap.val().status == "Online"){
                userID.push(childSnap.key);
            }
        });

        for(var i = 0; i < userID.length; i++){
            const updates = {};
            updates["Cash/" + getCookie("roomID") + `/${userID[i]}/balance`] = 20000000;
            updates["Property/" + getCookie("roomID") + `/${userID[i]}/quantity`] = 0;
            update(ref(db), updates);
        }

    });
}

function gameStartedTimer(){

    var seconds = 3;

    var x = setInterval(function() {

        displayCustomMessage("game-started-warning", 
        `The game will be started in ${seconds} second(s)`);
        displayHTMLElement("game-started-warning");
        
        seconds--;
        if (seconds == -2) {
            removeHTMLElement("game-started-warning");
            clearInterval(x);

            if(myPiecePosition == 0){
                displayHTMLElement("dice-display-container");
            }
        }
    }, 1000);

}

function displayLiveDice(playersTurn){

    const intervalID = setInterval(() => {
        if(liveDiceCounter == 0){
            removeHTMLElement("dice-roll-trigger");
            displayHTMLElement("dice-display-container");
            displayCustomMessage("dice-number", "Dice Rolling...");
            displayCustomMessage("dice-timer", `It's ${playersTurn} 's turn now`);
        }
        
        liveDiceCounter++;
    
        var index = Math.ceil(Math.random()* 6);
        var diceArray =
        ['0',
            `<div class="dot dot-one"></div>`,
            `<div class="dot dot-two-one"></div>
            <div class="dot dot-two-two"></div>`,
            `<div class="dot dot-three-one"></div>
            <div class="dot dot-three-two"></div>
            <div class="dot dot-three-three"></div>`,
            `<div class="dot dot-four-one"></div>
            <div class="dot dot-four-two"></div>
            <div class="dot dot-four-three"></div>
            <div class="dot dot-four-four"></div>`,
            `<div class="dot dot-five-one"></div>
            <div class="dot dot-five-two"></div>
            <div class="dot dot-five-three"></div>
            <div class="dot dot-five-four"></div>
            <div class="dot dot-five-five"></div>`,
            `<div class="dot dot-six-one"></div>
            <div class="dot dot-six-two"></div>
            <div class="dot dot-six-three"></div>
            <div class="dot dot-six-four"></div>
            <div class="dot dot-six-five"></div>
            <div class="dot dot-six-six"></div>`
        ];
    
        displayCustomMessage("dice-container", diceArray[index]);
        
        if(getCookie("diceStatus") == "Stopped"){
            liveDiceCounter = 0;
            displayCustomMessage("dice-container", diceArray[getCookie("currentRoomDice")]);
            displayCustomMessage("dice-number", `${playersTurn} has gotten a ${getCookie("currentRoomDice")} out of the rolled dice!`);
            clearInterval(intervalID);
        }
    }, 100);

}

function myTurnToRollDice(){

    var index = Math.ceil(Math.random()* 6);
    var diceArray =
    ['0',
        `<div class="dot dot-one"></div>`,
        `<div class="dot dot-two-one"></div>
        <div class="dot dot-two-two"></div>`,
        `<div class="dot dot-three-one"></div>
        <div class="dot dot-three-two"></div>
        <div class="dot dot-three-three"></div>`,
        `<div class="dot dot-four-one"></div>
        <div class="dot dot-four-two"></div>
        <div class="dot dot-four-three"></div>
        <div class="dot dot-four-four"></div>`,
        `<div class="dot dot-five-one"></div>
        <div class="dot dot-five-two"></div>
        <div class="dot dot-five-three"></div>
        <div class="dot dot-five-four"></div>
        <div class="dot dot-five-five"></div>`,
        `<div class="dot dot-six-one"></div>
        <div class="dot dot-six-two"></div>
        <div class="dot dot-six-three"></div>
        <div class="dot dot-six-four"></div>
        <div class="dot dot-six-five"></div>
        <div class="dot dot-six-six"></div>`
    ]

    displayCustomMessage("dice-timer", "It's your turn now");
    displayCustomMessage("dice-container", diceArray[index]);
    displayCustomMessage("dice-number", "");

    diceCounter = diceCounter + 1;

    if(diceCounter == 1){
        removeHTMLElement("dice-roll-trigger");
        //Set the current dice number
        const updates = {};
        updates["rooms/" + getCookie("roomID") + `/DiceStatus`] = "Rolling";
        updates["rooms/" + getCookie("roomID") + `/DiceRoller`] = getCookie("username");
        updates["rooms/" + getCookie("roomID") + `/PieceMoving`] = "Yes";

        update(ref(db), updates);
    }

    if (diceCounter < 20){
        setTimeout(function(){
            myTurnToRollDice();
        }, 5); 
    }
    else if (diceCounter < 120){
        setTimeout(function(){
            myTurnToRollDice();
        }, 10); 
    }
    else if(diceCounter < 125){
        setTimeout(function(){
            myTurnToRollDice();
        }, 300);  
    }
    else if(diceCounter < 128){
        setTimeout(function(){
            myTurnToRollDice();
        }, 500); 
    }
    else{
        diceCounter = 0;
        displayCustomMessage("dice-number", "You have gotten a " + index + " out of the rolled dice!");

        //Set the current dice number
        const updates = {};
        updates["rooms/" + getCookie("roomID") + `/CurrentDiceNumber`] = index;
        updates["rooms/" + getCookie("roomID") + `/DiceStatus`] = "Stopped";
        update(ref(db), updates);
        
    }
}

const rollDiceBtn = document.getElementById("dice-roll-trigger");
rollDiceBtn.addEventListener("click", (e) => {
    myTurnToRollDice();
});

function determineNextSequence(sequence){
    if(sequence < 3){
        sequence = sequence + 1
    }
    else{
        sequence = 0;
    }

    setCookie("currentSeqeunce", sequence, 7);
    return sequence;
}

function pieceMovingSoundEffect(){
    var music = document.getElementById("moving-piece-sound-effect");

    //Play music
    music.play();
}

function movePlayerPieceByOne(playerNo, origin, currentCounter, diceNumber){
    var player = [ `<div id="player-1" class="player-choice player-color-1">
                        <i class="fa fa-car" aria-hidden="true"></i>
                    </div>`,
                    `<div id="player-2" class="player-choice player-color-2">
                        <i class="fa fa-bug" aria-hidden="true"></i>
                    </div>`,
                    `<div id="player-3" class="player-choice player-color-3">
                        <i class="fa fa-motorcycle" aria-hidden="true"></i>
                    </div>`,
                    `<div id="player-4" class="player-choice player-color-4">
                        <i class="fa fa-fighter-jet" aria-hidden="true"></i>
                    </div>`];
    
    var originalPlace = document.getElementById("player-piece-container-" + origin + "-" + playerNo);
    var destination = origin + 1;

    if(destination > 28){
        destination = destination - 28;
    }

    var destinationPlace = document.getElementById("player-piece-container-" + destination + "-" + playerNo);

    //remove the old player piece 
    originalPlace.innerHTML = "";
    destinationPlace.innerHTML = player[playerNo - 1];

    //play sound effect
    pieceMovingSoundEffect();

    currentCounter++;

    console.log("Counter", currentCounter, "Dice number", diceNumber)

    if(currentCounter != diceNumber){
        setTimeout(function(){
            movePlayerPieceByOne(playerNo, destination, currentCounter, diceNumber);
        },500);
    }
    else{
        //Set the current dice number
        const updates = {};
        const sequence = parseInt(getCookie("currentSeqeunce"));
        updates["rooms/" + getCookie("roomID") + `/Player${sequence+1}Position`] = destination;
        updates["rooms/" + getCookie("roomID") + `/CurrentPlayerSequence`] = determineNextSequence(parseInt(getCookie("currentSeqeunce")));
        updates["rooms/" + getCookie("roomID") + `/PieceMoving`] = "No";
        update(ref(db), updates);
    }
}

function movePlayerAnimation(playerNo, diceNumber, origin){
    movePlayerPieceByOne(playerNo, origin, 0, diceNumber);
}