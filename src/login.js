import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { setCookie, displayCustomMessage, route, getUrlParams } from '../dist/script/module-helper';

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

//Check Is Authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        route("Home");
    } 
});

//Check if the user is registered
if(getUrlParams("Registered") != null){
    displayCustomMessage("login-message", "<span class='text-success'>You may login now</span>");
}

const LoginBtn = document.getElementById("login-btn");
LoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    var emailInput = document.getElementById("user-email").value;
    var passwordInput = document.getElementById("user-password").value;
    Login(emailInput, passwordInput);
});

function Login(email, password) {
    //Remove previous message
    displayCustomMessage("login-message", "");

    if(email.trim().length === 0 || password.length === 0){
        displayCustomMessage("login-message", "You cannot leave empty field(s)!");
    }
    else{
        $(".loader").show();
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const userID = userCredential.user.uid;
            setCookie("AuathenticatedUID", userID, 7);
            route("Home");
        })
        .catch((error) => {
            $('.loader').hide();
            displayCustomMessage("login-message", "Invalid username or password!");

            const errorCode = error.code;
            const errorMessage = error.message;
            console.log("Login Failed")
        });
    }
}

