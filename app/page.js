"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, serverTimestamp, updateDoc, writeBatch, getDocs, deleteDoc, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { Calendar, DollarSign, Target, Book, PlusCircle, LogOut, TrendingUp, Settings, ChevronsUp, ChevronLeft, ChevronRight, Edit, Trash2, Download, Sun, Moon, RefreshCw, AlertTriangle, Map, User, Sparkles } from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig =  typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// --- App Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Helper to download CSV ---
const downloadCSV = (data, filename = 'export.csv') => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
        // Correct code
headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                let value = row[header];
                if (value === null || value === undefined) {
                    value = &apos;&apos;;
                }
                if (typeof value === &apos;string&apos; && value.includes(&apos;,&apos;)) {
                    return `&quot;${value.replace(/&quot;/g, &apos;&quot;&quot;&apos;)}&quot;`;
                }
                if (value instanceof Date) {
                    return value.toISOString();
                }
                 if (typeof value === &apos;object&apos; && value !== null && value.seconds) {
                    return new Date(value.seconds * 1000).toISOString();
                }
                return value;
            }).join(&apos;,&apos;)
        )
    ];
    const blob = new Blob([csvRows.join(&apos;\n&apos;)], { type: &apos;text/csv&apos; });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement(&apos;a&apos;);
    a.setAttribute(&apos;hidden&apos;, &apos;&apos;);
    a.setAttribute(&apos;href&apos;, url);
    a.setAttribute(&apos;download&apos;, filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// --- Theme Hook ---
function useTheme() {
    const [theme, setTheme] = useState(localStorage.getItem(&apos;theme&apos;) || &apos;auto&apos;);

    useEffect(() => {
        const root = window.document.documentElement;
        const systemIsDark = window.matchMedia(&apos;(prefers-color-scheme: dark)&apos;).matches;

        if (theme === &apos;dark&apos; || (theme === &apos;auto&apos; && systemIsDark)) {
            root.classList.add(&apos;dark&apos;);
        } else {
            root.classList.remove(&apos;dark&apos;);
        }
        localStorage.setItem(&apos;theme&apos;, theme);
        
        const systemThemeChange = (e) => {
            if (theme === &apos;auto&apos;) {
                if (e.matches) {
                    root.classList.add(&apos;dark&apos;);
                } else {
                    root.classList.remove(&apos;dark&apos;);
                }
            }
        };
        
        window.matchMedia(&apos;(prefers-color-scheme: dark)&apos;).addEventListener(&apos;change&apos;, systemThemeChange);
        
        return () => {
             window.matchMedia(&apos;(prefers-color-scheme: dark)&apos;).removeEventListener(&apos;change&apos;, systemThemeChange);
        }
    }, [theme]);
    
    return [theme, setTheme];
}

// --- Login Component ---
const LoginScreen = ({ showAlert }) => {
    const handleSignIn = async (providerName) => {
        let provider;
        if (providerName === &apos;google&apos;) {
            provider = new GoogleAuthProvider();
        } else if (providerName === &apos;yahoo&apos;) {
            provider = new OAuthProvider(&apos;yahoo.com&apos;);
        } else {
            return;
        }

        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error(`Error signing in with ${providerName}`, error);
            showAlert(`Could not sign in with ${providerName}. Please try again. Code: ${error.code}`);
        }
    };
    
    const handleGuestSignIn = async () => {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error(&apos;Error signing in as guest&apos;, error);
            showAlert(`Could not sign in as guest. Please try again. Code: ${error.code}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Trading Journal</h1>
                    <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">Sign in to continue to your dashboard.</p>
                </div>
                <div className="space-y-4">
                    <button onClick={() => handleSignIn(&apos;google&apos;)} className=&quot;w-full flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors&quot;>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.841C34.553 4.806 29.625 2.5 24 2.5C11.936 2.5 2.5 11.936 2.5 24S11.936 45.5 24 45.5c11.498 0 20.44-8.522 20.44-19.516c0-1.346-.138-2.658-.389-3.95z"/></svg>
                        Sign in with Google
                    </button>
                    <button onClick={() => handleSignIn(&apos;yahoo&apos;)} className=&quot;w-full flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors&quot;>
                         <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true"><path fill="#6001d2" d="M12.152 0c-4.52 0-8.232 3.712-8.232 8.232C3.92 12.753 7.63 16.465 12.15 16.465c4.521 0 8.233-3.712 8.233-8.233C20.385 3.712 16.673 0 12.152 0zm.111 2.275c2.478 0 4.461 1.983 4.461 4.46s-1.983 4.46-4.46 4.46c-2.478 0-4.461-1.984-4.461-4.46s1.983-4.46 4.46-4.46zM12 17.513c-4.417 0-8.312 2.3-8.312 6.488h16.625c0-4.188-3.896-6.488-8.313-6.488z"/></svg>
                        Sign in with Yahoo
                    </button>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or</span>
                        </div>
                    </div>
                     <button onClick={handleGuestSignIn} className="w-full flex items-center justify-center px-8 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 transition-colors">
                       <User className="w-5 h-5 mr-2" />
                        Sign in as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useTheme();
    const [alertInfo, setAlertInfo] = useState({ show: false, message: &apos;&apos; });

    const showAlert = (message) => setAlertInfo({ show: true, message });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-950"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="font-inter bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
            <style>
              {`
                @import url(&apos;https://rsms.me/inter/inter.css&apos;);
                html { font-family: &apos;Inter&apos;, sans-serif; }
                @supports (font-variation-settings: normal) {
                  html { font-family: &apos;Inter var&apos;, sans-serif; }
                }
              `}
            </style>
             <AlertModal isOpen={alertInfo.show} onClose={() => setAlertInfo({ show: false, message: &apos;&apos; })} message={alertInfo.message} />
            {user ? <TradingJournal user={user} theme={theme} setTheme={setTheme} /> : <LoginScreen showAlert={showAlert}/>}
        </div>
    );
}

// --- TradingJournal Component (Main View) ---
const TradingJournal = ({ user, theme, setTheme }) => {
    const [activeView, setActiveView] = useState(&apos;Dashboard&apos;);
    const [journals, setJournals] = useState([]);
    const [activeJournalId, setActiveJournalId] = useState(null);
    const [activeJournalData, setActiveJournalData] = useState(null);
    const [loadingJournals, setLoadingJournals] = useState(true);
    const [alertInfo, setAlertInfo] = useState({ show: false, message: &apos;&apos; });

    const showAlert = (message) => setAlertInfo({ show: true, message });

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error(&quot;Error signing out:&quot;, error);
            showAlert(&quot;Error signing out.&quot;);
        }
    };
    
    useEffect(() => {
        if (!user) return;
        const journalsQuery = query(collection(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;));
        const unsubscribeJournals = onSnapshot(journalsQuery, async (snapshot) => {
            setLoadingJournals(true);
            if (snapshot.empty) {
                const newJournalRef = doc(collection(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;));
                const defaultJournal = {
                    name: user.isAnonymous ? &apos;Guest Journal&apos; : &apos;My First Journal&apos;,
                    createdAt: serverTimestamp(),
                    balance: 10000,
                    dailyProfitTarget: 200,
                    weeklyProfitGoal: 1000,
                    riskPercentage: 2,
                };
                await setDoc(newJournalRef, defaultJournal);
                setActiveJournalId(newJournalRef.id);
            } else {
                const journalsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setJournals(journalsList);
                if (!activeJournalId || !journalsList.some(j => j.id === activeJournalId)) {
                     setActiveJournalId(journalsList[0]?.id || null);
                }
            }
            setLoadingJournals(false);
        }, (error) => {
            console.error(&quot;Error fetching journals: &quot;, error);
            showAlert(&quot;Could not fetch trading journals.&quot;);
            setLoadingJournals(false);
        });
        return () => unsubscribeJournals();
    }, [user]);

    useEffect(() => {
        if (!user || !activeJournalId) {
             setActiveJournalData(null);
             return;
        };
        const journalDocRef = doc(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId);
        const unsubscribeJournalData = onSnapshot(journalDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setActiveJournalData({ id: docSnap.id, ...docSnap.data() });
            } else {
                setActiveJournalId(journals[0]?.id || null);
                setActiveJournalData(null);
            }
        }, (error) => {
            console.error(&quot;Error fetching active journal data: &quot;, error);
            showAlert(&quot;Could not fetch active journal data.&quot;);
        });
        return () => unsubscribeJournalData();
    }, [user, activeJournalId, journals]);

    const renderView = () => {
        if (loadingJournals || !activeJournalData) {
            return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
        }
        
        const props = { user, activeJournalData, db, activeJournalId, showAlert };

        switch (activeView) {
            case &apos;Dashboard&apos;: return <Dashboard {...props} />;
            case &apos;Trade Logs&apos;: return <TradeLogs {...props} />;
            case &apos;Performance&apos;: return <Performance {...props} />;
            case &apos;Transactions&apos;: return <Transactions {...props} />;
            case &apos;Goals&apos;: return <Goals {...props} />;
            case &apos;Plan&apos;: return <Plan {...props} />;
            case &apos;Calendar&apos;: return <CalendarView {...props} />;
            case &apos;Journal Manager&apos;: return <AccountManager {...props} journals={journals} setActiveJournalId={setActiveJournalId} />;
            default: return <Dashboard {...props} />;
        }
    };

    return (
        <div className="flex h-screen">
            <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} handleLogout={handleLogout} theme={theme} setTheme={setTheme} />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-100 dark:bg-gray-950">
                 <div className="relative z-10">{renderView()}</div>
            </main>
            <AlertModal isOpen={alertInfo.show} onClose={() => setAlertInfo({ show: false, message: &apos;&apos; })} message={alertInfo.message} />
        </div>
    );
};

// --- Sidebar Component ---
const Sidebar = ({ activeView, setActiveView, user, handleLogout, theme, setTheme }) => {
    const navItems = [
        { name: &apos;Dashboard&apos;, icon: <TrendingUp className="w-5 h-5" /> },
        { name: &apos;Trade Logs&apos;, icon: <Book className="w-5 h-5" /> },
        { name: &apos;Performance&apos;, icon: <ChevronsUp className="w-5 h-5" /> },
        { name: &apos;Plan&apos;, icon: <Map className="w-5 h-5" /> },
        { name: &apos;Goals&apos;, icon: <Target className="w-5 h-5" /> },
        { name: &apos;Transactions&apos;, icon: <DollarSign className="w-5 h-5" /> },
        { name: &apos;Calendar&apos;, icon: <Calendar className="w-5 h-5" /> },
        { name: &apos;Journal Manager&apos;, icon: <Settings className="w-5 h-5" /> },
    ];

    return (
        <nav className="w-64 bg-white dark:bg-gray-900 p-4 flex flex-col justify-between border-r border-gray-200 dark:border-gray-800">
            <div>
                <div className="flex items-center mb-10">
                    <img src={user.photoURL || `https://placehold.co/40x40/374151/E5E7EB?text=${(user.displayName || 'G').charAt(0)}`} alt="User" className="w-10 h-10 rounded-full mr-3"/>
                    <div>
                        <h2 className="font-semibold text-md text-gray-800 dark:text-gray-200">{user.displayName || &apos;Guest User&apos;}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[150px] truncate" title={user.uid}>{user.uid}</p>
                    </div>
                </div>
                <ul>
                    {navItems.map(item => (
                        <li key={item.name} className="mb-2">
                            <button
                                onClick={() => setActiveView(item.name)}
                                className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 ${
                                    activeView === item.name 
                                    ? &apos;bg-blue-600 text-white shadow-lg shadow-blue-500/30&apos; 
                                    : &apos;text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800&apos;
                                }`}
                            >
                                {item.icon}
                                <span className="ml-4 font-medium">{item.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                   <button onClick={() => setTheme(&apos;light&apos;)} className={`p-2 rounded-md ${theme === &apos;light&apos; ? &apos;bg-blue-500 text-white&apos; : &apos;hover:bg-gray-200 dark:hover:bg-gray-700&apos;}`}><Sun size={18}/></button>
                   <button onClick={() => setTheme(&apos;dark&apos;)} className={`p-2 rounded-md ${theme === &apos;dark&apos; ? &apos;bg-blue-500 text-white&apos; : &apos;hover:bg-gray-200 dark:hover:bg-gray-700&apos;}`}><Moon size={18}/></button>
                   <button onClick={() => setTheme(&apos;auto&apos;)} className={`p-2 rounded-md ${theme === &apos;auto&apos; ? &apos;bg-blue-500 text-white&apos; : &apos;hover:bg-gray-200 dark:hover:bg-gray-700&apos;}`}>Auto</button>
                </div>
                 <button onClick={handleLogout} className="flex items-center w-full p-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="ml-4 font-medium">Logout</span>
                </button>
            </div>
        </nav>
    );
};

// --- Modal Component ---
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div onClick={(e) => e.stopPropagation()} className=&quot;bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700 animate-scale-up&quot;>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

// --- Alert Modals ---
const AlertModal = ({ isOpen, onClose, message }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Alert">
            <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
            <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg">OK</button>
        </Modal>
    );
};

const ConfirmationModal = ({ isOpen, onClose, title, message, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-800/50">
                     <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 my-4">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={onClose} className="w-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-black dark:text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className=&quot;w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg&quot;>Confirm</button>
                </div>
            </div>
        </Modal>
    );
};

// --- Dashboard Component ---
const Clock = ({ timezone, label }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    
    const timeString = time.toLocaleTimeString(&apos;en-US&apos;, {
        timeZone: timezone,
        hour: &apos;2-digit&apos;,
        minute: &apos;2-digit&apos;,
        hour12: true,
    });

    return (
        <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{timeString}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    );
};


const Dashboard = ({ user, activeJournalData, db, activeJournalId }) => {
    const [isManageBalanceModalOpen, setIsManageBalanceModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
    const [transactionAmount, setTransactionAmount] = useState(&apos;&apos;);
    const [newGoals, setNewGoals] = useState({ daily: activeJournalData.dailyProfitTarget, weekly: activeJournalData.weeklyProfitGoal });
    const [newRisk, setNewRisk] = useState(activeJournalData.riskPercentage);
    const [trades, setTrades] = useState([]);
    
    useEffect(() => {
        if (!activeJournalId) return;
        const tradesQuery = query(collection(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId, &apos;trades&apos;));
        const unsubscribe = onSnapshot(tradesQuery, (snapshot) => {
            const tradesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            tradesData.sort((a, b) => (a.date?.seconds || 0) - (b.date?.seconds || 0));
            setTrades(tradesData);
        });
        return () => unsubscribe();
    }, [user.uid, db, activeJournalId]);
    
    useEffect(() => {
        if (activeJournalData) {
            setNewGoals({ daily: activeJournalData.dailyProfitTarget, weekly: activeJournalData.weeklyProfitGoal });
            setNewRisk(activeJournalData.riskPercentage);
        }
    }, [activeJournalData]);

    const handleTransaction = async (type) => {
        const amount = parseFloat(transactionAmount);
        if (isNaN(amount) || amount <= 0) return;
        const newBalance = type === 'deposit' ? activeJournalData.balance + amount : activeJournalData.balance - amount;
        if (newBalance < 0) return;
        
        const journalDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'journals', activeJournalId);
        await updateDoc(journalDocRef, { balance: newBalance });
        await addDoc(collection(journalDocRef, 'transactions'), { type, amount, timestamp: serverTimestamp(), newBalance });
        setTransactionAmount('');
        setIsManageBalanceModalOpen(false);
    };

    const handleGoalUpdate = async () => {
        const journalDocRef = doc(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId);
        await updateDoc(journalDocRef, {
            dailyProfitTarget: parseFloat(newGoals.daily) || 0,
            weeklyProfitGoal: parseFloat(newGoals.weekly) || 0,
        });
        setIsGoalModalOpen(false);
    };
    
    const handleRiskUpdate = async () => {
        const journalDocRef = doc(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId);
        await updateDoc(journalDocRef, { riskPercentage: parseFloat(newRisk) || 2 });
        setIsRiskModalOpen(false);
    }

    const today = new Date(); today.setHours(0,0,0,0);
    const todaysTrades = trades.filter(t => t.date && t.date.toDate() >= today);
    const todaysProfit = todaysTrades.reduce((s, t) => s + (t.sessionProfit || 0), 0);
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    const weeklyProfit = trades.filter(t => t.date && t.date.toDate() >= startOfWeek).reduce((s, t) => s + (t.sessionProfit || 0), 0);
    
    const balanceHistory = useMemo(() => {
        if(trades.length === 0) return [{name: &apos;Start&apos;, balance: activeJournalData.balance}];
        let runningBalance = activeJournalData.balance - trades.reduce((sum, t) => sum + (t.sessionProfit || 0), 0);
        const history = [{ name: &apos;Start&apos;, balance: runningBalance }];
        trades.forEach((trade, index) => {
            runningBalance += (trade.sessionProfit || 0);
            history.push({ name: `T${index + 1}`, balance: runningBalance });
        });
        return history;
    }, [trades, activeJournalData.balance]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="space-y-8">
            <div>
                 <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">{getGreeting()}, {user.displayName || &apos;Trader&apos;}!</h1>
                 <p className="text-lg text-gray-500 dark:text-gray-400">Welcome to your {activeJournalData.name}.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Clock label="Onitsha" timezone="Africa/Lagos" />
                    <Clock label="London" timezone="Europe/London" />
                    <Clock label="New York" timezone="America/New_York" />
                    <Clock label="Tokyo" timezone="Asia/Tokyo" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div 
                    className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col cursor-pointer transition-transform transform hover:scale-[1.02]"
                    onClick={() => setIsManageBalanceModalOpen(true)}
                >
                   <div className="flex flex-col items-center justify-center flex-grow p-6">
                     <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-1">Trading Balance</h3>
                     <p className="text-5xl font-bold text-gray-800 dark:text-gray-100">${activeJournalData.balance.toFixed(2)}</p>
                   </div>
                   <div className="h-32 -mx-1 -mb-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={balanceHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                               <defs>
                                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', border: '1px solid #e5e7eb', borderRadius: '12px' }}
                                    formatter={(value) => [`$${value.toFixed(2)}`, &apos;Balance&apos;]}
                                />
                                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} fill="url(#balanceGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                   </div>
                </div>

                <div className="space-y-6">
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-transform transform hover:scale-105" onClick={() => setIsGoalModalOpen(true)}>
                        <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-2">Profit Targets</h3>
                        <div className="space-y-3">
                             <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="font-medium text-gray-600 dark:text-gray-300">Daily</span>
                                    <span className={`font-bold ${todaysProfit >= 0 ? &apos;text-green-500&apos; : &apos;text-red-500&apos;}`}>${todaysProfit.toFixed(2)} / ${activeJournalData.dailyProfitTarget}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-blue-500 h-2.5 rounded-full" style={{width: `${Math.min(100, (todaysProfit / (activeJournalData.dailyProfitTarget||1)) * 100)}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="font-medium text-gray-600 dark:text-gray-300">Weekly</span>
                                    <span className={`font-bold ${weeklyProfit >= 0 ? &apos;text-green-500&apos; : &apos;text-red-500&apos;}`}>${weeklyProfit.toFixed(2)} / ${activeJournalData.weeklyProfitGoal}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-green-500 h-2.5 rounded-full" style={{width: `${Math.min(100, (weeklyProfit / (activeJournalData.weeklyProfitGoal||1)) * 100)}%`}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={() => setIsRiskModalOpen(true)} className=&quot;w-full bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center cursor-pointer transition-transform transform hover:scale-105&quot;>
                        <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-1">Risk Management</h3>
                        <div className="flex items-baseline space-x-2">
                           <span className="text-2xl font-bold text-red-500">{activeJournalData.riskPercentage}%</span>
                           <span className="text-lg font-medium text-gray-700 dark:text-gray-300">(${((activeJournalData.balance * activeJournalData.riskPercentage) / 100).toFixed(2)})</span>
                        </div>
                    </button>
                </div>
            </div>

            <Modal isOpen={isManageBalanceModalOpen} onClose={() => setIsManageBalanceModalOpen(false)} title=&quot;Manage Balance&quot;><div className="space-y-4"><p className="text-gray-600 dark:text-gray-300">Enter amount to deposit or withdraw.</p><input type="number" value={transactionAmount} onChange={(e) => setTransactionAmount(e.target.value)} placeholder=&quot;Amount&quot; className=&quot;w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500&quot; /><div className="flex space-x-4"><button onClick={() => handleTransaction(&apos;deposit&apos;)} className=&quot;w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg&quot;>Deposit</button><button onClick={() => handleTransaction(&apos;withdraw&apos;)} className=&quot;w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg&quot;>Withdraw</button></div></div></Modal>
            <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title=&quot;Update Profit Targets&quot;><div className="space-y-4"><label className="block"><span className="text-gray-600 dark:text-gray-300">Daily Profit Target ($)</span><input type="number" value={newGoals.daily} onChange={(e) => setNewGoals({...newGoals, daily: e.target.value})} className=&quot;w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500&quot; /></label><label className="block"><span className="text-gray-600 dark:text-gray-300">Weekly Profit Goal ($)</span><input type="number" value={newGoals.weekly} onChange={(e) => setNewGoals({...newGoals, weekly: e.target.value})} className=&quot;w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500&quot; /></label><button onClick={handleGoalUpdate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg">Save Goals</button></div></Modal>
            <Modal isOpen={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} title=&quot;Adjust Risk&quot;><div className="space-y-4"><label className="block"><span className="text-gray-600 dark:text-gray-300">Risk Percentage per Trade (%)</span><input type="number" value={newRisk} onChange={(e) => setNewRisk(e.target.value)} className=&quot;w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500&quot; /></label><p className="text-sm text-gray-500 dark:text-gray-400 text-center">This will risk <span className="font-bold">${((activeJournalData.balance * newRisk) / 100).toFixed(2)}</span> of your current balance per trade.</p><button onClick={handleRiskUpdate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg">Set Risk</button></div></Modal>
        </div>
    );
};

// --- TradeForm Component (for TradeLogs) ---
const TradeForm = ({ tradeData, onInputChange, onSubmit, isManualProfit, setIsManualProfit }) => {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
             <div className="flex justify-end items-center">
                <label htmlFor="manual-profit-toggle" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Enter Profit Manually</label>
                <button type="button" onClick={() => setIsManualProfit(!isManualProfit)} className={`${isManualProfit ? &apos;bg-blue-600&apos; : &apos;bg-gray-200 dark:bg-gray-600&apos;} relative inline-flex items-center h-6 rounded-full w-11`}>
                    <span className={`${isManualProfit ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/>
                </button>
            </div>

            <input name="asset" value={tradeData.asset} onChange={onInputChange} placeholder="Asset (e.g., EUR/USD)" required className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg" />
            <div className="grid grid-cols-2 gap-4"><input type="date" name="date" value={tradeData.date} onChange={onInputChange} required className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg" /><input type="time" name="time" value={tradeData.time} onChange={onInputChange} required className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg" /></div>
            
            {isManualProfit ? (
                <input type="number" step="0.01" name="sessionProfit" value={tradeData.sessionProfit} onChange={onInputChange} placeholder="Session Profit/Loss ($)" required className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg" />
            ) : (
                <>
                <div className="grid grid-cols-2 gap-4"><input type="number" name="investmentPerTrade" value={tradeData.investmentPerTrade} onChange={onInputChange} placeholder="Investment per Trade ($)" required className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg" /><input type="number" name="roi" value={tradeData.roi} onChange={onInputChange} placeholder="ROI (%)" required className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg" /></div>
                <div className="grid grid-cols-2 gap-4"><input type="number" name="totalTrades" value={tradeData.totalTrades} onChange={onInputChange} placeholder="Total Trades" required className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg" /><input type="number" name="losingTrades" value={tradeData.losingTrades} onChange={onInputChange} placeholder="Losing Trades" required className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg" /></div>
                </>
            )}
            <select name="direction" value={tradeData.direction} onChange={onInputChange} className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"><option>Buy</option><option>Sell</option></select>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">{tradeData.id ? &apos;Save Changes&apos; : &apos;Log Trading Session&apos;}</button>
        </form>
    );
};


// --- TradeLogs Component ---
const TradeLogs = ({ user, db, activeJournalId, activeJournalData, showAlert }) => {
    const [trades, setTrades] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrade, setEditingTrade] = useState(null);
    const [isManualProfit, setIsManualProfit] = useState(false);
    const [newTrade, setNewTrade] = useState({
        asset: &apos;&apos;, direction: &apos;Buy&apos;, date: new Date().toISOString().split(&apos;T&apos;)[0], time: new Date().toTimeString().slice(0,5),
        totalTrades: &apos;&apos;, losingTrades: &apos;&apos;, investmentPerTrade: &apos;&apos;, roi: &apos;&apos;, sessionProfit: &apos;&apos;
    });
    const [aiAnalysis, setAiAnalysis] = useState(&apos;&apos;);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);


    useEffect(() => {
        if (!activeJournalId) return;
        const q = query(collection(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId, &apos;trades&apos;), orderBy(&quot;date&quot;, &quot;desc&quot;));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user.uid, db, activeJournalId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const stateSetter = editingTrade ? setEditingTrade : setNewTrade;
        stateSetter(prev => ({ ...prev, [name]: value }));
    };

    const processAndSaveTrade = async (tradeData) => {
        const { id, ...data } = tradeData;
        let sessionProfit;
        let finalTradeData = { ...data, date: new Date(`${data.date}T${data.time}`) };

        if (isManualProfit) {
            sessionProfit = parseFloat(data.sessionProfit);
            if (isNaN(sessionProfit)) {
                showAlert(&apos;Please enter a valid session profit amount.&apos;);
                return;
            }
            finalTradeData = { ...finalTradeData, sessionProfit, sessionOutcome: sessionProfit >= 0 ? &apos;Win&apos; : &apos;Loss&apos; };
        } else {
            const totalTrades = parseInt(data.totalTrades, 10);
            const losingTrades = parseInt(data.losingTrades, 10);
            const investmentPerTrade = parseFloat(data.investmentPerTrade);
            const roi = parseFloat(data.roi);

            if (isNaN(totalTrades) || isNaN(losingTrades) || isNaN(investmentPerTrade) || isNaN(roi) || losingTrades > totalTrades) {
                showAlert(&apos;Please check your inputs for calculating profit. Losing trades cannot exceed total trades.&apos;);
                return;
            }
            const winningTrades = totalTrades - losingTrades;
            sessionProfit = (winningTrades * investmentPerTrade * (roi / 100)) - (losingTrades * investmentPerTrade);
            finalTradeData = { ...finalTradeData, totalTrades, losingTrades, investmentPerTrade, roi, winningTrades, sessionProfit, sessionOutcome: sessionProfit >= 0 ? &apos;Win&apos; : &apos;Loss&apos; };
        }

        const batch = writeBatch(db);
        const journalRef = doc(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId);

        if (id) {
            const oldTrade = trades.find(t => t.id === id);
            const profitDifference = sessionProfit - (oldTrade.sessionProfit || 0);
            const tradeRef = doc(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId, &apos;trades&apos;, id);
            batch.update(tradeRef, finalTradeData);
            batch.update(journalRef, { balance: activeJournalData.balance + profitDifference });
        } else {
            const newTradeRef = doc(collection(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId, &apos;trades&apos;));
            batch.set(newTradeRef, finalTradeData);
            batch.update(journalRef, { balance: activeJournalData.balance + sessionProfit });
        }
        await batch.commit();
        setIsModalOpen(false);
        setEditingTrade(null);
    };

    const handleOpenEditModal = (trade) => {
        const tradeDate = trade.date.toDate();
        setIsManualProfit(trade.sessionProfit !== undefined && trade.totalTrades === undefined);
        setEditingTrade({
            ...trade,
            date: tradeDate.toISOString().split(&apos;T&apos;)[0],
            time: tradeDate.toTimeString().slice(0,5),
        });
        setIsModalOpen(true);
    };
    
    const handleOpenNewModal = () => {
         setNewTrade({
            asset: &apos;&apos;, direction: &apos;Buy&apos;, date: new Date().toISOString().split(&apos;T&apos;)[0], time: new Date().toTimeString().slice(0,5),
            totalTrades: &apos;&apos;, losingTrades: &apos;&apos;, investmentPerTrade: &apos;&apos;, roi: &apos;&apos;, sessionProfit: &apos;&apos;
        });
        setEditingTrade(null);
        setIsManualProfit(false);
        setIsModalOpen(true);
    }
    
    const getAiAnalysis = async (trade) => {
        setIsAiLoading(true);
        setIsAiModalOpen(true);
        setAiAnalysis(&apos;&apos;);
        const prompt = `Analyze this binary options trade session and provide insights. The session outcome was a ${trade.sessionOutcome} with a profit/loss of $${trade.sessionProfit.toFixed(2)}. The asset was ${trade.asset}. The direction was ${trade.direction}. Number of trades: ${trade.totalTrades || &apos;N/A&apos;}, Losing trades: ${trade.losingTrades || &apos;N/A&apos;}. My notes: &quot;${trade.notes || &apos;None&apos;}&quot;. What could I have done better, what did I do well, and what should I look out for next time? Provide the response in clear, concise sections with bullet points.`;
        
        let chatHistory = [{ role: &quot;user&quot;, parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        const apiKey = &quot;&quot;;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: &apos;POST&apos;,
                headers: { &apos;Content-Type&apos;: &apos;application/json&apos; },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setAiAnalysis(text);
            } else {
                setAiAnalysis(&quot;Could not get analysis from AI. The response format might have changed.&quot;);
            }
        } catch(error) {
            console.error(&quot;Error fetching AI analysis:&quot;, error);
            setAiAnalysis(&quot;Failed to fetch AI analysis. Please check the console for errors.&quot;);
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Trade Logs</h1><div className="flex space-x-2"><button onClick={handleOpenNewModal} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"><PlusCircle className="mr-2 h-5 w-5" /> Add Session</button><button onClick={() => downloadCSV(trades.map(t => ({...t, date: t.date?.toDate()})), &apos;trade-history.csv&apos;)} className=&quot;flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-shadow&quot;><Download className="mr-2 h-5 w-5" /> Export</button></div></div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]"><thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700"><tr><th className="p-3">Date</th><th className="p-3">Asset</th><th className="p-3">Direction</th><th className="p-3">Trades (W/L)</th><th className="p-3">Session P/L</th><th className="p-3">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {trades.map(trade => (<tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700"><td className="p-3">{trade.date ? new Date(trade.date.seconds * 1000).toLocaleString() : &apos;N/A&apos;}</td><td className="p-3 font-medium">{trade.asset}</td><td className={`p-3 font-semibold ${trade.direction === 'Buy' ? 'text-green-500' : 'text-red-500'}`}>{trade.direction}</td><td className="p-3">{trade.totalTrades !== undefined ? `${trade.totalTrades} (${trade.winningTrades}/${trade.losingTrades})` : &apos;N/A&apos;}</td><td className={`p-3 font-semibold ${trade.sessionProfit >= 0 ? &apos;text-green-500&apos; : &apos;text-red-500&apos;}`}>${trade.sessionProfit?.toFixed(2)}</td>
                        <td className="p-3 flex items-center space-x-2">
                             <button onClick={() => handleOpenEditModal(trade)} className=&quot;p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 rounded-full&quot;><Edit className="w-4 h-4" /></button>
                             <button onClick={() => getAiAnalysis(trade)} className=&quot;p-2 text-gray-500 dark:text-gray-400 hover:text-purple-500 rounded-full&quot; title=&quot;Get AI Analysis&quot;><Sparkles className="w-4 h-4" /></button>
                        </td>
                        </tr>))}
                    </tbody>
                </table>
                 {trades.length === 0 && <p className="text-center p-4 text-gray-500 dark:text-gray-400">No trading sessions logged yet.</p>}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTrade ? &quot;Edit Trading Session&quot; : &quot;Log New Trading Session&quot;}>
                <TradeForm 
                    tradeData={editingTrade || newTrade} 
                    onInputChange={handleInputChange} 
                    onSubmit={(e) => { e.preventDefault(); processAndSaveTrade(editingTrade || newTrade); }}
                    isManualProfit={isManualProfit}
                    setIsManualProfit={setIsManualProfit}
                />
            </Modal>
             <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title=&quot;AI Trade Analysis&quot;>
                {isAiLoading ? (
                     <div className="flex flex-col items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">Analyzing your trade...</p>
                    </div>
                ) : (
                    <div className="prose prose-sm dark:prose-invert max-h-96 overflow-y-auto" dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br />&apos;) }}></div>
                )}
            </Modal>
        </div>
    );
};

// --- Performance Component ---
const Performance = ({ user, db, activeJournalId }) => {
    const [trades, setTrades] = useState([]);
    const [viewMode, setViewMode] = useState(&apos;single&apos;); // &apos;single&apos; or &apos;compare&apos;
    
    // State for single metric view
    const [singleMetric, setSingleMetric] = useState(&apos;dailyProfit&apos;);
    const [chartType, setChartType] = useState(&apos;Bar&apos;);

    // State for compare metrics view
    const [compareMetrics, setCompareMetrics] = useState([&apos;dailyProfit&apos;, &apos;cumulativeProfit&apos;]);

    const ALL_METRICS = {
        dailyProfit: { label: &apos;Daily P/L ($)&apos;, type: &apos;Line&apos;, color: &apos;#8884d8&apos;, yAxisId: &apos;left&apos; },
        cumulativeProfit: { label: &apos;Cumulative P/L ($)&apos;, type: &apos;Area&apos;, color: &apos;#82ca9d&apos;, yAxisId: &apos;left&apos; },
        tradesPerDay: { label: &apos;Trades per Day&apos;, type: &apos;Bar&apos;, color: &apos;#ffc658&apos;, yAxisId: &apos;right&apos; },
        winRateByDay: { label: &apos;Daily Win Rate (%)&apos;, type: &apos;Line&apos;, color: &apos;#ff7300&apos;, yAxisId: &apos;right&apos;, domain: [0, 100]}
    };

     useEffect(() => {
        if (!activeJournalId) return;
        const q = query(collection(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId, &apos;trades&apos;), orderBy(&quot;date&quot;, &quot;asc&quot;));
        const unsubscribe = onSnapshot(q, (snapshot) => setTrades(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));
        return () => unsubscribe();
    }, [user.uid, db, activeJournalId]);
    
    const performanceData = useMemo(() => {
        const stats = { 
            totalProfit: 0, totalSessionWins: 0, totalSessionLosses: 0, avgWin: 0, avgLoss: 0, profitFactor: 0, totalVolume: 0, 
            avgRoi: 0, winningStreak: 0, losingStreak: 0,
            performanceByAsset: {}, dailyMetrics: {}, performanceByDirection: { Buy: { profit: 0, wins: 0, count: 0 }, Sell: { profit: 0, wins: 0, count: 0 } }
        };
        if (trades.length === 0) return { ...stats, chartData: [] };

        let totalWinAmount = 0, totalLossAmount = 0, totalRoi = 0, winningRoiCount = 0;
        let currentWinStreak = 0, currentLoseStreak = 0;

        trades.forEach(t => {
            const profit = t.sessionProfit || 0;
            const outcome = t.sessionOutcome;
            
            stats.totalProfit += profit;

            if (t.totalTrades && t.investmentPerTrade) {
                stats.totalVolume += t.totalTrades * t.investmentPerTrade;
            }

            if (outcome === &apos;Win&apos;) {
                stats.totalSessionWins++;
                totalWinAmount += profit;
                if(t.roi) {
                    totalRoi += t.roi;
                    winningRoiCount++;
                }
                currentWinStreak++;
                currentLoseStreak = 0;
            } else if (outcome === &apos;Loss&apos;) {
                stats.totalSessionLosses++;
                totalLossAmount += profit;
                currentLoseStreak++;
                currentWinStreak = 0;
            }
            stats.winningStreak = Math.max(stats.winningStreak, currentWinStreak);
            stats.losingStreak = Math.max(stats.losingStreak, currentLoseStreak);

            if (!stats.performanceByAsset[t.asset]) stats.performanceByAsset[t.asset] = { profit: 0, wins: 0, losses: 0 };
            stats.performanceByAsset[t.asset].profit += profit;
            outcome === &apos;Win&apos; ? stats.performanceByAsset[t.asset].wins++ : stats.performanceByAsset[t.asset].losses++;

            if(t.direction) {
                stats.performanceByDirection[t.direction].profit += profit;
                stats.performanceByDirection[t.direction].count++;
                if(outcome === &apos;Win&apos;) stats.performanceByDirection[t.direction].wins++;
            }

            const dateStr = t.date.toDate().toISOString().split(&apos;T&apos;)[0];
            if (!stats.dailyMetrics[dateStr]) stats.dailyMetrics[dateStr] = { dailyProfit: 0, tradesPerDay: 0, winsToday: 0 };
            stats.dailyMetrics[dateStr].dailyProfit += profit;
            stats.dailyMetrics[dateStr].tradesPerDay += (t.totalTrades || 1);
            if(outcome === &apos;Win&apos;) stats.dailyMetrics[dateStr].winsToday += (t.winningTrades || 1);
        });

        stats.avgWin = stats.totalSessionWins > 0 ? totalWinAmount / stats.totalSessionWins : 0;
        stats.avgLoss = stats.totalSessionLosses > 0 ? Math.abs(totalLossAmount / stats.totalSessionLosses) : 0;
        stats.profitFactor = stats.avgLoss > 0 ? totalWinAmount / (stats.avgLoss * stats.totalSessionLosses) : Infinity;
        stats.avgRoi = winningRoiCount > 0 ? totalRoi / winningRoiCount : 0;
        
        let cumulativeProfit = 0;
        const chartData = Object.entries(stats.dailyMetrics).map(([date, metrics]) => {
            cumulativeProfit += metrics.dailyProfit;
            const winRate = (metrics.winsToday / metrics.tradesPerDay) * 100;
            return {
                name: date,
                dailyProfit: metrics.dailyProfit,
                tradesPerDay: metrics.tradesPerDay,
                cumulativeProfit: cumulativeProfit,
                winRateByDay: isNaN(winRate) ? 0 : winRate,
            };
        });
        
        return { ...stats, chartData };
    }, [trades]);
    
    const handleCompareMetricChange = (metric) => {
        setCompareMetrics(prev => 
            prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
        );
    };

    const StatCard = ({ title, value, prefix = &apos;&apos;, suffix = &apos;&apos; }) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <h4 className="text-gray-500 dark:text-gray-400 font-medium">{title}</h4>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{prefix}{value}{suffix}</p>
        </div>
    );
    
    const assetPerformance = Object.entries(performanceData.performanceByAsset).sort((a,b) => b[1].profit - a[1].profit);
    const bestAsset = assetPerformance[0];
    const worstAsset = assetPerformance[assetPerformance.length-1];

    const renderChart = () => {
        if (performanceData.chartData.length === 0) return <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">No data to display.</div>;

        if (viewMode === &apos;compare&apos;) {
            return (
                <ComposedChart data={performanceData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" stroke="rgba(128, 128, 128, 0.8)" />
                    <YAxis yAxisId="left" stroke="rgba(128, 128, 128, 0.8)" />
                    <YAxis yAxisId="right" orientation="right" stroke="rgba(128, 128, 128, 0.8)" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: 'none', color: '#fff' }} />
                    <Legend />
                    {compareMetrics.map(key => {
                        const config = ALL_METRICS[key];
                        if (config.type === &apos;Line&apos;) return <Line key={key} yAxisId={config.yAxisId} type="monotone" dataKey={key} name={config.label} stroke={config.color} dot={false} />;
                        if (config.type === &apos;Bar&apos;) return <Bar key={key} yAxisId={config.yAxisId} dataKey={key} name={config.label} fill={config.color} />;
                        if (config.type === &apos;Area&apos;) return <Area key={key} yAxisId={config.yAxisId} type="monotone" dataKey={key} name={config.label} stroke={config.color} fill={config.color} fillOpacity={0.3} />;
                        return null;
                    })}
                </ComposedChart>
            );
        }
        
        if (singleMetric === &apos;All&apos;) {
             return (
                <div className="space-y-12">
                    {Object.entries(ALL_METRICS).map(([key, config]) => {
                        const data = performanceData.chartData.map(d => ({ name: d.name, value: d[key] }));
                        return (
                            <div key={key}>
                                <h3 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-gray-200">{config.label}</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    {config.type === &apos;Bar&apos; ? (
                                        <BarChart data={data}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                            <XAxis dataKey="name" /> <YAxis yAxisId={config.yAxisId} /> <Tooltip />
                                            <Bar dataKey="value" name={config.label} fill={config.color} />
                                        </BarChart>
                                    ) : (
                                        <AreaChart data={data}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                            <XAxis dataKey="name" /> <YAxis yAxisId={config.yAxisId} /> <Tooltip />
                                            <Area type="monotone" dataKey="value" name={config.label} stroke={config.color} fill={config.color} fillOpacity={0.3}/>
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        );
                    })}
                </div>
            );
        }

        const singleChartData = performanceData.chartData.map(d => ({ name: d.name, value: d[singleMetric] }));
        if (chartType === &apos;Bar&apos;) {
            return (
                <BarChart data={singleChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" /> <YAxis /> <Tooltip /> <Legend />
                    <Bar dataKey="value" name={ALL_METRICS[singleMetric].label} fill={ALL_METRICS[singleMetric].color} />
                </BarChart>
            );
        }
        if (chartType === &apos;Line&apos;) {
            return (
                <AreaChart data={singleChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" /> <YAxis /> <Tooltip /> <Legend />
                    <Area type="monotone" dataKey="value" name={ALL_METRICS[singleMetric].label} stroke={ALL_METRICS[singleMetric].color} fill={ALL_METRICS[singleMetric].color} fillOpacity={0.3}/>
                </AreaChart>
            );
        }
        if (chartType === &apos;Pie&apos;) {
            return (
                <PieChart>
                    <Pie data={singleChartData.filter(d=>d.value>0)} dataKey=&quot;value&quot; nameKey=&quot;name&quot; cx=&quot;50%&quot; cy=&quot;50%&quot; outerRadius={120} label>
                        {singleChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={`hsl(${index * 360 / singleChartData.length}, 70%, 60%)`} />)}
                    </Pie>
                    <Tooltip /> <Legend />
                </PieChart>
            );
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Performance Analytics</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                <StatCard title="Total Profit" value={performanceData.totalProfit.toFixed(2)} prefix="$" />
                <StatCard title="Win Rate" value={((performanceData.totalSessionWins / (performanceData.totalSessionWins + performanceData.totalSessionLosses) || 0) * 100).toFixed(1)} suffix="%" />
                <StatCard title="Profit Factor" value={performanceData.profitFactor.toFixed(2)} />
                <StatCard title="Avg Win/Loss" value={`$${performanceData.avgWin.toFixed(2)} / $${performanceData.avgLoss.toFixed(2)}`} />
                <StatCard title="Winning Streak" value={performanceData.winningStreak} suffix=" sessions" />
                {bestAsset && <StatCard title="Best Asset" value={bestAsset[0]} prefix={bestAsset[1].profit > 0 ? &apos;+&apos;:&apos;&apos;}/>}
                {worstAsset && bestAsset?.toString() !== worstAsset?.toString() && <StatCard title="Worst Asset" value={worstAsset[0]} prefix={worstAsset[1].profit > 0 ? &apos;+&apos;:&apos;&apos;}/>}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button onClick={() => setViewMode(&apos;single&apos;)} className={`py-2 px-4 font-medium ${viewMode === &apos;single&apos; ? &apos;border-b-2 border-blue-600 text-blue-600&apos; : &apos;text-gray-500&apos;}`}>Single Metric</button>
                    <button onClick={() => setViewMode(&apos;compare&apos;)} className={`py-2 px-4 font-medium ${viewMode === &apos;compare&apos; ? &apos;border-b-2 border-blue-600 text-blue-600&apos; : &apos;text-gray-500&apos;}`}>Compare Metrics</button>
                </div>
                
                {viewMode === &apos;single&apos; ? (
                     <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                        <div className="flex items-center gap-2">
                            <label className="font-medium">Metric:</label>
                            <select value={singleMetric} onChange={(e) => setSingleMetric(e.target.value)} className=&quot;bg-gray-100 dark:bg-gray-700 p-2 rounded-lg border border-gray-300 dark:border-gray-600&quot;>
                                 <option value="All">All Metrics</option>
                                {Object.entries(ALL_METRICS).map(([key, {label}]) => <option key={key} value={key}>{label}</option>)}
                            </select>
                        </div>
                         {singleMetric !== &apos;All&apos; && (<div className="flex items-center gap-2">
                            <label className="font-medium">Chart Type:</label>
                            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
                               <button onClick={() => setChartType(&apos;Bar&apos;)} className={`px-3 py-1 rounded-l-md ${chartType === &apos;Bar&apos; ? &apos;bg-blue-600 text-white&apos; : &apos;bg-gray-100 dark:bg-gray-700&apos;}`}>Bar</button>
                               <button onClick={() => setChartType(&apos;Line&apos;)} className={`px-3 py-1 border-x border-gray-300 dark:border-gray-600 ${chartType === &apos;Line&apos; ? &apos;bg-blue-600 text-white&apos; : &apos;bg-gray-100 dark:bg-gray-700&apos;}`}>Line</button>
                               <button onClick={() => setChartType(&apos;Pie&apos;)} className={`px-3 py-1 rounded-r-md ${chartType === &apos;Pie&apos; ? &apos;bg-blue-600 text-white&apos; : &apos;bg-gray-100 dark:bg-gray-700&apos;}`}>Pie</button>
                            </div>
                        </div>)}
                    </div>
                ) : (
                     <div className="flex flex-wrap items-center gap-4 mb-4">
                        <label className="font-medium">Metrics to Compare:</label>
                        {Object.entries(ALL_METRICS).map(([key, {label}]) => (
                            <label key={key} className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" checked={compareMetrics.includes(key)} onChange={() => handleCompareMetricChange(key)} className=&quot;h-4 w-4 rounded text-blue-600 focus:ring-blue-500&quot; />
                                <span>{label}</span>
                            </label>
                        ))}
                    </div>
                )}
               
                <ResponsiveContainer width="100%" height={viewMode === 'single' && singleMetric === 'All' ? 300 * Object.keys(ALL_METRICS).length : 400}>
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- CalendarView Component ---
const CalendarView = ({ user, db, activeJournalId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [trades, setTrades] = useState([]);
    const [selectedDayStats, setSelectedDayStats] = useState(null);
    const [selectedWeekStats, setSelectedWeekStats] = useState(null);

    useEffect(() => {
        if (!activeJournalId) return;
        const q = query(collection(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId, &apos;trades&apos;), orderBy(&quot;date&quot;, &quot;asc&quot;));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tradesData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            setTrades(tradesData);
        }, (error) => console.error(&quot;Error fetching trades for calendar: &quot;, error));
        return () => unsubscribe();
    }, [user.uid, db, activeJournalId]);

    const dailyStats = useMemo(() => {
        const stats = {};
        trades.forEach(trade => {
            if (trade.date) {
                const dateStr = trade.date.toDate().toISOString().split(&apos;T&apos;)[0];
                if (!stats[dateStr]) stats[dateStr] = { totalProfit: 0, tradeCount: 0, wins: 0, losses: 0, trades: [] };
                stats[dateStr].totalProfit += trade.sessionProfit || 0;
                const sessionTrades = trade.totalTrades || 1;
                stats[dateStr].tradeCount += sessionTrades;
                stats[dateStr].wins += trade.sessionOutcome === &apos;Win&apos; ? (trade.winningTrades || 1) : 0;
                stats[dateStr].losses += trade.sessionOutcome === &apos;Loss&apos; ? (trade.losingTrades || 1) : 0;
                stats[dateStr].trades.push(trade);
            }
        });
        return stats;
    }, [trades]);

    const handleDayClick = (dayStr) => {
        if (dailyStats[dayStr]) {
            setSelectedDayStats({
                date: dayStr,
                ...dailyStats[dayStr]
            });
        }
    };

    const handleWeekClick = (weekDays) => {
        const weeklyData = {
            totalProfit: 0,
            tradeCount: 0,
            wins: 0,
            losses: 0,
            dailyBreakdown: [],
            startDate: weekDays[0].dayStr,
            endDate: weekDays[6].dayStr
        };

        weekDays.forEach(day => {
            const stat = dailyStats[day.dayStr];
            if (stat) {
                weeklyData.totalProfit += stat.totalProfit;
                weeklyData.tradeCount += stat.tradeCount;
                weeklyData.wins += stat.wins;
                weeklyData.losses += stat.losses;
                weeklyData.dailyBreakdown.push({ date: day.dayStr, ...stat });
            }
        });

        if (weeklyData.tradeCount > 0) {
            setSelectedWeekStats(weeklyData);
        }
    }

    const changeMonth = (offset) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const renderHeader = () => (
        <div className="flex justify-between items-center mb-6"><button onClick={() => changeMonth(-1)} className=&quot;p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700&quot;><ChevronLeft /></button><h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{new Intl.DateTimeFormat(&apos;en-US&apos;, { month: &apos;long&apos;, year: &apos;numeric&apos; }).format(currentDate)}</h2><button onClick={() => changeMonth(1)} className=&quot;p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700&quot;><ChevronRight /></button></div>
    );

    const renderDays = () => (
        <div className="grid grid-cols-8 text-center text-gray-500 dark:text-gray-400 text-sm font-semibold">{[&apos;Sun&apos;, &apos;Mon&apos;, &apos;Tue&apos;, &apos;Wed&apos;, &apos;Thu&apos;, &apos;Fri&apos;, &apos;Sat&apos;, &apos;Weekly&apos;].map(day => <div key={day} className="py-2 border-b border-gray-200 dark:border-gray-700">{day}</div>)}</div>
    );

    const renderCells = () => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDate = new Date(monthStart); startDate.setDate(startDate.getDate() - monthStart.getDay());
        const endDate = new Date(monthEnd); endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
        const rows = []; let day = new Date(startDate);

        while (day <= endDate) {
            let daysInWeek = [];
            let weeklyProfit = 0;
            let hasTrades = false;

            for (let i = 0; i < 7; i++) {
                const dayStr = day.toISOString().split('T')[0];
                const stat = dailyStats[dayStr];
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                if (stat && isCurrentMonth) {
                    weeklyProfit += stat.totalProfit;
                    hasTrades = true;
                }
                
                daysInWeek.push({ dayStr, day: new Date(day) });
                day.setDate(day.getDate() + 1);
            }

            rows.push(
                <div key={day} className="grid grid-cols-8">
                    {daysInWeek.map(({ dayStr, day }) => {
                        const stat = dailyStats[dayStr];
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        let style = {};
                        let clickableClass = &apos;cursor-default&apos;;
                        if (stat && isCurrentMonth) {
                            const baseColor = stat.totalProfit >= 0 ? &apos;34, 197, 94&apos; : &apos;239, 68, 68&apos;;
                            const opacity = Math.min(Math.abs(stat.totalProfit) / 500, 0.7);
                            style = { backgroundColor: `rgba(${baseColor}, ${opacity})`};
                            clickableClass = &apos;cursor-pointer hover:ring-2 hover:ring-blue-500&apos;;
                        }
                        return (
                            <div key={dayStr} style={style} onClick={() => handleDayClick(dayStr)} className={`border-t border-r border-gray-200 dark:border-gray-700 p-2 h-32 flex flex-col transition-all duration-200 ${clickableClass} ${!isCurrentMonth ? &apos;bg-gray-50 dark:bg-gray-800/50 text-gray-400&apos; : &apos;bg-white dark:bg-gray-800&apos;}`}>
                                <span className="font-bold self-end">{day.getDate()}</span>
                                {stat && isCurrentMonth && (
                                    <div className={`mt-1 text-xs text-left font-medium ${stat.totalProfit >= 0 ? &apos;text-green-800&apos; : &apos;text-red-800&apos;}`}>
                                        <p>Trades: {stat.tradeCount}</p>
                                        <p className="font-bold">${stat.totalProfit.toFixed(2)}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div onClick={() => handleWeekClick(daysInWeek)} className={`border-t border-r border-gray-200 dark:border-gray-700 p-2 h-32 flex flex-col justify-center items-center text-center font-semibold ${hasTrades ? &apos;cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700&apos; : &apos;text-gray-400&apos;} ${weeklyProfit > 0 ? &apos;text-green-500&apos; : &apos;text-red-500&apos;}`}>
                        {hasTrades && <span>${weeklyProfit.toFixed(2)}</span>}
                    </div>
                </div>
            );
        }
        return <div className="border-l border-b border-gray-200 dark:border-gray-700">{rows}</div>;
    };

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Trading Calendar</h1>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                {renderHeader()}
                {renderDays()}
                {renderCells()}
            </div>
            {selectedDayStats && <DayStatsModal stats={selectedDayStats} onClose={() => setSelectedDayStats(null)} />}
            {selectedWeekStats && <WeekStatsModal stats={selectedWeekStats} onClose={() => setSelectedWeekStats(null)} />}
        </div>
    );
};

const DayStatsModal = ({ stats, onClose }) => {
    const { date, totalProfit, tradeCount, wins, losses, trades } = stats;
    const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0;
    
    return (
        <Modal isOpen={true} onClose={onClose} title={`Stats for ${new Date(date + 'T00:00:00').toLocaleDateString()}`}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total P/L</h4>
                        <p className={`text-2xl font-bold ${totalProfit >= 0 ? &apos;text-green-500&apos; : &apos;text-red-500&apos;}`}>${totalProfit.toFixed(2)}</p>
                    </div>
                     <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</h4>
                        <p className="text-2xl font-bold text-blue-500">{winRate.toFixed(1)}%</p>
                    </div>
                </div>
                 <div className="text-sm text-center">
                    <p>Total Sessions: {trades.length} | Wins: {wins} | Losses: {losses}</p>
                 </div>
                 <div className="max-h-64 overflow-y-auto space-y-2">
                    <h4 className="font-semibold text-lg">Trade Sessions</h4>
                    {trades.map((trade, index) => (
                        <div key={trade.id || index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                           <div>
                             <p className="font-bold">{trade.asset}</p>
                             <p className="text-xs text-gray-500">{trade.direction}</p>
                           </div>
                           <p className={`font-semibold ${trade.sessionProfit >= 0 ? &apos;text-green-500&apos; : &apos;text-red-500&apos;}`}>${trade.sessionProfit.toFixed(2)}</p>
                        </div>
                    ))}
                 </div>
            </div>
        </Modal>
    );
};

const WeekStatsModal = ({ stats, onClose }) => {
    const { startDate, endDate, totalProfit, tradeCount, wins, losses, dailyBreakdown } = stats;
    const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0;

    return (
        <Modal isOpen={true} onClose={onClose} title={`Stats for Week of ${new Date(startDate + 'T00:00:00').toLocaleDateString()}`}>
            <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total P/L</h4>
                        <p className={`text-2xl font-bold ${totalProfit >= 0 ? &apos;text-green-500&apos; : &apos;text-red-500&apos;}`}>${totalProfit.toFixed(2)}</p>
                    </div>
                     <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Weekly Win Rate</h4>
                        <p className="text-2xl font-bold text-blue-500">{winRate.toFixed(1)}%</p>
                    </div>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2">
                    <h4 className="font-semibold text-lg">Daily Breakdown</h4>
                    {dailyBreakdown.map(day => (
                         <div key={day.date} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                           <div className="flex justify-between items-center font-bold">
                             <span>{new Date(day.date + &apos;T00:00:00&apos;).toLocaleDateString(&apos;en-US&apos;, { weekday: &apos;long&apos; })}</span>
                             <span className={day.totalProfit >=0 ? &apos;text-green-500&apos; : &apos;text-red-500&apos;}>${day.totalProfit.toFixed(2)}</span>
                           </div>
                           <div className="text-xs text-gray-500">
                               {day.trades.length} session(s) | {day.wins} wins / {day.losses} losses
                           </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};


// --- Transactions Component ---
const Transactions = ({ user, db, activeJournalId, activeJournalData, showAlert }) => {
    const [transactions, setTransactions] = useState([]);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!activeJournalId) return;
        const q = query(collection(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId, &apos;transactions&apos;), orderBy(&quot;timestamp&quot;, &quot;desc&quot;));
        const unsubscribe = onSnapshot(q, (snapshot) => setTransactions(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));
        return () => unsubscribe();
    }, [user.uid, db, activeJournalId]);
    
    const handleOpenEditModal = (transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleSaveEdit = async (editedData) => {
        const { id, amount: newAmountStr } = editedData;
        const newAmount = parseFloat(newAmountStr);
        if (isNaN(newAmount) || newAmount <= 0) {
            showAlert("Invalid amount.");
            return;
        }

        const oldAmount = editingTransaction.amount;
        const amountChange = newAmount - oldAmount;
        
        const batch = writeBatch(db);
        const journalRef = doc(db, 'artifacts', appId, 'users', user.uid, 'journals', activeJournalId);
        
        // Update the current transaction
        const editedTransactionRef = doc(journalRef, 'transactions', id);
        batch.update(editedTransactionRef, { amount: newAmount });
        
        // Update all subsequent transactions and the journal balance
        const allTransactionsQuery = query(collection(journalRef, 'transactions'), orderBy("timestamp", "asc"));
        const allTransactionsSnap = await getDocs(allTransactionsQuery);
        let foundEdited = false;
        
        allTransactionsSnap.docs.forEach(docSnap => {
            const trans = {id: docSnap.id, ...docSnap.data()};
            if(foundEdited) {
                batch.update(docSnap.ref, { newBalance: trans.newBalance + amountChange });
            }
            if (trans.id === id) {
                 batch.update(docSnap.ref, { newBalance: trans.newBalance + amountChange });
                 foundEdited = true;
            }
        });

        batch.update(journalRef, { balance: activeJournalData.balance + amountChange });
        
        await batch.commit();
        setIsModalOpen(false);
        setEditingTransaction(null);
        showAlert(&quot;Transaction updated successfully. All subsequent balances have been adjusted.&quot;);
    };

    const EditTransactionForm = ({ transaction, onSave }) => {
        const [amount, setAmount] = useState(transaction.amount);
        return (
            <div className="space-y-4">
                <p>Editing a transaction will recalculate all subsequent balances.</p>
                <label className="block"><span className="text-gray-600 dark:text-gray-300">Amount ($)</span><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className=&quot;w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-1&quot; /></label>
                <button onClick={() => onSave({ ...transaction, amount })} className=&quot;w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg&quot;>Save Changes</button>
            </div>
        );
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Transaction History</h1>
                 <button onClick={() => downloadCSV(transactions.map(t => ({...t, timestamp: t.timestamp?.toDate()})), &apos;transaction-history.csv&apos;)} className=&quot;flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg&quot;><Download className="mr-2 h-5 w-5" /> Export</button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Amount</th><th className="p-3">New Balance</th><th className="p-3">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {transactions.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="p-3">{t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleString() : &apos;N/A&apos;}</td>
                                <td className={`p-3 font-semibold capitalize ${t.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>{t.type}</td>
                                <td className="p-3">${t.amount?.toFixed(2)}</td>
                                <td className="p-3 font-medium">${t.newBalance?.toFixed(2)}</td>
                                <td className="p-3"><button onClick={() => handleOpenEditModal(t)} className=&quot;p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 rounded-full&quot;><Edit className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {transactions.length === 0 && <p className="text-center p-4 text-gray-500 dark:text-gray-400">No transactions recorded yet.</p>}
            </div>
            {editingTransaction && <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title=&quot;Edit Transaction&quot;><EditTransactionForm transaction={editingTransaction} onSave={handleSaveEdit} /></Modal>}
        </div>
    );
};

// --- Goals Component ---
const Goals = ({ user, activeJournalData, db, activeJournalId, showAlert }) => {
    const [goalHistory, setGoalHistory] = useState([]);
    const [trades, setTrades] = useState([]);

    useEffect(() => {
        if (!activeJournalId) return;
        const historyQuery = query(collection(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId, &apos;goalHistory&apos;), orderBy(&quot;endDate&quot;, &quot;desc&quot;));
        const tradesQuery = query(collection(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId, &apos;trades&apos;));
        
        const unsubHistory = onSnapshot(historyQuery, (snapshot) => setGoalHistory(snapshot.docs.map(d => ({id: d.id, ...d.data()}))));
        const unsubTrades = onSnapshot(tradesQuery, (snapshot) => setTrades(snapshot.docs.map(d => d.data())));

        return () => {
            unsubHistory();
            unsubTrades();
        };
    }, [user.uid, db, activeJournalId]);

    const updateGoalHistory = async () => {
        const today = new Date();
        const batch = writeBatch(db);
        const goalHistoryRef = collection(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId, &apos;goalHistory&apos;);

        // Check daily goals for past 30 days
        for(let i=1; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const goalId = `daily-${dateStr}`;
            
            const existingGoalDoc = await getDoc(doc(goalHistoryRef, goalId));
            if (!existingGoalDoc.exists()) {
                const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
                const dayEnd = new Date(date); dayEnd.setHours(23,59,59,999);
                const profit = trades.filter(t => t.date.toDate() >= dayStart && t.date.toDate() <= dayEnd)
                                   .reduce((sum, t) => sum + (t.sessionProfit || 0), 0);
                
                let status = &quot;Uncompleted&quot;;
                if(profit >= activeJournalData.dailyProfitTarget) status = &quot;Completed&quot;;
                else if (profit < 0) status = "Failed";
                
                const newGoal = {
                    type: 'Daily',
                    target: activeJournalData.dailyProfitTarget,
                    achieved: profit,
                    status: status,
                    startDate: dayStart,
                    endDate: dayEnd
                };
                batch.set(doc(goalHistoryRef, goalId), newGoal);
            }
        }
        await batch.commit();
        showAlert("Goal history updated.");
    };

    const getStatusColor = (status) => {
        switch(status) {
            case &quot;Completed&quot;: return &quot;text-green-500 bg-green-500/10&quot;;
            case &quot;Failed&quot;: return &quot;text-red-500 bg-red-500/10&quot;;
            case &quot;Uncompleted&quot;: return &quot;text-yellow-500 bg-yellow-500/10&quot;;
            default: return &quot;text-gray-500 bg-gray-500/10&quot;;
        }
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Goal History</h1>
                 <div className="flex space-x-2">
                    <button onClick={updateGoalHistory} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"><RefreshCw className="mr-2 h-5 w-5" /> Update History</button>
                    <button onClick={() => downloadCSV(goalHistory.map(g => ({...g, startDate: g.startDate?.toDate(), endDate: g.endDate?.toDate()})), &apos;goal-history.csv&apos;)} className=&quot;flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg&quot;><Download className="mr-2 h-5 w-5" /> Export</button>
                 </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Target</th><th className="p-3">Achieved</th><th className="p-3">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {goalHistory.map(g => (
                            <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="p-3">{g.endDate ? g.endDate.toDate().toLocaleDateString() : &apos;N/A&apos;}</td>
                                <td className="p-3">{g.type}</td>
                                <td className="p-3">${g.target?.toFixed(2)}</td>
                                <td className={`p-3 font-semibold ${g.achieved >= 0 ? &apos;text-green-500&apos; : &apos;text-red-500&apos;}`}>${g.achieved?.toFixed(2)}</td>
                                <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(g.status)}`}>{g.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {goalHistory.length === 0 && <p className="text-center p-4 text-gray-500 dark:text-gray-400">No goal history found. Click &quot;Update History&quot; to check for completed goals.</p>}
            </div>
        </div>
    );
};

// --- Plan Component ---
const Plan = ({ user, activeJournalId, showAlert }) => {
    const [plan, setPlan] = useState({ startBalance: 100, endBalance: 1000, days: 10, drawdownPercentage: 5 });
    const planDocRef = useMemo(() => doc(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, activeJournalId, &apos;plan&apos;, &apos;mainPlan&apos;), [user.uid, activeJournalId]);

    useEffect(() => {
        const fetchPlan = async () => {
            const docSnap = await getDoc(planDocRef);
            if (docSnap.exists()) {
                setPlan(docSnap.data());
            }
        };
        fetchPlan();
    }, [planDocRef]);

    const handlePlanChange = (e) => {
        const { name, value } = e.target;
        setPlan(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleSavePlan = async () => {
        await setDoc(planDocRef, plan);
        showAlert(&quot;Your growth plan has been saved!&quot;);
    };
    
    const planData = useMemo(() => {
        const { startBalance, endBalance, days, drawdownPercentage } = plan;
        if (startBalance <= 0 || endBalance <= startBalance || days <= 0) return [];
        
        const dailyGrowthRate = Math.pow(endBalance / startBalance, 1 / days) - 1;
        let currentBalance = startBalance;
        const tableData = [];

        for(let i=1; i <= days; i++) {
            const profitTarget = currentBalance * dailyGrowthRate;
            const endOfDayBalance = currentBalance + profitTarget;
            const drawdownAmount = currentBalance * (drawdownPercentage / 100);
            tableData.push({
                day: i,
                date: new Date(new Date().setDate(new Date().getDate() + i)).toLocaleDateString(),
                start: currentBalance,
                profit: profitTarget,
                drawdown: drawdownAmount,
                end: endOfDayBalance
            });
            currentBalance = endOfDayBalance;
        }
        return tableData;
    }, [plan]);

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Money Growth Plan</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-4">
                    <h2 className="text-2xl font-semibold">Define Your Plan</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Starting Balance ($)</label>
                        <input type="number" name="startBalance" value={plan.startBalance} onChange={handlePlanChange} className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-1"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Goal Balance ($)</label>
                        <input type="number" name="endBalance" value={plan.endBalance} onChange={handlePlanChange} className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-1"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Days</label>
                        <input type="number" name="days" value={plan.days} onChange={handlePlanChange} className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-1"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Drawdown (%)</label>
                        <input type="number" name="drawdownPercentage" value={plan.drawdownPercentage} onChange={handlePlanChange} className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-1"/>
                    </div>
                    <div className="flex space-x-4">
                        <button onClick={handleSavePlan} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">Save Plan</button>
                        <button onClick={() => downloadCSV(planData, &apos;growth-plan.csv&apos;)} className=&quot;w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-center&quot;><Download className="mr-2 h-5 w-5"/> Export Plan</button>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                     <h2 className="text-2xl font-semibold mb-4">Your Daily Roadmap</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                             <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="p-3">Day</th>
                                    <th className="p-3">Start Balance</th>
                                    <th className="p-3">Profit Target</th>
                                    <th className="p-3">Max Drawdown</th>
                                    <th className="p-3">End Balance</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {planData.map(day => (
                                    <tr key={day.day} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="p-3 font-semibold">{day.day}</td>
                                        <td className="p-3">${day.start.toFixed(2)}</td>
                                        <td className="p-3 text-green-500 font-semibold">+${day.profit.toFixed(2)}</td>
                                        <td className="p-3 text-red-500 font-semibold">-${day.drawdown.toFixed(2)}</td>
                                        <td className="p-3 font-bold">${day.end.toFixed(2)}</td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                        {planData.length === 0 && <p className="text-center p-4 text-gray-500 dark:text-gray-400">Enter valid plan details to generate your roadmap.</p>}
                     </div>
                </div>
            </div>
        </div>
    );
};

// --- JournalManager Component ---
const AccountManager = ({ journals, activeJournalId, setActiveJournalId, user, showAlert }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJournal, setEditingJournal] = useState(null);
    const [journalName, setJournalName] = useState(&apos;&apos;);
    const [initialBalance, setInitialBalance] = useState(&apos;10000&apos;);
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: &apos;&apos;, message: &apos;&apos;, onConfirm: () => {} });

    const handleOpenModal = (journal = null) => {
        setEditingJournal(journal);
        setJournalName(journal ? journal.name : &apos;&apos;);
        setInitialBalance(journal ? journal.balance.toString() : &apos;10000&apos;);
        setIsModalOpen(true);
    };

    const handleSaveJournal = async () => {
        if (!journalName) { showAlert(&quot;Journal name cannot be empty.&quot;); return; }
        const balance = parseFloat(initialBalance);
        if (isNaN(balance)) { showAlert(&quot;Initial balance must be a number.&quot;); return; }

        if (editingJournal) {
            const journalRef = doc(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, editingJournal.id);
            await updateDoc(journalRef, { name: journalName });
        } else {
            await addDoc(collection(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;), {
                name: journalName, createdAt: serverTimestamp(), balance: balance,
                dailyProfitTarget: 200, weeklyProfitGoal: 1000, riskPercentage: 2,
            });
        }
        setIsModalOpen(false);
    };

    const deleteSubcollections = async (journalRef) => {
        const subcollections = [&apos;trades&apos;, &apos;transactions&apos;, &apos;goalHistory&apos;, &apos;plan&apos;];
        const batch = writeBatch(db);
        for(const sc of subcollections) {
            const scRef = collection(journalRef, sc);
            const scSnap = await getDocs(scRef);
            scSnap.docs.forEach(doc => batch.delete(doc.ref));
        }
        await batch.commit();
    };

    const confirmResetJournal = (journalToReset) => {
        setConfirmation({
            isOpen: true,
            title: &apos;Reset Journal?&apos;,
            message: `Are you sure you want to reset &quot;${journalToReset.name}&quot;? All trades, transactions, and history will be deleted, and the balance will be reset to $10,000. This action cannot be undone.`,
            onConfirm: () => handleResetJournal(journalToReset),
        });
    };

    const handleResetJournal = async (journalToReset) => {
        const journalRef = doc(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, journalToReset.id);
        await deleteSubcollections(journalRef);
        await updateDoc(journalRef, { balance: 10000 });
        showAlert(&quot;Journal has been reset.&quot;);
    };

    const confirmDeleteJournal = (journalIdToDelete, journalName) => {
        if (journals.length <= 1) { 
            showAlert("You cannot delete your only journal."); 
            return; 
        }
        setConfirmation({
            isOpen: true,
            title: 'Delete Journal?',
            message: `Are you sure you want to permanently delete "${journalName}" and all its data? This action cannot be undone.`,
            onConfirm: () => handleDeleteJournal(journalIdToDelete),
        });
    }
    
    const handleDeleteJournal = async (journalIdToDelete) => {
        const journalRef = doc(db, &apos;artifacts&apos;, appId, &apos;users&apos;, user.uid, &apos;journals&apos;, journalIdToDelete);
        await deleteSubcollections(journalRef);
        await deleteDoc(journalRef);
        showAlert(&quot;Journal deleted successfully.&quot;);
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Journal Manager</h1>
                <button onClick={() => handleOpenModal()} className=&quot;flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg&quot;>
                    <PlusCircle className="mr-2 h-5 w-5" /> Add Journal
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-4">
                {journals.map(journal => (
                    <div key={journal.id} className={`flex items-center justify-between p-4 rounded-lg ${activeJournalId === journal.id ? 'bg-blue-100 dark:bg-blue-500/20 border-blue-500 border-2' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <button onClick={() => setActiveJournalId(journal.id)} className=&quot;flex-1 text-left&quot;>
                            <h3 className="font-semibold text-lg">{journal.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Balance: ${journal.balance?.toFixed(2)}</p>
                        </button>
                        <div className="flex items-center space-x-2">
                           <button onClick={() => confirmResetJournal(journal)} className=&quot;p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 rounded-full&quot; title=&quot;Reset Journal&quot;><RefreshCw className="w-5 h-5" /></button>
                           <button onClick={() => handleOpenModal(journal)} className=&quot;p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 rounded-full&quot; title=&quot;Edit Journal&quot;><Edit className="w-5 h-5" /></button>
                           <button onClick={() => confirmDeleteJournal(journal.id, journal.name)} className=&quot;p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 rounded-full&quot; title=&quot;Delete Journal&quot;><Trash2 className="w-5 h-5" /></button>
                        </div>
                    </div>
                ))}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingJournal ? &quot;Edit Journal&quot; : &quot;Create New Journal&quot;}>
                <div className="space-y-4">
                    <label className="block"><span className="text-gray-600 dark:text-gray-300">Journal Name</span><input type="text" value={journalName} onChange={(e) => setJournalName(e.target.value)} className=&quot;w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-1&quot; /></label>
                    {!editingJournal && (
                        <label className="block"><span className="text-gray-600 dark:text-gray-300">Initial Balance ($)</span><input type="number" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} className=&quot;w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-1&quot; /></label>
                    )}
                    <button onClick={handleSaveJournal} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg">{editingJournal ? &apos;Save Changes&apos; : &apos;Create Journal&apos;}</button>
                </div>
            </Modal>
            <ConfirmationModal 
                isOpen={confirmation.isOpen} 
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })} 
                title={confirmation.title} 
                message={confirmation.message} 
                onConfirm={confirmation.onConfirm} 
            />
        </div>
    );
};
