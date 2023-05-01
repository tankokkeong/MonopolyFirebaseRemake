import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, set, child, get, onValue } from "firebase/database";
import { route } from '../dist/script/module-helper';

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

onAuthStateChanged(auth, (user) => {
    if (!user) {
        route("Index");
    } 
    else{
        userID = user.uid;
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

                snapshot.forEach((childSnapshot) => {
                    const data = childSnapshot.val();
                    numberOfRoom++;
                    console.log(data)
                    const roomAction =  childSnapshot.val().status == "Start" ? 
                    `<td style="position: relative">
                        <span class="text-danger">Not Available</span>
                    </td>`
                    :
                    `<td style="position: relative">
                        <a class="btn btn-primary" onclick="route('Room','` +  childSnapshot.key + `')">Join Game</button>                    
                    </td>`;

                    roomDisplay.innerHTML = roomDisplay.innerHTML+
                    `<tr>
                        <td>` + childSnapshot.key + `</td>
                        <td class="text-warning">` + childSnapshot.val().status + `</td>
                        <td>` + childSnapshot.val().numOfPlayer + `/4</td>` + 
                        roomAction
                        +
                    `</tr>`;
                });

                //Display number of room
                numberOfRoomDisplay.innerHTML = numberOfRoom + " room(s)";
            });

        } else {
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
    }).catch((error) => {
        // An error happened.
        console.log(error)
    });
});

const CreateRoomBtn = document.getElementById("create-room-btn");
CreateRoomBtn.addEventListener("click", (e) => {
    set(ref(db, 'rooms/' + crypto.randomUUID()), {
        createdBy: userID,
        createdName : username,
        createdAt: new Date(),
        numOfPlayer: 1,
        status : "Waiting",
        CurrentDiceNumber : 0,
        CurrentPlayerSequence : 1
    });
});