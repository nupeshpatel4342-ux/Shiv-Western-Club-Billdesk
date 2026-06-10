import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import fs from "fs";

// Load Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testWrite() {
  console.log("Attempting anonymous login...");
  try {
    const userCred = await signInAnonymously(auth);
    console.log("Logged in anonymously with UID:", userCred.user.uid);
    
    const testDocRef = doc(db, "bills", "test_diagnostic_id");
    console.log("Attempting write to 'bills/test_diagnostic_id'...");
    
    await setDoc(testDocRef, {
      id: "test_diagnostic_id",
      date: "10-Jun-2026",
      time: "10:00 PM",
      timestamp: Date.now(),
      customer: "Diagnostic Test",
      customerObj: { name: "Diagnostic Test", phone: "9999999999" },
      items: [],
      total: 0,
      paymentStatus: "PAID",
      paymentMethod: "CASH"
    });
    
    console.log("Write successful! Reading back document...");
    const snap = await getDoc(testDocRef);
    if (snap.exists()) {
      console.log("Read successful! Document content:", snap.data());
      
      console.log("Cleaning up test document...");
      await deleteDoc(testDocRef);
      console.log("Cleanup successful!");
    } else {
      console.log("Read failed: Document does not exist.");
    }
  } catch (err) {
    console.error("Firestore Diagnostic Error:", err);
  }
}

testWrite();
