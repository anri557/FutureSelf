  import { useState, useEffect } from "react";
  import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
  import { collection, addDoc, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
  import { auth, provider, db } from "./firebase";

  function timeUntil(date) {
    const diff = new Date(date) - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  }

  function MessageCard({ msg, onReveal }) {
    const [countdown, setCountdown] = useState(timeUntil(msg.openDate));
    const isUnlocked = new Date(msg.openDate) <= new Date();

    useEffect(() => {
      if (isUnlocked) return;
      const timer = setInterval(() => {
        setCountdown(timeUntil(msg.openDate));
      }, 1000);
      return () => clearInterval(timer);
    }, [msg.openDate, isUnlocked]);

    return (
      <div
        className={`message-card ${isUnlocked ? "unlocked" : ""} ${msg.revealed ? "revealed" : ""}`}
        onClick={() => isUnlocked && !msg.revealed && onReveal(msg.id)}
      >
        <div className="card-top">
          <div>
            <div className="card-to">To</div>
            <div className="card-name">{msg.to}</div>
          </div>
          <span className={`status-badge ${isUnlocked ? "status-unlocked" : "status-locked"}`}>
            {isUnlocked ? "✦ Unlocked" : "🔒 Sealed"}
          </span>
        </div>

        {!isUnlocked && countdown && (
          <div className="countdown">⏳ Opens in {countdown} · {formatDate(msg.openDate)}</div>
        )}
        {isUnlocked && (
          <div className="countdown unlocked-date">Opened {formatDate(msg.openDate)}</div>
        )}

        <div className={`message-preview ${msg.revealed ? "visible" : ""}`}>
          {msg.body}
        </div>

        {isUnlocked && !msg.revealed && (
          <div className="reveal-hint">Tap to read your letter →</div>
        )}
      </div>
    );
  }

  export default function App() {
    const [user, setUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [body, setBody] = useState("");
    const [to, setTo] = useState("Future Me");
    const [openDate, setOpenDate] = useState("");
    const [email, setEmail] = useState("");
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);

    // Auth listener
    useEffect(() => {
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
      return () => unsub();
    }, []);

    // Load messages from Firestore
    useEffect(() => {
      if (!user) { setMessages([]); return; }
      const q = query(collection(db, "messages"), where("uid", "==", user.uid));
      const unsub = onSnapshot(q, (snap) => {
        const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        msgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMessages(msgs);
      });
      return () => unsub();
    }, [user]);

    const showToast = (msg) => {
      setToast(msg);
      setTimeout(() => setToast(null), 2800);
    };

    const login = () => signInWithPopup(auth, provider);
   
    const logout = () => signOut(auth);

    const sealMessage = async () => {
      if (!body.trim() || !openDate || !email.trim()) {
        showToast("✦ Fill in all fields including your email");
        return;
      }

      const newMsg = {
        uid: user.uid,
        to: to || "Future Me",
        body,
        openDate: new Date(openDate).toISOString(),
        revealed: false,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "messages"), newMsg);

     fetch("https://futureself-backend.onrender.com/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          to_name: to || "Future Me",
          email: email,
          body: body,
          open_date: new Date(openDate).toISOString().split("T")[0],
        }),
      }).then(() => {
        showToast("✦ Letter sealed! Email will arrive on the open date.");
      }).catch(() => {
        showToast("✦ Letter saved to vault but scheduling failed");
      });
      setBody(""); setOpenDate(""); setTo("Future Me"); setEmail("");
    };

    const reveal = async (id) => {
      await updateDoc(doc(db, "messages", id), { revealed: true });
    };

    const today = new Date().toISOString().split("T")[0];

    if (loading) return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#e8a84c", fontFamily: "Georgia, serif", fontSize: "18px" }}>
        ✦ Loading...
      </div>
    );

    if (!user) return (
      <div className="login-screen">
        <div className="stars" />
        <div className="login-box">
          <span className="logo-mark">✦</span>
          <h1>Letters to your <em>future self</em></h1>
          <p className="subtitle">Sealed in time. Opened when you're ready.</p>
          <button className="google-btn" onClick={login}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>
        </div>
      </div>
    );

    return (
      <>
        <div className="stars" />
        <div className="app">
          <header>
            <span className="logo-mark">✦</span>
            <h1>Letters to your <em>future self</em></h1>
            <p className="subtitle">Sealed in time. Opened when you're ready.</p>
            <div className="user-bar">
              <img src={user.photoURL} alt="" className="avatar" />
              <span className="user-name">{user.displayName}</span>
              <button className="logout-btn" onClick={logout}>Sign out</button>
            </div>
          </header>

          <div className="compose-card">
            <div className="compose-label">✦ Write a new letter</div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Dear future me, by now I hope you've…"
            />
            <div className="compose-meta">
              <div className="field-group">
                <span className="field-label">To</span>
                <input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Future Me" />
              </div>
              <div className="field-group">
                <span className="field-label">Your Email</span>
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" />
              </div>
              <div className="field-group">
                <span className="field-label">Open on</span>
                <input type="date" value={openDate} min={today} onChange={(e) => setOpenDate(e.target.value)} />
              </div>
              <button className="seal-btn" onClick={sealMessage}>Seal Letter ✦</button>
            </div>
          </div>

          <div className="vault-header">
            <span className="vault-title">Your vault</span>
            <span className="vault-count">{messages.length} letters</span>
          </div>

          <div className="message-list">
            {messages.length === 0 && (
              <div className="empty-state">
                <span>✦</span>
                <p>No letters yet. Write your first message<br />to your future self.</p>
              </div>
            )}
            {messages.map((msg) => (
              <MessageCard key={msg.id} msg={msg} onReveal={reveal} />
            ))}
          </div>
        </div>
        <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
      </>
    );
  }