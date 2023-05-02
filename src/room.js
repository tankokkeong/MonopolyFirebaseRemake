import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set, get, child, update, onDisconnect, onValue, remove } from "firebase/database";
import { route, getUrlParams, getCookie } from '../dist/script/module-helper';

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

onAuthStateChanged(auth, (user) => {
    if (!user) {
        route("Index");
    } 
    else{
        userID = user.uid;
        get(child(dbRef, `users/${userID}`)).then((snapshot) => {
            if (snapshot.exists()) {
                username = snapshot.val().username;
                roomID = getUrlParams("room");
                if(roomID == null){
                    route("Home");
                }
                else{
                    const connectionRef = ref(db, "Connection/" + roomID + "/" + userID);

                    //If disconnected
                    onDisconnect(connectionRef).set({
                        status: "Offline"
                    });

                    //Check room exists
                    get(child(dbRef, `rooms/${roomID}`)).then((snapshot) => {
                        if(snapshot.exists()){
                            JoinRoom(userID);
                        }
                        else{
                            route("Home");
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
    get(child(dbRef, "Connection/" + roomID)).then((snapshot) => {
        var currentInRoom = 0;

        snapshot.forEach(childSnap => {
            if(childSnap.val().status == "Online"){
                currentInRoom++;
            }
        });

        //If the room is not full
        if(currentInRoom < 1){
            set(ref(db, "Connection/" + roomID + "/" + uid), {
                status : "Online"
            })
            .then(() => {
                console.log("Successfully join room")
            });
        }
        else{
            route("Home");
        }
    })
    .catch((error) => {
        console.error(error);
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