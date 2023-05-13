import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, set, child, get, onValue, onDisconnect, remove } from "firebase/database";
import { displayCustomMessage, route, getFormattedTimeStamp, getTimestamp, displayHTMLElement,
    getUrlParams
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
const db = getDatabase();
const dbRef = ref(getDatabase());
const auth = getAuth();
const numberOfRoomDisplay = document.getElementById("total-room");
const roomDisplay = document.getElementById("room-table");
const WelcomeDisplay = document.getElementById("welcome-display");
var numberOfRoom = 0;
var userID;
var username;
var adminID;

get(child(dbRef, `AdminID`)).then((snapshot) => {
    if (snapshot.exists()) {
        adminID = snapshot.val();
    } 
    else 
    {
        console.log("Admin not available!");
    }
})
.catch((error) => {
console.error(error);
});

onAuthStateChanged(auth, (user) => {
    if (!user) {
        route("Index");
    } 
    else{
        userID = user.uid;

        //If use connected
        set(ref(db, 'Online/' + userID), {
            recordTime: getFormattedTimeStamp(),
            status: "Online"
        });

        //If user disconnected
        onDisconnect(ref(db, "Online/" + userID)).set({
            recordTime: getFormattedTimeStamp(),
            status: "Offline"
        });;

        get(child(dbRef, `users/${userID}`)).then((snapshot) => {
            if (snapshot.exists()) {
                username = snapshot.val().username;

                //Display welcome user
                WelcomeDisplay.innerHTML = username

                //Display Room
                const RoomRef = ref(db, 'rooms/');
                onValue(RoomRef, (snapshot) => {
                    //Empty the previous html tag
                    roomDisplay.innerHTML = "";
                    numberOfRoom = 0;

                    snapshot.forEach((childSnapshot) => {
                        numberOfRoom++;
                        const adminAction = userID == adminID ? 
                        `<button class="btn btn-danger delete-btn ml-3" data-value="${childSnapshot.key}">Remove</button>`
                        : "";

                        roomDisplay.innerHTML = roomDisplay.innerHTML+
                        `<tr>
                            <td>` + childSnapshot.key + `</td>
                            <td class="text-warning" id="game-status-${childSnapshot.key}">Loading...</td>
                            <td><span id="current-player-` + childSnapshot.key + `">0</span>/4</td>
                            <td style="position: relative">
                                <span class="text-danger" id="game-action-${childSnapshot.key}">Loading...</span>
                                ${adminAction}
                            </td>
                        </tr>`;
                    });

                    //Display number of room
                    numberOfRoomDisplay.innerHTML = numberOfRoom;

                    const DeleteBtn = document.getElementsByClassName("delete-btn");
                    for(var i = 0; i < DeleteBtn.length; i++){
                        DeleteBtn[i].addEventListener("click", (e) => {

                            if (window.confirm("Do you want to delete remove this room?")) {
                                const DeletedRoomID = e.currentTarget.getAttribute("data-value");

                                set(ref(db, 'AdminClosed/' + DeletedRoomID), {
                                    deletedAt: getFormattedTimeStamp(),
                                })
                                .then(() => {
                                    //Delete the relevant records
                                    removeRoom(DeletedRoomID);
                                });

                            }
                        });
                    }
                });

                // Check join game
                const connectionRef = ref(db, 'Connection/');

                //Check number of player in a room
                onValue(connectionRef, (parentSnap) => {

                    parentSnap.forEach((childSnap) => {
                        var currentInRoom = 0;
                        childSnap.forEach((grandChild) => {
                            if(grandChild.val().status == "Online"){
                                currentInRoom++;
                            }
                        });

                        if(currentInRoom == 0){
                            //Remove room if there is no user
                            removeRoom(childSnap.key);
                        }

                        displayCustomMessage("current-player-"+ childSnap.key, currentInRoom);
                    });
                });

                //Check total online user
                onValue(ref(db, 'GameStatus/'), (parentSnap) => {
                    parentSnap.forEach((childSnap) => {
                        displayCustomMessage(`game-status-${childSnap.key}`, childSnap.val().status);
                        
                        if(childSnap.val().status == "Waiting"){
                            displayCustomMessage(`game-action-${childSnap.key}`, `<button class="btn btn-primary" onclick="route('Room','room=` +  childSnap.key + `')">Join Game</button>`);
                        }
                        else
                        {
                            displayCustomMessage(`game-action-${childSnap.key}`, `<span class="text-danger">Not Available</span>`);
                        }
                    });
                });

                //Check total online user
                onValue(ref(db, 'Online/'), (parentSnap) => {
                    var currentOnline = 0;

                    parentSnap.forEach((childSnap) => {
                        if(childSnap.val().status == "Online"){
                            currentOnline++;
                        }
                    });

                    displayCustomMessage("total-online-user", currentOnline);

                });

            } 
            else {
                console.log("Invalid User");
            }
        }).catch((error) => {
            console.error(error);
        });
    }
});

const LogoutAction = document.getElementById("logout-action");
LogoutAction.addEventListener("click", (e) => {
    signOut(auth).then(() => {
        setCookie("AuathenticatedUID", "", -7);
        route("Index");
    })
    .catch((error) => {
        // An error happened.
        console.log(error)
    });
});

const CreateRoomBtn = document.getElementById("create-room-btn");
CreateRoomBtn.addEventListener("click", (e) => {
    const roomID = crypto.randomUUID()
    set(ref(db, 'rooms/' + roomID), {
        createdBy: userID,
        createdName : username,
        createdAt: getTimestamp(),
        CurrentDiceNumber : 0,
        CurrentPlayerSequence : 0,
        DiceStatus : "Stopped",
        DiceRoller: "",
        Player1Position: 1,
        Player2Position: 1,
        Player3Position: 1,
        Player4Position: 1,
        PieceMoving: "No"
    })
    .then(() => {
        set(ref(db, 'GameStatus/' + roomID), {
            createdAt: getFormattedTimeStamp(),
            status : "Waiting",
        })
        .then(() => {
            route("Room", "room=" + roomID);
        });
    })
    .catch((error) => {
        // An error happened.
        console.log(error)
    });
});

function removeRoom(roomID){
    //Delete the relevant records
    remove(ref(db, 'Connection/' + roomID));
    remove(ref(db, 'rooms/' + roomID));
    remove(ref(db, 'GameStatus/' + roomID));
}

//Display if admin closed the room
if(getUrlParams("AdminClosed") != null){
    displayCustomMessage("home-alert-text", "Your room was removed by Admin!");
    displayHTMLElement("home-alert");
}

//Display if kicked by the room host
if(getUrlParams("HostKicked") != null){
    displayCustomMessage("home-alert-text", "You were kicked by the room host!");
    displayHTMLElement("home-alert");
}

//Display if kicked rejoin message
if(getUrlParams("KickedRejoin") != null){
    displayCustomMessage("home-alert-text", "You cannot rejoin the room if you were kicked before!");
    displayHTMLElement("home-alert");
}