import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, set, child, get, onValue, onDisconnect } from "firebase/database";
import { getFormattedTimeStamp } from '../dist/script/module-helper';

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
const WelcomeDisplay = document.getElementById("welcome-display");
var userID;
var username;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        route("Index");
    }
    else
    {
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
            }
        })
        .catch((error) => {
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