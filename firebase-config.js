// ==================== FIREBASE CONFIGURATION ====================
const firebaseConfig = {
    apiKey: "AIzaSyBC9hwiWQS0rPMyvj3XVPdpExB1RSyQi1E",
    authDomain: "myblogapp-8e9e5cc8.firebaseapp.com",
    databaseURL: "https://myblogapp-8e9e5cc8-default-rtdb.firebaseio.com/",
    projectId: "myblogapp-8e9e5cc8",
    storageBucket: "myblogapp-8e9e5cc8.firebasestorage.app",
    messagingSenderId: "995232144893",
    appId: "1:995232144893:web:9ca49253831a0e06404d94"
};

// ==================== GLOBAL VARIABLES ====================
let CURR_USER = null;
let DB_DATA = null;
let ACTIVE_EXAM = null;
let TIMER_INT = null;
let EDITING_EXAM_ID = null;
const IMGBB_KEY = 'a6b5ca76210be29fd294f56e3681660f';

// ==================== FIREBASE INITIALIZATION ====================
let db;
try {
    console.log("🚀 Initializing Firebase...");
    
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized successfully");
    } else {
        console.log("ℹ️ Firebase already initialized");
    }
    
    db = firebase.database();
    console.log("📊 Database reference obtained");
    
    // Test database connection
    db.ref('.info/connected').on('value', (snap) => {
        if (snap.val() === true) {
            console.log("🌐 Firebase Realtime Database connected");
        } else {
            console.log("❌ Firebase Realtime Database disconnected");
        }
    });
    
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    alert("Firebase initialization failed. Please check console.");
}
