import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCyxbdclt2ocA5zgE-MDy1ndYIFqVMAr30",
  authDomain: "yourtube-8cda9.firebaseapp.com",
  projectId: "yourtube-8cda9",
  storageBucket: "yourtube-8cda9.firebasestorage.app",
  messagingSenderId: "921641878423",
  appId: "1:921641878423:web:0d65801eebaf2b25f03ad2",
};

let app = null;
let auth = null;
let provider = null;

if (typeof window !== "undefined") {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
}

export { auth, provider };
