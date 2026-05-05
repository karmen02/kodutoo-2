
// firebase asjad 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC3_sEDhF9TzZBqeXHL1iOI-TpzX1bxJKI",
  authDomain: "kodunetoo-83d8c.firebaseapp.com",
  projectId: "kodunetoo-83d8c",
  storageBucket: "kodunetoo-83d8c.firebasestorage.app",
  messagingSenderId: "939766190214",
  appId: "1:939766190214:web:897c49fb15c85bdb2e8107",
  databaseURL: "https://kodunetoo-83d8c-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getDatabase(app); 

async function login() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("Sisse logitud:", result.user.displayName);
       
        document.getElementById("loginContainer").style.display = "none";
        let fullName=result.user.displayName;
        let nameParts=fullName.split(" ");
        let shortName=fullName;
        
        //nime lühendamine et kõik ei teaks täisnime kui see on TOPis
        if (nameParts.length > 1){
            shortName=nameParts[0] + " " + nameParts[nameParts.length - 1].charAt(0) + ".";
        }
        
        return shortName;
    } catch (error) {
        console.log("Login error:", error);
        return "Sisse logimine ei töötanud! Proovi uuesti!";
    }
}
//_----------------------//


console.log("Fail õigesti ühendatud");

class Typer{
    constructor(playerName){
        this.name = playerName;
        this.wordsInGame = 1;
        this.startingWordLength = 2;
        this.startTime = 0;
        this.endTime = 0;
        this.word = "Suvaline";
        this.words = [];
        this.typeWords = [];
        this.wordsTyped = 0;
        this.score = 0;

        this.results = [];

        this.loadFromFile();
    }

    async loadFromFile(){
        console.log("load from file sees");
        const responseFromFile = await fetch("lemmad2013.txt");
        const allWords = await responseFromFile.text();
        this.getWords(allWords);
    }
    
    getWords(data){
        const dataFromFile = data.split("\n");
        this.separateWordsByLength(dataFromFile);
    }
    //separateWordsByLength aitas korrektseks teha AI promptiga: mu js: (js kood). Mulle ei viska ette "Mäng läbi kirja" miks?
    separateWordsByLength(words){
        for (let word of words){
            word = word.trim(); 
            
            const wordLength = word.length;
            
            
            if (wordLength === 0) continue; 

            if(!this.words[wordLength]){
                this.words[wordLength] = []
            }
            this.words[wordLength].push(word);
        }

        console.log(this.words);
        this.startCountdown();
    }


    startCountdown(){
        document.getElementById("counter").style.display = "flex";
        let i = 3;

        let countdown = setInterval(() => {
            document.getElementById("time").innerHTML = i-1;
            i--;
            console.log(i)
            if(i == 0){
                document.getElementById("counter").style.display = "none";
                this.startTyper();
                clearInterval(countdown);
            }
        }, 1000);

    }

    startTyper(){
        this.generateWords();
        this.upDateInfo();
        document.querySelector("#info").style.display = "flex";
        document.querySelector("#wordContainer").style.display = "flex";

        this.startTime = performance.now();
        
        this.keyListener = (e) => {
            this.shorteWord(e.key);
            console.log("keypress sees")
        }

        window.addEventListener("keypress", this.keyListener)
    }

    shorteWord(keypressed){
        if(this.word[0] === keypressed && this.word.length > 1 && this.typeWords.length > this.wordsTyped){
            this.word = this.word.slice(1);
            this.drawWord();
        } else if (this.word[0] === keypressed && this.word.length == 1 && this.wordsTyped < this.typeWords.length - 1){
            this.wordsTyped++;
            this.upDateInfo();
            this.selectWord();
        } else if(this.word[0] === keypressed && this.word.length == 1 && this.typeWords.length - 1 == this.wordsTyped){
            this.upDateInfo();
            this.endGame();
        } else if(this.word[0] != keypressed){
            document.getElementById("word").style.color = "red";
            setTimeout(() => {
                document.getElementById("word").style.color = "black";
            }, 100)
        }
    }

    endGame(){
        this.endTime = performance.now();
        this.score = ((this.endTime - this.startTime) / 1000).toFixed(2);
        document.getElementById("word").innerHTML = "Mäng läbi. Sinu aeg on: " + this.score + " sekundit.";
        window.removeEventListener("keypress", this.keyListener)
        this.saveResult();
    }

    async saveResult(){
        let result = {
            name: this.name,
            time: this.score
        }
        const dbRef = ref(db, 'results');
        push(dbRef, result);
    }

    generateWords(){
        for(let i=0; i<this.wordsInGame; i++){
            const len = this.startingWordLength + i;
            const randomIndex = Math.floor(Math.random() * this.words[len].length);
            this.typeWords[i] = this.words[len][randomIndex];
        }

        this.selectWord();
    }

    selectWord(){
        this.word = this.typeWords[this.wordsTyped];
        this.drawWord();

    }

    drawWord(){
        document.getElementById("word").innerHTML = this.word;
    }

    upDateInfo(){
        document.getElementById("wordcount").innerHTML = "Sõnu trükitud: " + this.wordsTyped + "/" + this.wordsInGame;
    }
}

let typer;

document.getElementById("login").addEventListener("click", () => {
    login().then(name => {
        typer = new Typer(name);
       
    });
});

/* --------------------
edetabel koguaeg, muidu klassi sees ei tööta nii nagu vaja
---------------*/
const dbRef = ref(db, 'results');

onValue(dbRef, (snapshot) =>{
    const resultDiv = document.getElementById("results");
    resultDiv.innerHTML = ""; 
    
    let firebaseResults = [];
    
    snapshot.forEach((childSnapshot) => {
        firebaseResults.push(childSnapshot.val());
    });
    
    firebaseResults.sort((a, b) => parseFloat(a.time) - parseFloat(b.time));
    firebaseResults = firebaseResults.slice(0, 20);
    for(let i = 0; i < firebaseResults.length; i++){
        const row = document.createElement("div");
        row.textContent = `${i+1}. ${firebaseResults[i].name} ${firebaseResults[i].time}`;
        resultDiv.appendChild(row);
    }
});


/*modali asjad*/

window.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("resultsMod");
    const openBut = document.getElementById("open");
    const closeBut = document.getElementById("close");

    if (openBut && modal && closeBut){
        openBut.addEventListener('click', () => {
            modal.style.display = "block";
            console.log("Modal avatud");
        });

        closeBut.addEventListener('click', () =>{
            modal.style.display = "none";
        });

        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });
    }
});