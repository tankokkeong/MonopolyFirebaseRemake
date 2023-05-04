import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set, get, child, update, onDisconnect, onValue, query, orderByValue} from "firebase/database";
import { route, getUrlParams, getFormattedTimeStamp
    , displayHTMLElementByClass 
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
var IAmReady = false;
var roomExistsBefore = false;

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

onAuthStateChanged(auth, (user) => {
    if (!user) {
        route("Index");
    } 
    else{
        userID = user.uid;

        // Set user online
        set(ref(db, 'Online/' + userID), {
            recordTime: getFormattedTimeStamp(),
            status: "Online"
        });

        get(child(dbRef, `users/${userID}`)).then((snapshot) => {
            if (snapshot.exists()) {
                username = snapshot.val().username;
                roomID = getUrlParams("room");
                if(roomID == null){
                    route("Home");
                }
                else{
                    //Check kicked
                    onValue(ref(db, "Kicked/" + roomID + "/"), (snapshot) => {
                        snapshot.forEach((childSnap) =>{
                            if(childSnap.key == userID){
                                route("Home", "HostKicked");
                            }
                        });
                    });

                    console.log("b4 check multiple tab")
                    //Check if there are multiple tabs with the same account
                    get(child(dbRef, `Connection/${roomID}/${userID}`)).then((snapshot) => {

                        if(snapshot.exists() && snapshot.val().status == "Online"){
                            route("Home", "MultipleAccount");
                        }
                        else
                        {
                            console.log("b4 check room exists")

                            //Check room exists
                            get(child(dbRef, `rooms/${roomID}`)).then((snapshot) => {
                                if(snapshot.exists()){

                                    //Used to detect whether admin closes the room
                                    onValue(ref(db, "rooms"), (snapshot) => {
                                        get(child(dbRef, `AdminClosed/${roomID}`)).then((snapshot) => {
                                            if(snapshot.exists()){
                                                route("Home", "AdminClosed");
                                            }
                                        });
                                    });

                                    JoinRoom(userID);

                                    //Display player List
                                    onValue(ref(db, "Connection/" + roomID + "/"), (snapshot) => {
                                        const playerListContainer = document.getElementById("player-display-list");
                                        var playerInRoom = 0;
                                        var readyUser = 0;
                                        var hostCount = 0;
                                        var hostID = "";

                                        //Remove the previous html tag
                                        playerListContainer.innerHTML = "";

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
                                            if(childSnapshot.val().hasOwnProperty("kicked") && childSnapshot.key == userID){
                                                route("Home", "HostKicked");
                                            }

                                            if(host != ""){
                                                hostCount++;
                                                hostID = childSnapshot.key;
                                            }

                                            if(childSnapshot.key == userID){
                                                IsYou = "(You)";
                                            }

                                            var ready = "";

                                            if(childSnapshot.val().status == "Online"){

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
                                                                20,000,000
                                                            </span>
                                                            
                                                        </span>
                                                    </div>

                                                    <div class="player-property-container">
                                                        <i class="fa fa-home" aria-hidden="true"></i>
                                                        <span class="text-info" id="player-`+ childSnapshot.key + `-property">0</span>
                                                    </div>
                                                </div>`; 

                                            }

                                            if(hostCount > 1){
                                                const userInfo = {
                                                    status : "Online",
                                                    name: childSnapshot.val().name,
                                                    pieceIndex: childSnapshot.val().pieceIndex + 1
                                                };
                    
                                                set(ref(db, "Connection/" + roomID + "/" + childSnapshot.key), userInfo)
                                            }
                                            
                                        });

                                        if(playerInRoom - 1 == readyUser && playerInRoom != 1){
                                            StartBtn.disabled = false;
                                        }
                                        else{
                                            StartBtn.disabled = true;
                                        }

                                        if(hostID == userID){
                                            displayHTMLElementByClass("kick-btn");

                                            const KickBtn = document.getElementsByClassName("kick-btn");
                                            for(var i = 0; i < KickBtn.length; i++){
                                                KickBtn[i].addEventListener("click", (e) =>{
                                                    if(window.confirm("Do you want to kick this player?")){
                                                        const kickID = e.currentTarget.getAttribute("data-value");

                                                        set(ref(db, "Kicked/" + roomID + "/" + kickID), {
                                                            kickedAt: getFormattedTimeStamp(),
                                                        })
                                                        .then(() => {
                                                            set(ref(db, "Connection/" + roomID + "/" + kickID), {
                                                                status: "Offline",
                                                            });
                                                        })
                                                        
                                                    }
                                                });
                                            }
                                        }

                                    });

                                    const connectionRef = ref(db, "Connection/" + roomID + "/" + userID);

                                    //If disconnected
                                    onDisconnect(connectionRef).set({
                                        status: "Offline"
                                    });
                
                                    onDisconnect(ref(db, "Online/" + userID)).set({
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

    get(child(dbRef, "Kicked/" + roomID + "/" + uid)).then((snapshot) => {
        if(snapshot.exists()){
            route("Home", "KickedRejoin");
        }
        else{
            get(child(dbRef, "Connection/" + roomID)).then((snapshot) => {
                var currentInRoom = 0;
                var alreadyInRoom = false;
        
                snapshot.forEach(childSnap => {
                    if(childSnap.val().status == "Online"){
                        currentInRoom++;
        
                        if(childSnap.key == userID){
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
                            name: username,
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
                            name: username,
                            pieceIndex: currentInRoom
                        }
            
                        //Show ready button
                        ReadyBtn.style.display = "";
                    }
            
                    //If the room is not full
                    if(currentInRoom < 4){
                        set(ref(db, "Connection/" + roomID + "/" + uid), newUser);
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
    set(ref(db, "Connection/" + roomID + "/" + userID), {
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
        updates["Connection/" + roomID + "/" + userID + "/" + "gameStatus"] = "Ready";
        update(ref(db), updates).then((message) => {
            console.log("I am ready!", message);
        });
        IAmReady = true;
        ReadyBtn.innerHTML = "Cancel Ready";
        ReadyBtn.style.background = "#ffcc00";
        ReadyBtn.style.color = "black"
    }
    else{
        const updates = {};
        updates["Connection/" + roomID + "/" + userID + "/" + "gameStatus"] = "Not Ready";
        update(ref(db), updates);
        IAmReady = false;
        ReadyBtn.innerHTML = "Get Ready";
        ReadyBtn.style.background = "";
        ReadyBtn.style.color = ""
    }
    
});

StartBtn.addEventListener("click", (e) => {
    const updates = {};
    updates["rooms/" + roomID + "/status"] = "Started";
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