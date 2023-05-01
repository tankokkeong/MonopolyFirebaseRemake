import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { displayCustomMessage, route } from '../dist/script/module-helper';

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

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const db = getDatabase();

//Check Is Authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        route("Home");
    } 
});

const RegisterBtn = document.getElementById("register-btn");
RegisterBtn.addEventListener("click", (e) => {
    e.preventDefault();
    var emailInput = document.getElementById("user-email").value;
    var passwordInput = document.getElementById("user-password").value;
    var username = document.getElementById("username").value;
    CreateNewUser(emailInput, passwordInput, username);
});

function CreateNewUser(email, password, username){

    //Remove previous message
    displayCustomMessage("register-message", "");

    if(email.trim().length === 0 || password.length === 0 || username.trim().length === 0){
        displayCustomMessage("register-message", "You cannot leave empty field(s)!");
    }
    else{
        $(".loader").show();
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const userID = userCredential.user.uid;

            set(ref(db, 'users/' + userID), {
                username: username,
                email: email,
                uid: userID
            })
            .then(() => {
                route("Index", "Registered");
            })
            .catch((error) => {
                console.log(error);
            });
        })
        .catch((error) => {
            $(".loader").hide();
            if(error.code === "auth/invalid-email"){
                displayCustomMessage("register-message", "The email format is invalid!");
            }
            else if(error.code === "auth/weak-password"){
                displayCustomMessage("register-message", "Your password cannot be less than 6 characters!");
            }
            else{
                displayCustomMessage("register-message", "This email already exists!");
            }
        });
    }
    
}