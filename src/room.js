import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set, get, child, update, onDisconnect, onValue } from "firebase/database";
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
const connectionRef = ref(db, "Connection/" + getCookie("AuathenticatedUID"));

//If disconnected
onDisconnect(connectionRef).set({
    online: false
});

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
                    //Check room exists
                    get(child(dbRef, `rooms/${roomID}`)).then((snapshot) => {
                        if(snapshot.exists()){
                            JoinRoom(snapshot.val().numOfPlayer);
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

function JoinRoom(numOfPlayer){
    
    if(!alreadyInRoom(numOfPlayer)){
        if(numOfPlayer.player1 == ""){
            numOfPlayer.player1 = userID;
            numOfPlayer.currentInRoom += 1;
        }
        else if(numOfPlayer.player2 === "")
        {
            numOfPlayer.player2 = userID;
            numOfPlayer.currentInRoom += 1;
        }
        else if(numOfPlayer.player3 === "")
        {
            numOfPlayer.player3 = userID;
            numOfPlayer.currentInRoom += 1;
        }
        else if(numOfPlayer.player4 === "")
        {
            numOfPlayer.player4 = userID;
            numOfPlayer.currentInRoom += 1;
        }
    
        const updates = {};
        updates['rooms/' + roomID + "/numOfPlayer"] = numOfPlayer;
    
        return update(ref(db), updates);
    }
    
}

function alreadyInRoom(numOfPlayer){

    if(numOfPlayer.player1 == userID){
        return true;
    }
    else if(numOfPlayer.player2 === userID)
    {
        return true;
    }
    else if(numOfPlayer.player3 === userID)
    {
        return true;
    }
    else if(numOfPlayer.player4 === userID)
    {
        return true;
    }

    return false;
}
