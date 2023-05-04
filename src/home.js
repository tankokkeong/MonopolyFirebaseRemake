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

                        const roomAction =  childSnapshot.val().status == "Started" ? 
                        `<td style="position: relative">
                            <span class="text-danger">Not Available</span>
                            ${adminAction}
                        </td>`
                        :
                        `<td style="position: relative">
                            <button class="btn btn-primary" onclick="route('Room','room=` +  childSnapshot.key + `')">Join Game</button>
                            ${adminAction}                    
                        </td>`;

                        roomDisplay.innerHTML = roomDisplay.innerHTML+
                        `<tr>
                            <td>` + childSnapshot.key + `</td>
                            <td class="text-warning">` + childSnapshot.val().status + `</td>
                            <td><span id="current-player-` + childSnapshot.key + `">0</span>/4</td>` + 
                            roomAction
                            +
                        `</tr>`;
                    });

                    //Display number of room
                    numberOfRoomDisplay.innerHTML = numberOfRoom;

                    const DeleteBtn = document.getElementsByClassName("delete-btn");
                    for(var i = 0; i < DeleteBtn.length; i++){
                        DeleteBtn[i].addEventListener("click", (e) => {

                            if (window.confirm("Do you want to delete remove this room?")) {
                                const DeletedRoomID = e.currentTarget.getAttribute("data-value");

                                //Delete the relevant records
                                removeRoom(DeletedRoomID);
                            }
                        });
                    }
                });

                // Check join game
                const connectionRef = ref(db, 'Connection/');

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
        status : "Waiting",
        CurrentDiceNumber : 0,
        CurrentPlayerSequence : 1
    })
    .then(() => {
        route("Room", "room=" + roomID);
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
}

//Display if admin closed the room
if(getUrlParams("AdminClosed") != null){
    displayCustomMessage("home-alert-text", "Your room was removed by Admin!");
    displayHTMLElement("home-alert");
}