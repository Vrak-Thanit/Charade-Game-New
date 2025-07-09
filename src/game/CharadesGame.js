import React, { useState, useEffect, useCallback, useRef } from 'react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off, connectionsRef, serverTimestamp } from 'firebase/database';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCmuokCKFdI8lgpLYmeXznPqW06XOm0Sw",
  authDomain: "charade-game-7c565.firebaseapp.com",
  projectId: "charade-game-7c565",
  databaseURL: "https://charade-game-7c565-default-rtdb.asia-southeast1.firebasedatabase.app/",
  storageBucket: "charade-game-7c565.firebasestorage.app",
  messagingSenderId: "314859166334",
  appId: "1:314859166334:web:bf67f5b41b3e785e8ed62f"
};

// Initialize Firebase
let app;
let database;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);
}

const GAME_ID = "charades-classroom-2025";

const teams = ["Team 1", "Team 2", "Team 3", "Team 4", "Team 5", "Team 6"];

const sampleStudents = {
    
    "Team 1": ["CHEA SOVANDET", "VONG KORMVA", "KHOV CHHUNHENG", "LY SONGEI", "PATH MINEA", "LUT LYNA", "HIN SOMPHORS", "KHANN KANHCHANA"],
    "Team 2": ["HUORT LIENGHAM", "CHAO KIMLENG", "CHHAY DAVIN", "CHHOM TITSELA", "BO VIBOL", "SOR SATHYA", "MAN TOLFARY"],
    "Team 3": ["CHANTHOL VIREAKRATANAK", "THAI RATANAK", "SOEURT BOMNORNG", "AN PHYREAK", "LY SOCHEAT", "NONG SCHETRA"],
    "Team 4": ["PRING SOVANNVATEY", "PICH SREYPIN", "PHEAP KOEMLAY", "YORT KONGHOU", "PHUN SOMANATH", "YORN KANIKA", "TIV SOKCHEA"],
    "Team 5": ["PRUM SOKHENG", "PHANN MONIKA", "CHIT CHIMY", "KONG BUNHONG", "SUM BOREY", "HEANG MINEA", "NHEM SOVISAL"],
    "Team 6": ["SITHON SAMRACH", "THOUEN VANLY", "SEAN NARIN", "EN SOKHIM", "YORN NONA", "HEAN SITHA"]

};

const easyWords = [
    "website", "internet", "download", "upload", "email", "message", "picture", "video",
    "music", "file", "folder", "search", "click", "scroll", "menu", "button",
    "password", "username", "login", "logout", "save", "delete", "copy", "paste",
    "window", "browser", "refresh", "loading", "error", "warning", "notification", "update",
    "install", "uninstall", "zoom", "camera", "microphone", "speaker", "volume", "mute",
    "wifi", "bluetooth", "charging", "battery", "screen", "keyboard", "mouse", "headphones",
    "calendar", "reminder", "alarm", "timer", "calculator", "weather", "map", "location",
    "shopping", "pay", "delivery", "order", "review", "rating", "feedback", "comment",
    "friend", "family", "photo", "selfie", "filter", "hashtag", "like", "share",
    "cooking", "recipe", "ingredient", "kitchen", "restaurant", "menu", "waiter", "tip",
    "exercise", "run", "walk", "swimm", "dance", "yoga", "gym",
    "read", "write", "draw", "paint", "sing", "play", "learn", "study",
    "travel", "vacation", "hotel", "airplane", "train", "bus", "taxi", "ticket",
    "shopping", "clothes", "shoes", "jewelry", "makeup", "haircut", "fashion", "style",
    "weather", "sunny", "cloudy", "rainy", "windy", "hot", "cold", "temperature", "season"
];

const difficultWords = [
    "algorithm", "database", "server", "firewall", "encryption", "debugging", "programming", "software",
    "hardware", "network", "protocol", "bandwidth", "latency", "interface", "framework", "library",
    "version", "backup", "synchronize", "authentication", "authorization", "compression", "decompression",
    "virtualization", "cloud", "artificial", "intelligence", "machine", "learning", "blockchain", "cryptocurrency",
    "cybersecurity", "phishing", "malware", "antivirus", "spam", "firewall", "proxy", "vpn",
    "sustainability", "environment", "renewable", "pollution", "climate", "carbon", "footprint", "recycling",
    "democracy", "politics", "government", "election", "vote", "citizen", "rights", "freedom",
    "economy", "inflation", "recession", "investment", "stock", "market", "profit", "loss",
    "psychology", "emotion", "behavior", "personality", "motivation", "stress", "anxiety", "depression",
    "philosophy", "ethics", "morality", "justice", "truth", "wisdom", "knowledge", "belief",
    "science", "research", "experiment", "hypothesis", "theory", "evidence", "analysis", "conclusion",
    "mathematics", "geometry", "algebra", "statistics", "probability", "equation", "formula", "calculation",
    "biology", "evolution", "ecosystem", "biodiversity", "conservation", "extinction",
    "physics", "gravity", "energy", "momentum", "radiation", "magnetic", "electric", "quantum",
    "chemistry", "molecule", "atom", "reaction", "catalyst", "solution", "mixture", "compound",
    "medicine", "diagnosis", "treatment", "surgery", "therapy", "rehabilitation", "prevention", "vaccination"
];

function CharadesGame() {
    // Connection state
    const [userRole, setUserRole] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
    const [connectionError, setConnectionError] = useState(null);
    
    // Game State
    const [scores, setScores] = useState(Array(teams.length).fill(0));
    const [roundScores, setRoundScores] = useState([]);
    const [currentWord, setCurrentWord] = useState("");
    const [currentWordDifficulty, setCurrentWordDifficulty] = useState("easy");
    const [wordDisplayMode, setWordDisplayMode] = useState("hidden");
    const [revealedToTeams, setRevealedToTeams] = useState(new Set());
    const [timeLeft, setTimeLeft] = useState(120);
    const [round, setRound] = useState(1);
    const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
    const [usedHelpers, setUsedHelpers] = useState([]);
    const [usedWords, setUsedWords] = useState(new Set());
    const [guesserIndices, setGuesserIndices] = useState({
        "Team 1": 0, "Team 2": 0, "Team 3": 0, "Team 4": 0, "Team 5": 0, "Team 6": 0
    });

    // Stealing System
    const [stealingActive, setStealingActive] = useState(false);
    const [stealingTeam, setStealingTeam] = useState(null);
    const [failedStealTeams, setFailedStealTeams] = useState(new Set());
    const [availableStealTeams, setAvailableStealTeams] = useState(new Set());

    // Refs for cleanup and sync management
    const gameListenerRef = useRef(null);
    const connectionListenerRef = useRef(null);
    const syncTimeoutRef = useRef(null);
    const lastSyncDataRef = useRef(null);

    // Special sync function for team steal attempts - uses separate path to avoid conflicts
    const syncStealAttempt = useCallback(async (teamName) => {
        if (!database || connectionStatus !== 'connected') {
            console.log("🚫 Cannot sync steal: no database or not connected");
            return;
        }
        
        if (userRole === "gamemaster") {
            console.log("🚫 Game master doesn't need to sync steal attempts");
            return;
        }
        
        try {
            console.log("🏃 Team member syncing steal attempt:", teamName);
            console.log("📡 Firebase connection status:", connectionStatus);
            
            // Use a separate path for steal requests to avoid conflicts with Game Master
            const stealRequestRef = ref(database, `games/${GAME_ID}/stealRequest`);
            const stealData = {
                team: teamName,
                timestamp: Date.now(),
                requestId: `${teamName}-${Date.now()}`
            };
            
            await set(stealRequestRef, stealData);
            console.log("✅ Steal request synced to Firebase successfully");
            
        } catch (error) {
            console.error("❌ Steal sync error:", error);
            console.error("❌ Error details:", {
                code: error.code,
                message: error.message,
                details: error.details
            });
            // Don't throw, just log the error
        }
    }, [userRole, connectionStatus]);

    // Clear clicking state when stealing team changes
    useEffect(() => {
        if (stealingTeam) {
            setClickingSteal(null);
        }
    }, [stealingTeam]);

    // Timer effect
    useEffect(() => {
        let timer;
        if (timeLeft > 0 && userRole === "gamemaster") {
            timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [timeLeft, userRole]);

    // Memoized sync function to prevent unnecessary re-renders
    const syncToFirebase = useCallback(async () => {
        if (userRole !== "gamemaster" || !database || connectionStatus !== 'connected') {
            console.log("🚫 Sync skipped:", { userRole, database: !!database, connectionStatus });
            return;
        }
        
        try {
            const gameData = {
                scores,
                roundScores,
                currentWord,
                currentWordDifficulty,
                wordDisplayMode,
                revealedToTeams: Array.from(revealedToTeams),
                timeLeft,
                round,
                currentTeamIndex,
                usedHelpers,
                usedWords: Array.from(usedWords),
                guesserIndices,
                stealingActive,
                stealingTeam,
                failedStealTeams: Array.from(failedStealTeams),
                availableStealTeams: Array.from(availableStealTeams),
                lastUpdated: serverTimestamp(),
                gamemaster: userRole
            };

            // Check if data has actually changed to avoid unnecessary syncs
            const dataString = JSON.stringify(gameData);
            if (lastSyncDataRef.current === dataString) {
                console.log("📊 Data unchanged, skipping sync");
                return;
            }

            const gameRef = ref(database, `games/${GAME_ID}`);
            await set(gameRef, gameData);
            lastSyncDataRef.current = dataString;
            console.log("✅ Successfully synced to Firebase");
            
        } catch (error) {
            console.error("❌ Firebase sync error:", error);
            setConnectionError(`Sync failed: ${error.message}`);
        }
    }, [
        userRole, connectionStatus, scores, roundScores, currentWord, currentWordDifficulty,
        wordDisplayMode, revealedToTeams, timeLeft, round, currentTeamIndex, usedHelpers,
        usedWords, guesserIndices, stealingActive, stealingTeam, failedStealTeams, availableStealTeams
    ]);

    // Debounced sync effect - be more careful about when to sync
    useEffect(() => {
        if (userRole === "gamemaster" && connectionStatus === 'connected') {
            // Clear previous timeout
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
            
            // Set new timeout for debounced sync
            syncTimeoutRef.current = setTimeout(() => {
                syncToFirebase();
            }, 300); // Increased debounce to 300ms to reduce conflicts
        }

        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, [syncToFirebase, userRole, connectionStatus]);

    // Separate effect for team members - they don't auto-sync, only on specific actions
    useEffect(() => {
        // Team members don't auto-sync game state, they only sync steal requests
        if (userRole !== "gamemaster") {
            console.log("👥 Team member connected, listening for updates from Game Master");
        }
    }, [userRole]);

    // Firebase connection and data listener effect
    useEffect(() => {
        if (!isLoggedIn || !database) {
            return;
        }

        console.log("🔗 Setting up Firebase connection for", userRole);
        setConnectionStatus('connecting');
        setConnectionError(null);

        const gameRef = ref(database, `games/${GAME_ID}`);
        
        // Set up connection state listener
        const connectedRef = ref(database, '.info/connected');
        connectionListenerRef.current = onValue(connectedRef, (snapshot) => {
            const connected = snapshot.val();
            if (connected) {
                console.log("🟢 Firebase connected");
                setConnectionStatus('connected');
                setConnectionError(null);
            } else {
                console.log("🔴 Firebase disconnected");
                setConnectionStatus('disconnected');
                setConnectionError("Lost connection to Firebase");
            }
        });

        // Set up game data listener
        gameListenerRef.current = onValue(gameRef, (snapshot) => {
            console.log("📡 Firebase data update received");
            const data = snapshot.val();
            
            if (data && userRole !== "gamemaster") {
                // Update state from Firebase for team members
                console.log("📊 Updating state from Firebase data");
                setScores(data.scores || Array(teams.length).fill(0));
                setRoundScores(data.roundScores || []);
                setCurrentWord(data.currentWord || "");
                setCurrentWordDifficulty(data.currentWordDifficulty || "easy");
                setWordDisplayMode(data.wordDisplayMode || "hidden");
                setRevealedToTeams(new Set(data.revealedToTeams || []));
                setTimeLeft(data.timeLeft || 120);
                setRound(data.round || 1);
                setCurrentTeamIndex(data.currentTeamIndex || 0);
                setUsedHelpers(data.usedHelpers || []);
                setUsedWords(new Set(data.usedWords || []));
                setGuesserIndices(data.guesserIndices || {
                    "Team 1": 0, "Team 2": 0, "Team 3": 0, "Team 4": 0, "Team 5": 0, "Team 6": 0
                });
                setStealingActive(data.stealingActive || false);
                setStealingTeam(data.stealingTeam || null);
                setFailedStealTeams(new Set(data.failedStealTeams || []));
                setAvailableStealTeams(new Set(data.availableStealTeams || []));
            } else if (userRole === "gamemaster") {
                console.log("🎮 Game Master connected - ready to sync data");
                // If no data exists, initialize with current state
                if (!data) {
                    console.log("🆕 No existing game data, will initialize");
                    syncToFirebase();
                }
                
                // Check for steal requests from teams
                if (data && data.stealRequest) {
                    const stealRequest = data.stealRequest;
                    console.log("🏃 Steal request detected:", stealRequest);
                    
                    // Only process if this is a new request and stealing is active
                    if (stealingActive && !stealingTeam && availableStealTeams.has(stealRequest.team)) {
                        console.log("✅ Processing steal request from", stealRequest.team);
                        setStealingTeam(stealRequest.team);
                        
                        // Clear the steal request after processing
                        const stealRequestRef = ref(database, `games/${GAME_ID}/stealRequest`);
                        set(stealRequestRef, null);
                    }
                }
            }
        }, (error) => {
            console.error("❌ Firebase listener error:", error);
            setConnectionStatus('error');
            setConnectionError(`Connection error: ${error.message}`);
        });

        // Cleanup function
        return () => {
            console.log("🧹 Cleaning up Firebase listeners");
            if (gameListenerRef.current) {
                off(gameRef, 'value', gameListenerRef.current);
                gameListenerRef.current = null;
            }
            if (connectionListenerRef.current) {
                off(connectedRef, 'value', connectionListenerRef.current);
                connectionListenerRef.current = null;
            }
        };
    }, [isLoggedIn, userRole, syncToFirebase]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, []);

    const logout = () => {
        setUserRole(null);
        setIsLoggedIn(false);
        setConnectionStatus('disconnected');
        setConnectionError(null);
    };

    // Connection retry function
    const retryConnection = () => {
        if (isLoggedIn && userRole) {
            console.log("🔄 Retrying Firebase connection");
            setConnectionStatus('connecting');
            setConnectionError(null);
            // The useEffect will handle reconnection
        }
    };

    // ALL GAME FUNCTIONS - Same as your HTML file but with better error handling
    const activateStealingMode = () => {
        if (userRole !== "gamemaster") return;
        
        console.log("🎮 Activating stealing mode");
        
        const eligibleTeams = new Set();
        teams.forEach((team, index) => {
            if (index !== currentTeamIndex) {
                eligibleTeams.add(team);
            }
        });
        
        setStealingActive(true);
        setAvailableStealTeams(eligibleTeams);
        setStealingTeam(null);
        setFailedStealTeams(new Set());
        
        console.log("✅ Stealing activated for teams:", Array.from(eligibleTeams));
    };

    // Button click state for feedback (team-specific)
    const [clickingSteal, setClickingSteal] = useState(null); // stores team name that's clicking

    const attemptSteal = async (teamName) => {
        console.log("🏃 Steal attempt:", teamName);
        
        // Prevent multiple clicks from same team
        if (clickingSteal === teamName) {
            console.log("🚫 Already processing steal attempt for", teamName);
            return;
        }
        
        setClickingSteal(teamName);
        
        try {
            // Basic validation checks
            if (userRole !== teamName) {
                console.log("❌ User not authorized");
                return;
            }
            
            if (!stealingActive || stealingTeam || failedStealTeams.has(teamName) || !availableStealTeams.has(teamName)) {
                console.log("❌ Conditions not met", {
                    stealingActive,
                    stealingTeam,
                    failedStealTeams: Array.from(failedStealTeams),
                    availableStealTeams: Array.from(availableStealTeams)
                });
                return;
            }
            
            console.log("✅ Processing steal attempt for:", teamName);
            
            if (userRole === "gamemaster") {
                // Game Master can directly set the stealing team
                setStealingTeam(teamName);
            } else {
                // Team members send a steal request and show optimistic UI
                setStealingTeam(teamName); // Optimistic update for immediate feedback
                await syncStealAttempt(teamName); // Send request to Game Master
            }
        } finally {
            setClickingSteal(null);
        }
    };

    const handleStealResult = (success) => {
        if (userRole !== "gamemaster" || !stealingTeam) return;
        
        if (success) {
            const teamIndex = teams.indexOf(stealingTeam);
            addPoints(teamIndex, getCorrectPoints(), true);
        } else {
            setFailedStealTeams(prev => new Set([...prev, stealingTeam]));
            setStealingTeam(null);
            
            const remainingTeams = Array.from(availableStealTeams).filter(team => 
                !failedStealTeams.has(team) && team !== stealingTeam
            );
            if (remainingTeams.length === 0) {
                resetStealingState();
                nextTeam();
            }
        }
    };

    const resetStealingState = () => {
        setStealingActive(false);
        setStealingTeam(null);
        setFailedStealTeams(new Set());
        setAvailableStealTeams(new Set());
    };

    const getCurrentGuesser = (teamName) => {
        const teamMembers = sampleStudents[teamName];
        const currentIndex = guesserIndices[teamName];
        return teamMembers[currentIndex];
    };

    const getCurrentExplainers = (teamName) => {
        const teamMembers = sampleStudents[teamName];
        const currentIndex = guesserIndices[teamName];
        return teamMembers.filter((_, index) => index !== currentIndex);
    };

    const rotateGuesser = (teamName) => {
        setGuesserIndices(prev => ({
            ...prev,
            [teamName]: (prev[teamName] + 1) % sampleStudents[teamName].length
        }));
    };

    const manualRotateGuesser = (teamName, direction = 1) => {
        if (userRole !== "gamemaster") return;
        setGuesserIndices(prev => {
            const teamLength = sampleStudents[teamName].length;
            const newIndex = direction > 0 
                ? (prev[teamName] + 1) % teamLength
                : (prev[teamName] - 1 + teamLength) % teamLength;
            return {
                ...prev,
                [teamName]: newIndex
            };
        });
    };

    const getAvailableWords = (difficulty) => {
        const wordList = difficulty === "easy" ? easyWords : difficultWords;
        return wordList.filter(word => !usedWords.has(word.toLowerCase()));
    };

    const startTurn = (difficulty = "easy") => {
        if (userRole !== "gamemaster") return;
        const availableWords = getAvailableWords(difficulty);
        if (availableWords.length === 0) {
            alert(`No more ${difficulty} words available! Please reset the game or use the other difficulty.`);
            return;
        }
        
        const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        setCurrentWord(randomWord);
        setCurrentWordDifficulty(difficulty);
        setWordDisplayMode("hidden");
        setRevealedToTeams(new Set());
        setTimeLeft(120);
        setUsedHelpers([]);
    };

    const changeWord = () => {
        if (userRole !== "gamemaster" || !currentWord) return;
        
        const newScores = [...scores];
        newScores[currentTeamIndex] -= 0.5;
        setScores(newScores);
        
        startTurn(currentWordDifficulty);
    };

    const markWordAsUsed = (word) => {
        setUsedWords(prev => new Set([...prev, word.toLowerCase()]));
    };

    const resetWholeGame = () => {
        if (userRole !== "gamemaster") return;
        setScores(Array(teams.length).fill(0));
        setRoundScores([]);
        setCurrentWord("");
        setCurrentWordDifficulty("easy");
        setWordDisplayMode("hidden");
        setRevealedToTeams(new Set());
        setTimeLeft(120);
        setRound(1);
        setCurrentTeamIndex(0);
        setUsedHelpers([]);
        setUsedWords(new Set());
        setGuesserIndices({
            "Team 1": 0, "Team 2": 0, "Team 3": 0, "Team 4": 0, "Team 5": 0, "Team 6": 0
        });
        resetStealingState();
    };

    const nextTeam = () => {
        if (userRole !== "gamemaster") return;
        
        if (currentWord) {
            markWordAsUsed(currentWord);
        }
        
        resetStealingState();
        rotateGuesser(teams[currentTeamIndex]);
        
        setCurrentTeamIndex((prev) => (prev + 1) % teams.length);
        setCurrentWord("");
        setRevealedToTeams(new Set());
        setTimeLeft(120);
        setUsedHelpers([]);
        setWordDisplayMode("hidden");
        
        if ((currentTeamIndex + 1) % teams.length === 0) {
            const roundData = {
                round: round,
                scores: [...scores],
                teamScores: teams.map((team, index) => ({
                    team,
                    score: scores[index]
                }))
            };
            setRoundScores(prev => [...prev, roundData]);
            setRound((r) => r + 1);
        }
    };

    const revealWordToTeam = (teamName) => {
        if (userRole !== "gamemaster") return;
        setRevealedToTeams(prev => new Set([...prev, teamName]));
    };

    const hideWordFromTeam = (teamName) => {
        if (userRole !== "gamemaster") return;
        setRevealedToTeams(prev => {
            const newSet = new Set(prev);
            newSet.delete(teamName);
            return newSet;
        });
    };

    const showFullWord = () => {
        if (userRole !== "gamemaster") return;
        setWordDisplayMode("full");
    };

    const hideWord = () => {
        if (userRole !== "gamemaster") return;
        setWordDisplayMode("hidden");
    };

    const addPoints = (teamIdx, points, isSteal = false) => {
        if (userRole !== "gamemaster") return;
        const newScores = [...scores];
        newScores[teamIdx] += points;
        setScores(newScores);
        
        if (!isSteal && teamIdx === currentTeamIndex) {
            nextTeam();
        } else if (isSteal) {
            resetStealingState();
            nextTeam();
        }
    };

    const getCorrectPoints = () => {
        return currentWordDifficulty === "easy" ? 3 : 5;
    };

    const applyHelper = (type) => {
        if (userRole !== "gamemaster" || usedHelpers.includes(type)) return;
        setUsedHelpers([...usedHelpers, type]);
        
        if (type === 'initial') {
            if (usedHelpers.includes('ending')) {
                setWordDisplayMode("both");
            } else {
                setWordDisplayMode("initial");
            }
        } else if (type === 'ending') {
            if (usedHelpers.includes('initial')) {
                setWordDisplayMode("both");
            } else {
                setWordDisplayMode("ending");
            }
        }
        
        const newScores = [...scores];
        if (type === 'initial' || type === 'ending') {
            newScores[currentTeamIndex] -= 0.5;
        } else if (type === 'gesture') {
            newScores[currentTeamIndex] -= 1;
        }
        setScores(newScores);
    };

    const resetRound = () => {
        if (userRole !== "gamemaster") return;
        setCurrentWord("");
        setWordDisplayMode("hidden");
        setRevealedToTeams(new Set());
        setTimeLeft(120);
        setUsedHelpers([]);
        resetStealingState();
    };

    const handleViolation = () => {
        if (userRole !== "gamemaster") return;
        const newScores = [...scores];
        newScores[currentTeamIndex] -= 1;
        setScores(newScores);
        nextTeam();
    };

    const displayWord = () => {
        if (!currentWord) return "";
        
        if (userRole !== "gamemaster" && revealedToTeams.has(userRole)) {
            return currentWord;
        }
        
        if (userRole !== "gamemaster" && !revealedToTeams.has(userRole) && wordDisplayMode !== "full") {
            return "_ ".repeat(currentWord.length).trim();
        }
        
        switch (wordDisplayMode) {
            case "full":
                return currentWord;
            case "initial":
                return currentWord[0] + " " + "_ ".repeat(currentWord.length - 1).trim();
            case "ending":
                return "_ ".repeat(currentWord.length - 1).trim() + " " + currentWord[currentWord.length - 1];
            case "both":
                if (currentWord.length === 1) return currentWord[0];
                return currentWord[0] + " " + "_ ".repeat(Math.max(0, currentWord.length - 2)).trim() + " " + currentWord[currentWord.length - 1];
            case "hidden":
            default:
                return "_ ".repeat(currentWord.length).trim();
        }
    };

    const downloadExcel = () => {
        if (userRole !== "gamemaster") return;
        
        import('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')
            .then(() => {
                const workbook = window.XLSX.utils.book_new();
                
                const summaryData = [
                    ['Team', 'Current Score'],
                    ...teams.map((team, index) => [team, scores[index]])
                ];
                
                const summarySheet = window.XLSX.utils.aoa_to_sheet(summaryData);
                window.XLSX.utils.book_append_sheet(workbook, summarySheet, 'Current Scores');
                
                if (roundScores.length > 0) {
                    const roundData = [
                        ['Round', ...teams],
                        ...roundScores.map(roundInfo => [
                            `Round ${roundInfo.round}`,
                            ...teams.map((team, index) => roundInfo.scores[index])
                        ])
                    ];
                    
                    const roundSheet = window.XLSX.utils.aoa_to_sheet(roundData);
                    window.XLSX.utils.book_append_sheet(workbook, roundSheet, 'Round History');
                }
                
                const usedWordsData = [
                    ['Used Words'],
                    ...Array.from(usedWords).map(word => [word])
                ];
                
                const usedWordsSheet = window.XLSX.utils.aoa_to_sheet(usedWordsData);
                window.XLSX.utils.book_append_sheet(workbook, usedWordsSheet, 'Used Words');
                
                window.XLSX.writeFile(workbook, `Charades_Game_Scores_Round_${round}.xlsx`);
            })
            .catch(() => {
                alert('Error loading Excel library. Please try again.');
            });
    };

    const getWordStats = () => {
        const easyAvailable = getAvailableWords("easy").length;
        const difficultAvailable = getAvailableWords("difficult").length;
        return { easyAvailable, difficultAvailable };
    };

    // Connection status indicator
    const getConnectionStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return '#10b981';
            case 'connecting': return '#f59e0b';
            case 'error': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getConnectionStatusText = () => {
        switch (connectionStatus) {
            case 'connected': return 'Connected';
            case 'connecting': return 'Connecting...';
            case 'error': return 'Connection Error';
            default: return 'Disconnected';
        }
    };

    // Password protection
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState("");

    // Passwords - you can change these
    const PASSWORDS = {
        gamemaster: "teacher123",
        "Team 1": "A9t3",
        "Team 2": "M7b2", 
        "Team 3": "x4K9",
        "Team 4": "T6r8",
        "Team 5": "j1Q5",
        "Team 6": "D3n7"
    };

    const handleRoleSelection = (role) => {
        setSelectedRole(role);
        setShowPasswordPrompt(true);
        setPasswordInput("");
        setPasswordError("");
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        const correctPassword = PASSWORDS[selectedRole];
        
        if (passwordInput === correctPassword) {
            setUserRole(selectedRole);
            setIsLoggedIn(true);
            setShowPasswordPrompt(false);
            setPasswordInput("");
            setPasswordError("");
        } else {
            setPasswordError("Incorrect password. Please try again.");
            setPasswordInput("");
        }
    };

    const cancelPasswordPrompt = () => {
        setShowPasswordPrompt(false);
        setSelectedRole(null);
        setPasswordInput("");
        setPasswordError("");
    };

    // Login Screen Component with Password Protection
    const LoginScreen = () => {
        if (showPasswordPrompt) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f3f4f6'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '0.5rem',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        width: '100%',
                        maxWidth: '28rem'
                    }}>
                        <div style={{ padding: '1.5rem' }}>
                            <h1 style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                textAlign: 'center',
                                marginBottom: '1rem'
                            }}>
                                {selectedRole === "gamemaster" ? "🎮 Game Master" : `👥 ${selectedRole}`} Login
                            </h1>
                            <p style={{
                                fontSize: '0.875rem',
                                color: '#4b5563',
                                textAlign: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                Enter the password to continue
                            </p>
                            
                            {passwordError && (
                                <div style={{
                                    backgroundColor: '#fee2e2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '0.375rem',
                                    padding: '0.5rem',
                                    marginBottom: '1rem',
                                    color: '#991b1b',
                                    fontSize: '0.875rem',
                                    textAlign: 'center'
                                }}>
                                    {passwordError}
                                </div>
                            )}
                            
                            <form onSubmit={handlePasswordSubmit}>
                                <input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="Enter password"
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #d1d5db',
                                        fontSize: '1rem',
                                        marginBottom: '1rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        type="submit"
                                        disabled={!passwordInput.trim()}
                                        style={{
                                            flex: 1,
                                            fontWeight: '500',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '0.375rem',
                                            border: 'none',
                                            cursor: passwordInput.trim() ? 'pointer' : 'not-allowed',
                                            backgroundColor: passwordInput.trim() ? '#3b82f6' : '#9ca3af',
                                            color: 'white',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Login
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={cancelPasswordPrompt}
                                        style={{
                                            fontWeight: '500',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '0.375rem',
                                            border: '1px solid #d1d5db',
                                            cursor: 'pointer',
                                            backgroundColor: 'white',
                                            color: '#374151',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                            
                            <div style={{
                                marginTop: '1rem',
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                textAlign: 'center',
                                fontStyle: 'italic'
                            }}>
                                {selectedRole === "gamemaster" 
                                    ? "Ask your teacher for the Game Master password"
                                    : `Ask your teacher for the ${selectedRole} password`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    width: '100%',
                    maxWidth: '28rem'
                }}>
                    <div style={{ padding: '1.5rem' }}>
                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            textAlign: 'center',
                            marginBottom: '1.5rem'
                        }}>Charades Game Login</h1>
                        
                        {!database && (
                            <div style={{
                                backgroundColor: '#fee2e2',
                                border: '1px solid #fecaca',
                                borderRadius: '0.375rem',
                                padding: '0.5rem',
                                marginBottom: '1rem',
                                color: '#991b1b',
                                fontSize: '0.875rem',
                                textAlign: 'center'
                            }}>
                                ⚠️ Firebase initialization failed. Please check your configuration.
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button 
                                onClick={() => handleRoleSelection("gamemaster")}
                                disabled={!database}
                                style={{
                                    width: '100%',
                                    fontWeight: '500',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    cursor: database ? 'pointer' : 'not-allowed',
                                    backgroundColor: database ? '#9333ea' : '#9ca3af',
                                    color: 'white',
                                    transition: 'all 0.2s',
                                    opacity: database ? 1 : 0.5
                                }}
                            >
                                🎮 Game Master
                            </button>
                            
                            <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '0.75rem' }}>
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: '#4b5563',
                                    textAlign: 'center',
                                    marginBottom: '0.75rem'
                                }}>Team Players</p>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '0.5rem'
                                }}>
                                    {teams.map((team) => (
                                        <button 
                                            key={team}
                                            onClick={() => handleRoleSelection(team)}
                                            disabled={!database}
                                            style={{
                                                fontWeight: '500',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.875rem',
                                                cursor: database ? 'pointer' : 'not-allowed',
                                                backgroundColor: 'transparent',
                                                border: `1px solid ${database ? '#d1d5db' : '#9ca3af'}`,
                                                color: database ? '#374151' : '#9ca3af',
                                                transition: 'all 0.2s',
                                                opacity: database ? 1 : 0.5
                                            }}
                                        >
                                            {team}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div style={{
                            marginTop: '1rem',
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            textAlign: 'center',
                            fontStyle: 'italic'
                        }}>
                            🔒 Password protected - Ask your teacher for access
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!isLoggedIn) {
        return <LoginScreen />;
    }

    const { easyAvailable, difficultAvailable } = getWordStats();
    const isGameMaster = userRole === "gamemaster";

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1.5rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            backgroundColor: '#f8fafc',
            color: '#1e293b',
            minHeight: '100vh'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0' }}>Charades Game - Round {round}</h1>
                        <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0' }}>
                            Logged in as: <span style={{ fontWeight: '600' }}>{isGameMaster ? "Game Master" : userRole}</span>
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <div style={{
                                width: '0.5rem',
                                height: '0.5rem',
                                borderRadius: '50%',
                                backgroundColor: getConnectionStatusColor()
                            }}></div>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {getConnectionStatusText()}
                            </span>
                            {isGameMaster && <span style={{ fontSize: '0.75rem', color: '#059669' }}>• Game Master</span>}
                            {connectionStatus === 'error' && (
                                <button 
                                    onClick={retryConnection}
                                    style={{
                                        fontSize: '0.75rem',
                                        color: '#dc2626',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                        {connectionError && (
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#dc2626',
                                marginTop: '0.25rem',
                                backgroundColor: '#fee2e2',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                border: '1px solid #fecaca'
                            }}>
                                {connectionError}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isGameMaster && (
                            <>
                                <button 
                                    onClick={downloadExcel} 
                                    disabled={connectionStatus !== 'connected'}
                                    style={{
                                        backgroundColor: connectionStatus === 'connected' ? 'white' : '#f3f4f6',
                                        border: '1px solid #d1d5db',
                                        color: connectionStatus === 'connected' ? '#374151' : '#9ca3af',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        cursor: connectionStatus === 'connected' ? 'pointer' : 'not-allowed',
                                        margin: '0.25rem',
                                        opacity: connectionStatus === 'connected' ? 1 : 0.5
                                    }}
                                >
                                    📊 Download Excel
                                </button>
                                <button 
                                    onClick={resetWholeGame} 
                                    disabled={connectionStatus !== 'connected'}
                                    style={{
                                        backgroundColor: connectionStatus === 'connected' ? '#ef4444' : '#f87171',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: 'none',
                                        cursor: connectionStatus === 'connected' ? 'pointer' : 'not-allowed',
                                        margin: '0.25rem',
                                        opacity: connectionStatus === 'connected' ? 1 : 0.5
                                    }}
                                >
                                    🔄 Reset Game
                                </button>
                            </>
                        )}
                        <button onClick={logout} style={{
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            color: '#374151',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            margin: '0.25rem'
                        }}>
                            🚪 Logout
                        </button>
                    </div>
                </div>

                {/* Rest of your UI components remain the same */}
                <div style={{
                    background: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    padding: '1rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0' }}>Team Rotation Status</h2>
                        {isGameMaster && (
                            <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                                Words Available: Easy ({easyAvailable}) | Difficult ({difficultAvailable}) | Used ({usedWords.size})
                            </div>
                        )}
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                    }}>
                        {teams.map((team, i) => (
                            <div key={i} style={{
                                padding: '0.5rem',
                                borderRadius: '0.25rem',
                                backgroundColor: i === currentTeamIndex ? '#dbeafe' : '#f9fafb'
                            }}>
                                <p style={{ fontWeight: '600', margin: '0', fontSize: '0.875rem' }}>{team}</p>
                                <p style={{ fontSize: '0.75rem', margin: '0' }}>Guesser: {getCurrentGuesser(team)}</p>
                                <p style={{ fontSize: '0.75rem', margin: '0' }}>Turn: {guesserIndices[team] + 1}/{sampleStudents[team].length}</p>
                                {isGameMaster && connectionStatus === 'connected' && (
                                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                                        <button 
                                            onClick={() => manualRotateGuesser(team, -1)} 
                                            style={{
                                                backgroundColor: 'white',
                                                border: '1px solid #d1d5db',
                                                color: '#374151',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                cursor: 'pointer',
                                                height: '1.25rem'
                                            }}
                                        >
                                            ←
                                        </button>
                                        <button 
                                            onClick={() => manualRotateGuesser(team, 1)} 
                                            style={{
                                                backgroundColor: 'white',
                                                border: '1px solid #d1d5db',
                                                color: '#374151',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                cursor: 'pointer',
                                                height: '1.25rem'
                                            }}
                                        >
                                            →
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    padding: '1rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Rules:</h2>
                    <ul style={{ listStyleType: 'disc', marginLeft: '1.5rem', fontSize: '0.875rem' }}>
                        <li>No saying the word out loud.</li>
                        <li>Close variations with different parts of speech may be accepted.</li>
                        <li>No dictionary use until the last 1 minute.</li>
                        <li>Easy words = 3 points, Difficult words = 5 points.</li>
                        <li>Helpers automatically deduct points: Initial/Ending letters = -0.5 each, Gesture = -1.</li>
                        <li>Word changes = -0.5 points (changed words can reappear).</li>
                        <li>Violation = -1 point and skip the round.</li>
                        <li><strong>Stealing:</strong> When a team fails, other teams can attempt to steal by clicking first.</li>
                        <li><strong>Steal Rules:</strong> Only the first team to click gets to steal. Failed stealing teams are locked out.</li>
                        <li>Words are permanently removed after being played (not when changed).</li>
                    </ul>
                </div>

                <div style={{
                    background: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    padding: '1rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>{teams[currentTeamIndex]}'s Turn</h2>
                    <p style={{ fontSize: '1rem', margin: '0 0 0.5rem 0' }}>
                        Guesser: <strong>{getCurrentGuesser(teams[currentTeamIndex])}</strong> 
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            (Turn {guesserIndices[teams[currentTeamIndex]] + 1}/{sampleStudents[teams[currentTeamIndex]].length})
                        </span>
                    </p>
                    <p style={{ fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                        Explainers: {getCurrentExplainers(teams[currentTeamIndex]).join(", ")}
                    </p>
                    <p style={{ fontSize: '1.125rem', margin: '0 0 0.5rem 0' }}>Time Left: {timeLeft}s</p>
                    
                    {!isGameMaster && stealingActive && (
                        <div style={{
                            backgroundColor: '#fed7aa',
                            border: '1px solid #fdba74',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                            marginBottom: '0.5rem'
                        }}>
                            <p style={{
                                fontSize: '1rem',
                                fontWeight: '700',
                                color: '#9a3412',
                                margin: '0 0 0.5rem 0',
                                textAlign: 'center'
                            }}>
                                🏃 STEALING MODE ACTIVE!
                            </p>
                            <p style={{
                                fontSize: '0.875rem',
                                color: '#c2410c',
                                margin: '0',
                                textAlign: 'center'
                            }}>
                                {stealingTeam === userRole
                                    ? '🎯 Your steal attempt was received! Wait for teacher to decide...'
                                    : stealingTeam 
                                        ? `${stealingTeam} is attempting to steal the word...` 
                                        : availableStealTeams.has(userRole)
                                            ? '🎯 Your team can steal! Click the orange button in your team card below!'
                                            : 'Some teams can attempt to steal this word.'
                                }
                            </p>
                        </div>
                    )}

                    {currentWord && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem'
                            }}>
                                <span style={{
                                    padding: '0.5rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    backgroundColor: currentWordDifficulty === 'easy' ? '#bbf7d0' : '#fecaca',
                                    color: currentWordDifficulty === 'easy' ? '#166534' : '#991b1b'
                                }}>
                                    {currentWordDifficulty.toUpperCase()} ({currentWordDifficulty === 'easy' ? '3' : '5'} pts)
                                </span>
                                {!isGameMaster && revealedToTeams.has(userRole) && (
                                    <span style={{
                                        padding: '0.5rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        backgroundColor: '#fde68a',
                                        color: '#92400e'
                                    }}>
                                        WORD REVEALED TO YOUR TEAM
                                    </span>
                                )}
                            </div>
                            <p style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                textAlign: 'center',
                                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                                margin: '0 0 0.5rem 0'
                            }}>{displayWord()}</p>
                            {isGameMaster && connectionStatus === 'connected' && (
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem',
                                    justifyContent: 'center'
                                }}>
                                    <button onClick={showFullWord} style={{
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}>Reveal to All</button>
                                    <button onClick={hideWord} style={{
                                        backgroundColor: 'white',
                                        border: '1px solid #d1d5db',
                                        color: '#374151',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer'
                                    }}>Hide from All</button>
                                    <button onClick={changeWord} style={{
                                        backgroundColor: '#6b7280',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}>Change Word (-0.5)</button>
                                    <button onClick={resetRound} style={{
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}>Reset Round</button>
                                </div>
                            )}
                        </div>
                    )}
                    {!currentWord && isGameMaster && connectionStatus === 'connected' && (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button 
                                onClick={() => startTurn("easy")} 
                                disabled={easyAvailable === 0}
                                style={{
                                    backgroundColor: easyAvailable === 0 ? '#9ca3af' : '#059669',
                                    color: 'white',
                                    fontWeight: '500',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    cursor: easyAvailable === 0 ? 'not-allowed' : 'pointer',
                                    opacity: easyAvailable === 0 ? 0.5 : 1
                                }}
                            >
                                Start Easy Word (3 pts) - {easyAvailable} left
                            </button>
                            <button 
                                onClick={() => startTurn("difficult")} 
                                disabled={difficultAvailable === 0}
                                style={{
                                    backgroundColor: difficultAvailable === 0 ? '#9ca3af' : '#dc2626',
                                    color: 'white',
                                    fontWeight: '500',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    cursor: difficultAvailable === 0 ? 'not-allowed' : 'pointer',
                                    opacity: difficultAvailable === 0 ? 0.5 : 1
                                }}
                            >
                                Start Difficult Word (5 pts) - {difficultAvailable} left
                            </button>
                        </div>
                    )}
                    {connectionStatus !== 'connected' && (
                        <div style={{
                            backgroundColor: '#fef3c7',
                            border: '1px solid #fde68a',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                            textAlign: 'center',
                            color: '#92400e',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginTop: '0.5rem'
                        }}>
                            ⚠️ Game controls are disabled while disconnected from Firebase
                        </div>
                    )}
                </div>

                {/* Continue with the rest of your UI components with similar connection status checks... */}
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '0.5rem'
                }}>
                    {teams.map((team, i) => (
                        <div key={i} style={{
                            background: 'white',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                            padding: '1rem'
                        }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '500', margin: '0 0 0.25rem 0' }}>{team}</h3>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.75rem 0' }}>{scores[i]}</p>
                            
                            {isGameMaster && connectionStatus === 'connected' && (
                                <button 
                                    onClick={() => addPoints(i, currentWord ? getCorrectPoints() : 3)} 
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    +{currentWord ? getCorrectPoints() : 3} {i === currentTeamIndex ? 'Correct' : 'Steal'}
                                </button>
                            )}
                            
                            {/* Only show controls if this is the user's team or if user is game master */}
                            {userRole === team && !isGameMaster && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    {/* Show steal button ONLY if all conditions are met */}
                                    {stealingActive && 
                                     availableStealTeams.has(team) && 
                                     !failedStealTeams.has(team) && 
                                     !stealingTeam && 
                                     connectionStatus === 'connected' && (
                                        <button 
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                console.log("🔥 Steal button clicked for", team);
                                                console.log("Current state:", {
                                                    userRole,
                                                    team,
                                                    stealingActive,
                                                    availableStealTeams: Array.from(availableStealTeams),
                                                    stealingTeam,
                                                    connectionStatus
                                                });
                                                
                                                try {
                                                    await attemptSteal(team);
                                                    console.log("✅ Steal attempt completed");
                                                } catch (error) {
                                                    console.error("❌ Steal attempt failed:", error);
                                                }
                                            }}
                                            disabled={clickingSteal === team}
                                            style={{
                                                width: '100%',
                                                backgroundColor: clickingSteal === team ? '#9ca3af' : '#ea580c',
                                                color: 'white',
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                padding: '0.75rem',
                                                borderRadius: '0.375rem',
                                                border: 'none',
                                                cursor: clickingSteal === team ? 'wait' : 'pointer',
                                                opacity: clickingSteal === team ? 0.7 : 1,
                                                animation: clickingSteal === team ? 'none' : 'pulse 2s infinite'
                                            }}
                                        >
                                            {clickingSteal === team ? '⏳ STEALING...' : `🏃 STEAL +${getCorrectPoints()} POINTS!`}
                                        </button>
                                    )}
                                    
                                    {/* Status messages for the user's own team */}
                                    {stealingActive && stealingTeam === team && (
                                        <div style={{
                                            fontSize: '0.875rem',
                                            textAlign: 'center',
                                            backgroundColor: '#fef3c7',
                                            border: '2px solid #fde68a',
                                            color: '#92400e',
                                            padding: '0.75rem',
                                            borderRadius: '0.375rem',
                                            fontWeight: '600'
                                        }}>
                                            🎯 YOUR STEAL ATTEMPT RECEIVED! Wait for teacher decision...
                                        </div>
                                    )}
                                    
                                    {stealingActive && failedStealTeams.has(team) && (
                                        <div style={{
                                            fontSize: '0.875rem',
                                            textAlign: 'center',
                                            backgroundColor: '#fee2e2',
                                            border: '2px solid #fecaca',
                                            color: '#991b1b',
                                            padding: '0.75rem',
                                            borderRadius: '0.375rem',
                                            fontWeight: '600'
                                        }}>
                                            ❌ Your steal attempt failed
                                        </div>
                                    )}
                                    
                                    {stealingActive && !availableStealTeams.has(team) && (
                                        <div style={{
                                            fontSize: '0.875rem',
                                            textAlign: 'center',
                                            backgroundColor: '#f3f4f6',
                                            border: '1px solid #d1d5db',
                                            color: '#6b7280',
                                            padding: '0.75rem',
                                            borderRadius: '0.375rem'
                                        }}>
                                            {currentTeamIndex === i ? "🎯 Your Turn (Can't Steal Own Turn)" : "❌ Not Eligible to Steal"}
                                        </div>
                                    )}
                                    
                                    {stealingActive && stealingTeam && stealingTeam !== team && (
                                        <div style={{
                                            fontSize: '0.875rem',
                                            textAlign: 'center',
                                            backgroundColor: '#fef3c7',
                                            border: '1px solid #fde68a',
                                            color: '#92400e',
                                            padding: '0.75rem',
                                            borderRadius: '0.375rem'
                                        }}>
                                            ⏳ {stealingTeam} is attempting to steal...
                                        </div>
                                    )}
                                    
                                    {/* Show when stealing is not active */}
                                    {!stealingActive && (
                                        <div style={{
                                            fontSize: '0.875rem',
                                            textAlign: 'center',
                                            backgroundColor: '#dcfce7',
                                            border: '1px solid #bbf7d0',
                                            color: '#166534',
                                            padding: '0.75rem',
                                            borderRadius: '0.375rem',
                                            fontWeight: '500'
                                        }}>
                                            👥 Your Team
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Show status for other teams (when user is not on this team) */}
                            {userRole !== team && !isGameMaster && (
                                <div style={{
                                    fontSize: '0.75rem',
                                    textAlign: 'center',
                                    backgroundColor: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    color: '#6b7280',
                                    padding: '0.5rem',
                                    borderRadius: '0.25rem',
                                    marginTop: '0.5rem'
                                }}>
                                    {stealingActive && stealingTeam === team ? `⏳ ${team} stealing...` : 
                                     stealingActive && failedStealTeams.has(team) ? `❌ ${team} failed` :
                                     stealingActive && availableStealTeams.has(team) ? `✅ ${team} can steal` :
                                     team}
                                </div>
                            )}
                            
                            {connectionStatus !== 'connected' && !isGameMaster && (
                                <div style={{
                                    fontSize: '0.75rem',
                                    textAlign: 'center',
                                    backgroundColor: '#f3f4f6',
                                    border: '1px solid #d1d5db',
                                    color: '#6b7280',
                                    padding: '0.5rem',
                                    borderRadius: '0.25rem',
                                    marginTop: '0.5rem'
                                }}>
                                    Connecting...
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add remaining game master controls with connection status checks */}
                {isGameMaster && connectionStatus === 'connected' && (
                    <>
                        {currentWord && (
                            <>
                                <div style={{
                                    background: 'white',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                                    padding: '1rem'
                                }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Selective Word Reveal</h2>
                                    <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>Choose which teams can see the word:</p>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(6, 1fr)',
                                        gap: '0.5rem'
                                    }}>
                                        {teams.map((team) => (
                                            <div key={team} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>{team}</span>
                                                {revealedToTeams.has(team) ? (
                                                    <button 
                                                        onClick={() => hideWordFromTeam(team)} 
                                                        style={{
                                                            backgroundColor: '#ef4444',
                                                            color: 'white',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '500',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '0.25rem',
                                                            border: 'none',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Hide ❌
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => revealWordToTeam(team)} 
                                                        style={{
                                                            backgroundColor: '#3b82f6',
                                                            color: 'white',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '500',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '0.25rem',
                                                            border: 'none',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Reveal ✅
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{
                                    background: 'white',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                                    padding: '1rem'
                                }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Helpers</h2>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <button 
                                            onClick={() => applyHelper("initial")} 
                                            disabled={usedHelpers.includes("initial") || !currentWord}
                                            style={{
                                                fontWeight: '500',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '0.375rem',
                                                border: 'none',
                                                cursor: (usedHelpers.includes("initial") || !currentWord) ? 'not-allowed' : 'pointer',
                                                opacity: (usedHelpers.includes("initial") || !currentWord) ? 0.5 : 1,
                                                backgroundColor: usedHelpers.includes("initial") ? '#6b7280' : '#3b82f6',
                                                color: 'white'
                                            }}
                                        >
                                            Initial Letter (-0.5) {usedHelpers.includes("initial") ? "✓" : ""}
                                        </button>
                                        <button 
                                            onClick={() => applyHelper("ending")} 
                                            disabled={usedHelpers.includes("ending") || !currentWord}
                                            style={{
                                                fontWeight: '500',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '0.375rem',
                                                border: 'none',
                                                cursor: (usedHelpers.includes("ending") || !currentWord) ? 'not-allowed' : 'pointer',
                                                opacity: (usedHelpers.includes("ending") || !currentWord) ? 0.5 : 1,
                                                backgroundColor: usedHelpers.includes("ending") ? '#6b7280' : '#3b82f6',
                                                color: 'white'
                                            }}
                                        >
                                            Ending Letter (-0.5) {usedHelpers.includes("ending") ? "✓" : ""}
                                        </button>
                                        <button 
                                            onClick={() => applyHelper("gesture")} 
                                            disabled={usedHelpers.includes("gesture") || timeLeft < 30 || !currentWord}
                                            style={{
                                                fontWeight: '500',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '0.375rem',
                                                border: 'none',
                                                cursor: (usedHelpers.includes("gesture") || timeLeft < 30 || !currentWord) ? 'not-allowed' : 'pointer',
                                                opacity: (usedHelpers.includes("gesture") || timeLeft < 30 || !currentWord) ? 0.5 : 1,
                                                backgroundColor: usedHelpers.includes("gesture") ? '#6b7280' : '#3b82f6',
                                                color: 'white'
                                            }}
                                        >
                                            Gesture (-1) {usedHelpers.includes("gesture") ? "✓" : ""}
                                        </button>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'white',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                                    padding: '1rem'
                                }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Stealing Management</h2>
                                    
                                    {!stealingActive && (
                                        <button 
                                            onClick={activateStealingMode}
                                            style={{
                                                backgroundColor: '#ea580c',
                                                color: 'white',
                                                fontWeight: '500',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.375rem',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🏃 Activate Stealing Mode
                                        </button>
                                    )}
                                    
                                    {stealingActive && !stealingTeam && (
                                        <div>
                                            <p style={{
                                                fontSize: '0.875rem',
                                                color: '#4b5563',
                                                marginBottom: '0.5rem'
                                            }}>
                                                Waiting for teams to attempt steal...
                                            </p>
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '0.5rem',
                                                marginBottom: '0.75rem'
                                            }}>
                                                {Array.from(availableStealTeams).map(team => (
                                                    <span key={team} style={{
                                                        padding: '0.5rem',
                                                        fontSize: '0.75rem',
                                                        borderRadius: '9999px',
                                                        fontWeight: '500',
                                                        backgroundColor: failedStealTeams.has(team) ? '#fee2e2' : '#dcfce7',
                                                        color: failedStealTeams.has(team) ? '#991b1b' : '#166534',
                                                        border: failedStealTeams.has(team) ? '1px solid #fecaca' : '1px solid #bbf7d0'
                                                    }}>
                                                        {team} {failedStealTeams.has(team) ? '❌' : '✅'}
                                                    </span>
                                                ))}
                                            </div>
                                            <button 
                                                onClick={resetStealingState}
                                                style={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #d1d5db',
                                                    color: '#374151',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: '0.375rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Cancel Stealing
                                            </button>
                                        </div>
                                    )}
                                    
                                    {stealingTeam && (
                                        <div>
                                            <p style={{
                                                fontWeight: '600',
                                                fontSize: '1.125rem',
                                                marginBottom: '0.75rem'
                                            }}>
                                                {stealingTeam} is attempting to steal!
                                            </p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <button 
                                                    onClick={() => handleStealResult(true)}
                                                    style={{
                                                        backgroundColor: '#059669',
                                                        color: 'white',
                                                        fontWeight: '500',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '0.375rem',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    ✅ Successful Steal (+{getCorrectPoints()})
                                                </button>
                                                <button 
                                                    onClick={() => handleStealResult(false)}
                                                    style={{
                                                        backgroundColor: '#dc2626',
                                                        color: 'white',
                                                        fontWeight: '500',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '0.375rem',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    ❌ Failed Steal
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => addPoints(currentTeamIndex, getCorrectPoints())} 
                                        style={{
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                            fontWeight: '500',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '0.375rem',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Correct +{getCorrectPoints()}
                                    </button>
                                    <button 
                                        onClick={handleViolation} 
                                        style={{
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            fontWeight: '500',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '0.375rem',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Violation (-1 & Skip)
                                    </button>
                                    <button 
                                        onClick={nextTeam} 
                                        style={{
                                            backgroundColor: 'white',
                                            border: '1px solid #d1d5db',
                                            color: '#374151',
                                            fontWeight: '500',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Skip Turn
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default CharadesGame;