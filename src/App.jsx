import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import {
  Receipt,
  FileSpreadsheet,
  CheckSquare,
  Copy,
  Check,
  LogOut,
  User,
  Lock,
  Mail,
  FileText,
  LayoutDashboard,
  Activity,
  Clock,
  ArrowRight,
  Search,
  Bell,
  ChevronRight,
  AlertCircle,
  Coins,
  Plus,
  RefreshCw,
  ShieldCheck,
  SearchCode,
  AlertTriangle,
  FolderSearch,
  Filter,
  CheckCircle2,
  Users
} from 'lucide-react';

// ==========================================
// AUTHENTICATION STATE (MOCK PROVIDER WITH MULTIPLE CORPORATE ACCOUNTS)
// ==========================================
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('alzone_erp_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (response.ok) {
        const loggedUser = await response.json();
        setUser(loggedUser);
        localStorage.setItem('alzone_erp_user', JSON.stringify(loggedUser));
        return { success: true };
      } else {
        const errData = await response.json();
        return { success: false, message: errData.error || 'Invalid credentials.' };
      }
    } catch (e) {
      return { success: false, message: 'Server database connection is currently offline.' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (response.ok) {
        const newUser = await response.json();
        setUser(newUser);
        localStorage.setItem('alzone_erp_user', JSON.stringify(newUser));
        return { success: true };
      } else {
        const errData = await response.json();
        return { success: false, message: errData.error || 'Failed to register terminal.' };
      }
    } catch (e) {
      return { success: false, message: 'Server database connection is currently offline.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('alzone_erp_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// ==========================================
// TERMINAL ALERTS & TOAST SYSTEM
// ==========================================
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-medium border animate-slide-in pointer-events-auto max-w-sm ${toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}
          >
            {toast.type === 'success' ? (
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-sky-600 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ==========================================
// MAIN WORKSPACE ENTRY & HASH ROUTER
// ==========================================
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

// ==========================================
// 1. CORPORATE LOGIN WITH PROFILE SWITCHER
// ==========================================
function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('rafi.muhammed@alzone.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const users = await response.json();
          setAvailableUsers(users);
          if (users.length > 0) {
            setEmail(users[0].email);
          }
        }
      } catch (e) {
        console.error('Failed to fetch available users:', e);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(res.message || 'Invalid corporate credentials. Check spelling and try again.');
    }
  };

  const selectQuickAccount = (quickEmail) => {
    setEmail(quickEmail);
    setPassword('');
    setError('');
    // Focus on the password input field
    setTimeout(() => {
      const pwdInput = document.getElementById('password');
      if (pwdInput) {
        pwdInput.focus();
      }
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0F172A] relative overflow-hidden">
      {/* Dynamic light effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-900/15 rounded-full blur-[110px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-950/10 rounded-full blur-[110px] pointer-events-none"></div>

      {/* Left side: branding/seeded logins list */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10 border-r border-[#1E293B] bg-gradient-to-b from-[#0A0F1D] to-[#0F172A]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-tr from-sky-600 to-[#C74A2C] rounded flex items-center justify-center text-white font-extrabold text-sm shadow">
            A
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-sans">
            Alzone <span className="text-sky-400 font-medium">ERP</span>
          </span>
        </div>

        <div className="max-w-md my-auto">
          <span className="bg-sky-500/10 text-sky-400 text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider border border-sky-500/20">
            Accounts Payable Platform
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-4 leading-tight">
            Oracle Match & Ticket Manager
          </h1>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            Instantly match warehousing purchase receipts and accounts payable invoices. Monitor active compliance tickets, resolve variance warnings, and search the audit voucher index database.
          </p>

          {/* Seeded logins cards */}
          <div className="mt-8">
            <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#C74A2C]" />
              <span>Select Corporate Identity to Log In</span>
            </h4>
            <div className="grid grid-cols-1 gap-2.5 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
              {availableUsers.map((u) => (
                <button
                  key={u.email}
                  onClick={() => selectQuickAccount(u.email)}
                  className="w-full text-left p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-sky-500 hover:bg-[#1E293B] transition-all flex items-center gap-3 group"
                >
                  <img
                    src={u.avatarUrl}
                    alt={`Avatar ${u.name}`}
                    className="w-9 h-9 rounded-full object-cover border border-slate-700 group-hover:border-sky-400"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-200 text-xs">{u.name}</p>
                    <p className="text-[10px] text-slate-500">{u.email} • {u.role}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-500">
          © 2026 Alzone Systems Inc. Standard Compliance: HIPAA, SOX Section 404, ISO 9001.
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile view top logo */}
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            <div className="h-8 w-8 bg-gradient-to-tr from-sky-600 to-[#C74A2C] rounded flex items-center justify-center text-white font-extrabold text-sm shadow">
              A
            </div>
            <span className="text-lg font-bold tracking-tight text-white font-sans">
              Alzone <span className="text-sky-400 font-medium">ERP</span>
            </span>
          </div>

          <div className="bg-[#1E293B]/80 backdrop-blur-md border border-[#334155] rounded-xl shadow-2xl p-8 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-[#C74A2C] to-sky-600 rounded-t-xl"></div>

            <h2 className="text-xl font-bold text-white tracking-tight">Login</h2>
            {/* <p className="text-xs text-slate-400 mt-1 mb-6">Select your identity on the left or type your corporate email, then enter your personalized password (e.g. <code className="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono font-bold">rafi2026</code>, <code className="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono font-bold">jerry2026</code>, <code className="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono font-bold">dev2026</code>, or <code className="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono font-bold">chintam2026</code>) to sign in.</p> */}

            {error && (
              <div className="mb-4 p-3 bg-rose-950/30 border border-rose-800 text-rose-200 text-xs rounded-md flex items-center gap-2 animate-fade-in">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@alzone.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#0F172A]/80 border border-[#334155] text-white text-sm placeholder:text-slate-500 rounded-md focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </span>
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#0F172A]/80 border border-[#334155] text-white text-sm placeholder:text-slate-500 rounded-md focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-6 py-2 px-4 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-sm rounded-md shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Log in</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Mobile Seeded Login Buttons */}
            <div className="block lg:hidden mt-6 pt-6 border-t border-[#334155]">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Quick Switch Terminals</h4>
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {availableUsers.map((u) => (
                  <button
                    key={u.email}
                    onClick={() => selectQuickAccount(u.email)}
                    className="p-2 bg-[#0F172A] border border-[#334155] hover:border-slate-500 rounded text-[10px] text-slate-300 font-semibold transition-all truncate"
                    title={u.name}
                  >
                    {u.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#334155] text-center text-xs">
              <span className="text-slate-400">New corporate operator? </span>
              <Link to="/signup" className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-0.5">
                Create an account <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. SIGNUP WORKSPACE ENTRY
// ==========================================
function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please complete all form fields.');
      return;
    }

    const res = await register(name, email, password);
    if (res.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] relative overflow-hidden px-4">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#C74A2C]/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 bg-gradient-to-tr from-sky-600 to-[#C74A2C] rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-sans">
            Alzone <span className="text-sky-400 font-semibold">ERP</span>
          </span>
        </div>

        <div className="bg-[#1E293B]/80 backdrop-blur-md border border-[#334155] rounded-xl shadow-2xl p-8 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C74A2C] via-sky-500 to-[#C74A2C] rounded-t-xl"></div>

          <h2 className="text-xl font-bold text-white tracking-tight">Create Operator Access</h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">Register a new physical terminal key inside Alzone ERP.</p>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/30 border border-rose-800 text-rose-200 text-xs rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullname" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  id="fullname"
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-[#0F172A]/80 border border-[#334155] text-white text-sm placeholder:text-slate-500 rounded-md focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@alzone.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-[#0F172A]/80 border border-[#334155] text-white text-sm placeholder:text-slate-500 rounded-md focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Terminal Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="Create Terminal Passcode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-[#0F172A]/80 border border-[#334155] text-white text-sm placeholder:text-slate-500 rounded-md focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-2 px-4 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-sm rounded-md shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Verify Access Key</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#334155] text-center text-xs">
            <span className="text-slate-400">Back to terminal? </span>
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-0.5">
              Sign In here <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. AP DASHBOARD LAYOUT & VIEW CONTROLLER
// ==========================================
function DashboardLayout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Three clean operational views only: 'overview' (focused on active tickets), 'matching' (match desk), 'finder' (registry search)
  const [activeView, setActiveView] = useState('overview');

  // Unified global header search state
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [showHeaderSearchResults, setShowHeaderSearchResults] = useState(false);

  // Stateful inputs for 3-Way Match Desk (State retained between active sub-tabs!)
  const [receiptForm, setReceiptForm] = useState({
    receiptNumber: '',
    receiptDate: '',
    poNumber: '',
    supplier: '',
    site: ''
  });

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    totalSales: '',
    totalVat: ''
  });

  const [activeTab, setActiveTab] = useState('receipt');

  // Actions match states
  const [isMatching, setIsMatching] = useState(false);
  const [generatedVoucher, setGeneratedVoucher] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [selectedVoucherDetails, setSelectedVoucherDetails] = useState(null);

  // Vouchers state
  const [matchHistory, setMatchHistory] = useState([]);
  // Discrepancy Tickets state
  const [tickets, setTickets] = useState([]);
  // Database status and loading indicators
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('checking'); // 'online', 'offline', 'checking'

  // Load data asynchronously from SQLite backend on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Check DB Status
        const statusRes = await fetch('/api/status');
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status === 'online') {
            setDbStatus('online');
          } else {
            setDbStatus('offline');
          }
        } else {
          setDbStatus('offline');
        }

        // Fetch tickets
        const ticketsRes = await fetch('/api/tickets');
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setTickets(ticketsData);
        }

        // Fetch matches
        const matchesRes = await fetch('/api/matches');
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setMatchHistory(matchesData);
        }
      } catch (e) {
        console.error("Failed to fetch full-stack SQLite data:", e);
        setDbStatus('offline');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Registry Search & Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'vouchers', 'tickets'
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Quick Resolve: click to pre-fill the match workstation!
  const handleQuickResolveTicket = (ticket) => {
    setReceiptForm({
      receiptNumber: ticket.receiptNo,
      receiptDate: new Date().toISOString().substring(0, 10),
      poNumber: 'PO-REF-' + Math.floor(1000 + Math.random() * 9000),
      supplier: ticket.supplier,
      site: ''
    });
    setInvoiceForm({
      invoiceNumber: ticket.invoiceNo,
      invoiceDate: new Date().toISOString().substring(0, 10),
      totalSales: ticket.amount.toString(),
      totalVat: (ticket.amount * 0.15).toFixed(2)
    });

    // Redirect to match desk
    setActiveView('matching');
    setActiveTab('receipt');
    showToast(`Ticket ${ticket.id} details loaded into match desk.`, 'info');
  };

  const handleSignOut = () => {
    logout();
    showToast('Signed out successfully', 'info');
    navigate('/login');
  };

  const isReceiptFormComplete = Object.values(receiptForm).every(val => val !== '');
  const isInvoiceFormComplete = Object.values(invoiceForm).every(val => val !== '');

  const handleReset = () => {
    setReceiptForm({ receiptNumber: '', receiptDate: '', poNumber: '', supplier: '', site: '' });
    setInvoiceForm({ invoiceNumber: '', invoiceDate: '', totalSales: '', totalVat: '' });
    showToast('Match desk inputs cleared.', 'info');
  };

  const handleMatch = async () => {
    setIsMatching(true);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const voucherCode = `VOC_${rand}`;

    const cleanReceiptNo = receiptForm.receiptNumber || 'REC-' + Math.floor(100000 + Math.random() * 900000);
    const cleanInvoiceNo = invoiceForm.invoiceNumber || 'INV-' + Math.floor(100000 + Math.random() * 900000);
    const supplierValue = receiptForm.supplier || 'Intel Corporate Services';
    const amountValue = parseFloat(invoiceForm.totalSales) || 1250.00;
    const vatValue = parseFloat(invoiceForm.totalVat) || 187.50;

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher: voucherCode,
          receiptNo: cleanReceiptNo,
          invoiceNo: cleanInvoiceNo,
          supplier: supplierValue,
          amount: amountValue,
          vat: vatValue
        })
      });

      if (response.ok) {
        setGeneratedVoucher(voucherCode);
        setShowMatchModal(true);
        showToast(`Audit Succeeded! Match Voucher ${voucherCode} created.`, 'success');

        // Refetch tickets and matches from backend to keep state perfectly synchronized!
        const ticketsRes = await fetch('/api/tickets');
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setTickets(ticketsData);
        }

        const matchesRes = await fetch('/api/matches');
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setMatchHistory(matchesData);
        }
      } else {
        const errData = await response.json();
        showToast(`Match failed: ${errData.error || 'Invalid inputs.'}`, 'error');
      }
    } catch (e) {
      console.error('Failed to submit transaction match:', e);
      showToast('Database error: match transaction offline.', 'error');
    } finally {
      setIsMatching(false);
    }
  };

  const handleCopyToClipboard = (text) => {
    const performFeedback = () => {
      setCopiedText(true);
      showToast('Voucher code copied to clipboard!', 'success');
      setTimeout(() => setCopiedText(false), 2000);
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text)
        .then(performFeedback)
        .catch((err) => {
          console.warn('Modern Clipboard API failed, attempting fallback...', err);
          fallbackCopyToClipboard(text, performFeedback);
        });
    } else {
      fallbackCopyToClipboard(text, performFeedback);
    }
  };

  const fallbackCopyToClipboard = (text, callback) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        callback();
      } else {
        showToast('Failed to copy to clipboard', 'error');
      }
    } catch (err) {
      console.error('Fallback clipboard copy failed:', err);
      showToast('Copy to clipboard not supported on this device/browser context.', 'error');
    }

    document.body.removeChild(textArea);
  };

  // ------------------------------------------
  // CALCULATED METRICS FOR DASHBOARD (Focusing purely on active tickets)
  // ------------------------------------------
  const openTicketsList = useMemo(() => {
    return tickets.filter(t => t.status === 'Open');
  }, [tickets]);

  const activeTicketsCount = openTicketsList.length;

  const activeHighSeverityCount = useMemo(() => {
    return openTicketsList.filter(t => t.severity === 'High').length;
  }, [openTicketsList]);

  const activeTicketsTotalValue = useMemo(() => {
    return openTicketsList.reduce((sum, item) => sum + item.amount, 0);
  }, [openTicketsList]);

  // Combined Vouchers & Tickets listing for Search Table
  const registryRecords = useMemo(() => {
    const items = [];

    // Matched vouchers into registry rows
    matchHistory.forEach(item => {
      items.push({
        id: item.voucher,
        type: 'Voucher',
        ref: `${item.receiptNo} / ${item.invoiceNo}`,
        supplier: item.supplier,
        amount: item.amount,
        vat: item.vat,
        status: 'Matched',
        timestamp: item.timestamp,
        raw: item
      });
    });

    // Discrepancy tickets into registry rows
    tickets.forEach(item => {
      items.push({
        id: item.id,
        type: 'Discrepancy Ticket',
        ref: `${item.receiptNo} / ${item.invoiceNo}`,
        supplier: item.supplier,
        amount: item.amount,
        vat: item.amount * 0.15,
        status: item.status,
        timestamp: item.timestamp,
        raw: item
      });
    });

    // Filter by type
    let filtered = items;
    if (filterType === 'vouchers') {
      filtered = items.filter(i => i.type === 'Voucher');
    } else if (filterType === 'tickets') {
      filtered = items.filter(i => i.type === 'Discrepancy Ticket');
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.id.toLowerCase().includes(q) ||
        i.supplier.toLowerCase().includes(q) ||
        i.ref.toLowerCase().includes(q) ||
        i.status.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [matchHistory, tickets, filterType, searchQuery]);

  // Global Header Instant Search results
  const headerSearchResults = useMemo(() => {
    if (!headerSearchQuery.trim()) return { vouchers: [], tickets: [] };
    const q = headerSearchQuery.toLowerCase();

    const matchedVouchers = matchHistory.filter(v =>
      v.voucher.toLowerCase().includes(q) ||
      v.supplier.toLowerCase().includes(q) ||
      v.receiptNo.toLowerCase().includes(q) ||
      v.invoiceNo.toLowerCase().includes(q)
    );

    const matchedTickets = tickets.filter(t =>
      t.id.toLowerCase().includes(q) ||
      t.supplier.toLowerCase().includes(q) ||
      t.receiptNo.toLowerCase().includes(q) ||
      t.invoiceNo.toLowerCase().includes(q)
    );

    return { vouchers: matchedVouchers, tickets: matchedTickets };
  }, [headerSearchQuery, matchHistory, tickets]);

  return (
    <div className="flex h-screen w-full bg-[#f4f6f8] text-slate-700 select-none font-sans overflow-hidden">

      {/* ==========================================
          SIDEBAR NAVIGATION (Clean Slate Grays & Redwood details)
         ========================================== */}
      <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col justify-between shrink-0 border-r border-[#1E293B]">
        <div>
          {/* Sidebar Top Logo */}
          <div className="h-14 border-b border-[#1E293B] px-4 flex items-center gap-2 bg-[#0A0F1D]">
            <div className="h-7 w-7 bg-gradient-to-tr from-sky-600 to-[#C74A2C] rounded flex items-center justify-center text-white font-extrabold text-sm shadow">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                Alzone <span className="text-sky-400 font-medium">ERP</span>
              </span>
              <span className="text-[9px] text-[#C74A2C] uppercase font-bold tracking-widest mt-0.5 font-sans">Matching System</span>
            </div>
          </div>

          {/* Core Navigation Items (Removed all simulated tabs!) */}
          <nav className="p-3 space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2.5 py-1">
              AP MATCH TERMINAL
            </div>

            {/* 1. OVERVIEW DASHBOARD */}
            <button
              onClick={() => {
                setActiveView('overview');
                setHeaderSearchQuery('');
                setShowHeaderSearchResults(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded transition-all font-medium ${activeView === 'overview'
                ? 'bg-[#1E293B] text-white font-semibold border-l-2 border-[#C74A2C]'
                : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`h-4 w-4 shrink-0 ${activeView === 'overview' ? 'text-[#C74A2C]' : 'text-slate-500'}`} />
                <span>Overview Dashboard</span>
              </div>
              <span className="bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono">
                {activeTicketsCount}
              </span>
            </button>

            {/* 2. MATCH DESK */}
            <button
              onClick={() => {
                setActiveView('matching');
                setHeaderSearchQuery('');
                setShowHeaderSearchResults(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded transition-all font-medium ${activeView === 'matching'
                ? 'bg-[#1E293B] text-white font-semibold border-l-2 border-sky-500'
                : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className={`h-4 w-4 shrink-0 ${activeView === 'matching' ? 'text-sky-500' : 'text-slate-500'}`} />
                <span>Match Desk</span>
              </div>
              {activeView === 'matching' && (
                <span className="bg-sky-500/20 text-sky-400 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase">Ready</span>
              )}
            </button>

            {/* 3. REGISTRY FINDER */}
            <button
              onClick={() => {
                setActiveView('finder');
                setHeaderSearchQuery('');
                setShowHeaderSearchResults(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded transition-all font-medium ${activeView === 'finder'
                ? 'bg-[#1E293B] text-white font-semibold border-l-2 border-emerald-500'
                : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderSearch className={`h-4 w-4 shrink-0 ${activeView === 'finder' ? 'text-emerald-500' : 'text-slate-500'}`} />
                <span>Registry Finder</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono">
                {registryRecords.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Status */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0A0F1D]/80">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dbStatus === 'online' ? 'bg-emerald-400' : dbStatus === 'checking' ? 'bg-amber-400' : 'bg-rose-400'
                }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${dbStatus === 'online' ? 'bg-emerald-500' : dbStatus === 'checking' ? 'bg-amber-500' : 'bg-rose-500'
                }`}></span>
            </div>
            <span className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider font-sans">
              {dbStatus === 'online' ? '' : dbStatus === 'checking' ? 'Connecting DB...' : '● DB Server Offline'}
            </span>
          </div>
          <div className="text-[9px] text-slate-500 leading-tight">
            Operator: <span className="font-mono text-slate-300 font-bold">{user?.name}</span>
          </div>
        </div>
      </aside>

      {/* ==========================================
          MAIN AREA CONTENT
         ========================================== */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Top Header & Integrated Global Search Bar */}
        <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-sm z-20 relative">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Alzone AP Terminal</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-slate-800 uppercase tracking-wide text-[10px]">
              {activeView === 'overview' ? 'Overview Dashboard' : activeView === 'matching' ? 'Match Desk' : 'Registry Finder'}
            </span>
          </div>

          {/* Unified Global Finder Search Bar */}
          <div className="relative w-80 max-w-xs md:max-w-md">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <input
                type="text"
                value={headerSearchQuery}
                onFocus={() => setShowHeaderSearchResults(true)}
                onChange={(e) => {
                  setHeaderSearchQuery(e.target.value);
                  setShowHeaderSearchResults(true);
                }}
                placeholder="Search vouchers, tickets, suppliers..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs placeholder:text-slate-400 focus:bg-white focus:border-sky-500 transition-all font-sans"
              />
              {headerSearchQuery && (
                <button
                  onClick={() => {
                    setHeaderSearchQuery('');
                    setShowHeaderSearchResults(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Instant Header Dropdown Search Results Overlay */}
            {showHeaderSearchResults && headerSearchQuery.trim() !== '' && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowHeaderSearchResults(false)}
                ></div>
                <div className="absolute right-0 left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-40 max-h-80 overflow-y-auto p-2.5 animate-slide-in">

                  {/* Results: Vouchers */}
                  <div className="mb-3">
                    <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-1.5 flex items-center gap-1">
                      <CheckSquare className="h-3 w-3 text-sky-600" />
                      <span>Compliance Vouchers ({headerSearchResults.vouchers.length})</span>
                    </h5>
                    {headerSearchResults.vouchers.length === 0 ? (
                      <p className="text-[10px] text-slate-400 px-1 py-0.5">No vouchers match query.</p>
                    ) : (
                      <div className="space-y-1">
                        {headerSearchResults.vouchers.slice(0, 3).map(v => (
                          <div key={v.voucher} className="p-1.5 rounded hover:bg-slate-50 flex items-center justify-between text-xs transition-colors">
                            <div
                              onClick={() => {
                                setSelectedVoucherDetails(v);
                                setShowHeaderSearchResults(false);
                              }}
                              className="cursor-pointer flex-1 text-left hover:bg-slate-100/50 p-0.5 rounded transition-colors"
                            >
                              <p className="font-mono font-bold text-sky-700 hover:text-sky-900">{v.voucher}</p>
                              <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{v.supplier} • ${v.amount.toLocaleString()}</p>
                            </div>
                            <button
                              onClick={() => {
                                handleCopyToClipboard(v.voucher);
                                setShowHeaderSearchResults(false);
                              }}
                              className="px-2 py-0.75 bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 rounded text-[9px] font-bold flex items-center gap-0.5 border border-slate-200 shrink-0"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Results: Tickets */}
                  <div>
                    <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-[#C74A2C]" />
                      <span>Active Tickets ({headerSearchResults.tickets.length})</span>
                    </h5>
                    {headerSearchResults.tickets.length === 0 ? (
                      <p className="text-[10px] text-slate-400 px-1 py-0.5">No tickets match query.</p>
                    ) : (
                      <div className="space-y-1">
                        {headerSearchResults.tickets.slice(0, 3).map(t => (
                          <div key={t.id} className="p-1.5 rounded hover:bg-slate-50 flex items-center justify-between text-xs transition-colors">
                            <div>
                              <p className="font-mono font-bold text-[#C74A2C]">{t.id}</p>
                              <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{t.supplier} • ${t.amount.toLocaleString()}</p>
                            </div>
                            {t.status === 'Open' ? (
                              <button
                                onClick={() => {
                                  handleQuickResolveTicket(t);
                                  setShowHeaderSearchResults(false);
                                }}
                                className="px-2 py-0.75 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded text-[9px] font-bold flex items-center gap-0.5 border border-sky-100"
                              >
                                <span>Match</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            ) : (
                              <span className="text-[9px] font-bold text-emerald-600 pr-1 flex items-center gap-0.5"><Check className="h-3.5 w-3.5" /> Settled</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </>
            )}
          </div>

          {/* Right Header User Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img
                src={user?.avatarUrl}
                alt="Profile avatar"
                className="w-7 h-7 rounded-full border border-[#C74A2C] object-cover shadow-sm"
              />
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-xs font-semibold text-slate-800">{user?.name}</span>
                <span className="text-[9px] text-[#C74A2C] font-semibold mt-0.5">{user?.role}</span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200"></div>

            <button
              onClick={handleSignOut}
              className="p-1.5 rounded hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 text-xs font-medium"
              title="Sign Out of Terminal"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dashboard Workbench Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#f4f6f8] flex flex-col gap-5">

          {/* ==========================================
              VIEW 1: OVERVIEW DASHBOARD (Focuses ONLY on Active Tickets)
             ========================================== */}
          {activeView === 'overview' && (
            <div className="space-y-5 animate-fade-in">
              {/* Dashboard Banner */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#C74A2C]"></div>
                <div>
                  <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Active Discrepancy Ticket Panel</h1>
                  <p className="text-xs text-slate-500 mt-1">Review outstanding transaction mismatches. Resolve variances by launching instant matches to create compliance vouchers.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveView('matching')}
                    className="px-4 py-2 bg-gradient-to-r from-sky-700 to-sky-800 hover:from-sky-600 hover:to-sky-700 text-white text-xs font-bold rounded shadow transition-all flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Manual Match</span>
                  </button>
                </div>
              </div>

              {/* KPI STATS ROW (Focuses exclusively on Active / Open Tickets) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* KPI 1 */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Discrepancy Tickets</span>
                    <h3 className={`text-xl font-bold mt-1.5 font-mono ${activeTicketsCount > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{activeTicketsCount} Open</h3>
                    <span className="text-[9px] text-[#C74A2C] font-semibold flex items-center gap-0.5 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Action required in matching terminal</span>
                    </span>
                  </div>
                  <div className="h-10 w-10 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg flex items-center justify-center shadow-inner shrink-0">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">High Severity Warnings</span>
                    <h3 className={`text-xl font-bold mt-1.5 font-mono ${activeHighSeverityCount > 0 ? 'text-rose-700' : 'text-slate-800'}`}>{activeHighSeverityCount} Alerts</h3>
                    <span className="text-[9px] text-rose-500 font-semibold block mt-1">Invoice value exceeds PO limit</span>
                  </div>
                  <div className="h-10 w-10 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg flex items-center justify-center shadow-inner shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Discrepancy Exposure</span>
                    <h3 className="text-xl font-bold text-slate-800 mt-1.5 font-mono">${activeTicketsTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    <span className="text-[9px] text-slate-400 font-medium block mt-1">Locked accounts payable capital</span>
                  </div>
                  <div className="h-10 w-10 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg flex items-center justify-center shadow-inner shrink-0">
                    <Coins className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* DYNAMIC TICKETS WORKFLOW & METRIC FEED */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-xs uppercase font-extrabold text-slate-800 tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-[#C74A2C]" />
                    <span>Active Discrepancy Desk Queue</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Awaiting Master File Match</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {openTicketsList.map(ticket => (
                    <div key={ticket.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 text-[10px]">
                            {ticket.id}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border ${ticket.severity === 'High'
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}>
                            {ticket.severity} Severity
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{ticket.timestamp}</span>
                        </div>
                        <h4 className="text-slate-800 font-bold text-xs md:text-sm mt-1">{ticket.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-0.5">
                          <span className="font-semibold text-slate-700">{ticket.supplier}</span>
                          <span className="h-3 w-px bg-slate-300"></span>
                          <span>Receipt: <strong className="font-mono">{ticket.receiptNo}</strong></span>
                          <span className="h-3 w-px bg-slate-300"></span>
                          <span>Invoice: <strong className="font-mono">{ticket.invoiceNo}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                        <div className="text-right">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">MISMAPPED AMOUNT</p>
                          <p className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">${ticket.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <button
                          onClick={() => handleQuickResolveTicket(ticket)}
                          className="px-4.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-md text-xs font-bold transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                        >
                          <span>Execute Match</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {openTicketsList.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-slate-50/50">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2 animate-scale-up" />
                      <h4 className="text-sm font-bold text-slate-800">Workspace Ledger is Perfectly Aligned</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">No active discrepancy tickets require operator matches at this time. Standard AP operations are running smoothly.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              VIEW 2: AP 3-WAY MATCH DESK (Stateful matching entry platform)
             ========================================== */}
          {activeView === 'matching' && (
            <div className="space-y-5 animate-fade-in">
              {/* Top Title Action Pane */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-sky-50 rounded-lg border border-sky-200 flex items-center justify-center text-sky-700 shrink-0 shadow-inner">
                    <CheckSquare className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-slate-800 tracking-tight">AP Match Workstation</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Validate physical warehousing purchase receipts against supplier billing invoice ledgers. Verify values to generate compliance match vouchers.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5 animate-hover-spin" />
                    <span>Reset Workstation</span>
                  </button>
                </div>
              </div>

              {/* Split Workstation & Action Column */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0">
                {/* Stateful Sub-tabs Match Card */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-500 to-[#C74A2C]"></div>

                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-bold text-slate-800 tracking-wider">Invoice to Reciept Comparison</span>
                        <span className="bg-[#C74A2C]/10 text-[#C74A2C] text-[9px] px-2 py-0.5 rounded font-bold border border-[#C74A2C]/20 uppercase">Check</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-medium">Validation Status:</span>
                        <div className="flex gap-1.5">
                          <span className={`h-2.5 w-2.5 rounded-full border ${isReceiptFormComplete ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-300 border-slate-400'}`} title="Receipt Master File Status"></span>
                          <span className={`h-2.5 w-2.5 rounded-full border ${isInvoiceFormComplete ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-300 border-slate-400'}`} title="Invoice Match Form Status"></span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-Tab Navigation */}
                    <div className="px-5 border-b border-slate-200 flex items-center gap-1 bg-white">
                      <button
                        onClick={() => setActiveTab('receipt')}
                        className={`py-3 px-4 text-xs font-semibold transition-all border-b-2 flex items-center gap-2 relative ${activeTab === 'receipt'
                          ? 'border-sky-600 text-sky-700 bg-sky-50/30'
                          : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                          }`}
                      >
                        <Receipt className={`h-4 w-4 ${activeTab === 'receipt' ? 'text-sky-600' : 'text-slate-400'}`} />
                        <span>Receipt Master File</span>
                        {isReceiptFormComplete ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">Ready</span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">Draft</span>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveTab('invoice')}
                        className={`py-3 px-4 text-xs font-semibold transition-all border-b-2 flex items-center gap-2 relative ${activeTab === 'invoice'
                          ? 'border-sky-600 text-sky-700 bg-sky-50/30'
                          : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                          }`}
                      >
                        <FileSpreadsheet className={`h-4 w-4 ${activeTab === 'invoice' ? 'text-sky-600' : 'text-slate-400'}`} />
                        <span>Invoice Ledger Match</span>
                        {isInvoiceFormComplete ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">Ready</span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">Draft</span>
                        )}
                      </button>
                    </div>

                    {/* Forms Display Area (State fully preserved on tab switch!) */}
                    <div className="p-5">
                      {/* Tab 1: Receipt Master */}
                      <div className={activeTab === 'receipt' ? 'block animate-fade-in' : 'hidden'}>
                        <div className="mb-4 bg-slate-50 border border-slate-200 p-3 rounded flex items-center gap-2.5 text-xs text-slate-500">
                          <AlertCircle className="h-4 w-4 text-sky-600 shrink-0" />
                          <span>Input receiving metadata details from physical warehouse cargo check-in sheets.</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <div>
                            <label htmlFor="receiptNumber" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Receipt Reference ID <span className="text-red-500">*</span></label>
                            <input
                              id="receiptNumber"
                              type="text"
                              required
                              placeholder="REC-2026-XXXX"
                              value={receiptForm.receiptNumber}
                              onChange={(e) => setReceiptForm({ ...receiptForm, receiptNumber: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-slate-800 rounded shadow-sm focus:ring-1 focus:ring-sky-600 focus:border-sky-600 text-xs transition-all placeholder:text-slate-400 font-mono"
                            />
                          </div>

                          <div>
                            <label htmlFor="receiptDate" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Warehousing Cargo Date <span className="text-red-500">*</span></label>
                            <input
                              id="receiptDate"
                              type="date"
                              required
                              value={receiptForm.receiptDate}
                              onChange={(e) => setReceiptForm({ ...receiptForm, receiptDate: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-slate-800 rounded shadow-sm focus:ring-1 focus:ring-sky-600 focus:border-sky-600 text-xs transition-all"
                            />
                          </div>

                          <div>
                            <label htmlFor="poNumber" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Purchase Order Reference <span className="text-red-500">*</span></label>
                            <input
                              id="poNumber"
                              type="text"
                              required
                              placeholder="PO-2026-XXXX"
                              value={receiptForm.poNumber}
                              onChange={(e) => setReceiptForm({ ...receiptForm, poNumber: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-slate-800 rounded shadow-sm focus:ring-1 focus:ring-sky-600 focus:border-sky-600 text-xs transition-all placeholder:text-slate-400 font-mono"
                            />
                          </div>

                          <div>
                            <label htmlFor="supplier" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Supplier Corporate Entity <span className="text-red-500">*</span></label>
                            <input
                              id="supplier"
                              type="text"
                              required
                              placeholder="e.g. Apex Telecom Group"
                              value={receiptForm.supplier}
                              onChange={(e) => setReceiptForm({ ...receiptForm, supplier: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-slate-800 rounded shadow-sm focus:ring-1 focus:ring-sky-600 focus:border-sky-600 text-xs transition-all placeholder:text-slate-400"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label htmlFor="site" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Site <span className="text-red-500">*</span></label>
                            <input
                              id="site"
                              type="text"
                              required
                              placeholder="e.g. Silicon Valley HQ (US-WEST-1)"
                              value={receiptForm.site}
                              onChange={(e) => setReceiptForm({ ...receiptForm, site: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-slate-800 rounded shadow-sm focus:ring-1 focus:ring-sky-600 focus:border-sky-600 text-xs transition-all placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tab 2: Invoice Match */}
                      <div className={activeTab === 'invoice' ? 'block animate-fade-in' : 'hidden'}>
                        <div className="mb-4 bg-slate-50 border border-slate-200 p-3 rounded flex items-center gap-2.5 text-xs text-slate-500">
                          <AlertCircle className="h-4 w-4 text-sky-600 shrink-0" />
                          <span>Input exact accounts payable billing invoices mapped to the received files.</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <div>
                            <label htmlFor="invoiceNumber" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Invoice Ledger Number <span className="text-red-500">*</span></label>
                            <input
                              id="invoiceNumber"
                              type="text"
                              required
                              placeholder="INV-XXXXXX-XX"
                              value={invoiceForm.invoiceNumber}
                              onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-slate-800 rounded shadow-sm focus:ring-1 focus:ring-sky-600 focus:border-sky-600 text-xs transition-all placeholder:text-slate-400 font-mono"
                            />
                          </div>

                          <div>
                            <label htmlFor="invoiceDate" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Billing Invoice Date <span className="text-red-500">*</span></label>
                            <input
                              id="invoiceDate"
                              type="date"
                              required
                              value={invoiceForm.invoiceDate}
                              onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-slate-800 rounded shadow-sm focus:ring-1 focus:ring-sky-600 focus:border-sky-600 text-xs transition-all"
                            />
                          </div>

                          <div>
                            <label htmlFor="totalSales" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Sales Value (USD) <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">$</span>
                              <input
                                id="totalSales"
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={invoiceForm.totalSales}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setInvoiceForm({
                                    ...invoiceForm,
                                    totalSales: e.target.value,
                                    totalVat: (val * 0.15).toFixed(2)
                                  });
                                }}
                                className="w-full pl-6 pr-2.5 py-1.5 border border-slate-300 bg-white text-slate-800 rounded shadow-sm focus:ring-1 focus:ring-sky-600 focus:border-sky-600 text-xs transition-all placeholder:text-slate-400 font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="totalVat" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Calculated Associated VAT (15% Default)</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">$</span>
                              <input
                                id="totalVat"
                                type="number"
                                step="0.01"
                                readOnly
                                value={invoiceForm.totalVat}
                                placeholder="0.00"
                                className="w-full pl-6 pr-2.5 py-1.5 border border-slate-200 bg-slate-50 text-slate-500 rounded shadow-sm text-xs font-mono select-none outline-none focus:ring-0 focus:border-slate-200"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Workstation matching triggers */}
                    <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Corporate ISO 9001 and SOX compliance validated match structure.</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={handleMatch}
                          disabled={isMatching || !isReceiptFormComplete || !isInvoiceFormComplete}
                          className="px-5 py-2 bg-gradient-to-r from-sky-700 to-sky-800 hover:from-sky-600 hover:to-sky-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow-lg flex items-center gap-2 transform active:scale-[0.98] transition-all"
                        >
                          {isMatching ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              <span>Running Audit Check...</span>
                            </>
                          ) : (
                            <>
                              <CheckSquare className="h-3.5 w-3.5" />
                              <span>Execute Match</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match desk sidebar helpers */}
                <div className="flex flex-col gap-4">


                  {/* Dynamic workspace history log */}
                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
                    <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between shrink-0">
                      <span className="text-xs uppercase font-bold text-slate-800 tracking-wider flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-[#C74A2C]" />
                        <span>Recent Generated Vouchers</span>
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {matchHistory.slice(0, 10).map((item, idx) => (
                        <div key={item.voucher + idx} className="p-3 hover:bg-slate-50 transition-colors flex flex-col gap-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span
                              onClick={() => setSelectedVoucherDetails(item)}
                              className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 cursor-pointer hover:bg-sky-100 hover:text-sky-900 transition-all"
                            >
                              {item.voucher}
                            </span>
                            <span className="text-[9px] text-slate-400">{item.timestamp}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-0.5">
                            <div><span className="font-semibold">Rec:</span> <span className="font-mono">{item.receiptNo}</span></div>
                            <div><span className="font-semibold">Inv:</span> <span className="font-mono">{item.invoiceNo}</span></div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] mt-1.5 pt-1.5 border-t border-dashed border-slate-100">
                            <span className="font-bold text-slate-800">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <button onClick={() => handleCopyToClipboard(item.voucher)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-all">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              VIEW 3: REGISTRY FINDER DESK (Full search console)
             ========================================== */}
          {activeView === 'finder' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col flex-1 overflow-hidden animate-fade-in relative">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-500 to-[#C74A2C]"></div>

              {/* Title Pane */}
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <FolderSearch className="h-4.5 w-4.5 text-sky-600" />
                    <span>Compliance Voucher & Ticket Registry</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Perform instant filters and audit query checks across all generated vouchers and matching tickets.</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                      className="pl-8 pr-8 py-1.5 border border-slate-300 bg-white text-slate-700 text-xs rounded font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 min-w-[200px] justify-between relative"
                    >
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                        <Filter className="h-3.5 w-3.5 text-sky-600" />
                      </span>
                      <span className="truncate pr-1">
                        {filterType === 'all' && 'All Registry Records'}
                        {filterType === 'vouchers' && 'Generated Match Vouchers'}
                        {filterType === 'tickets' && 'Discrepancy Tickets'}
                      </span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                        <ChevronRight className={`h-3 w-3 text-slate-400 transition-transform ${isFilterDropdownOpen ? 'rotate-90 text-sky-600' : ''}`} />
                      </span>
                    </button>

                    {isFilterDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsFilterDropdownOpen(false)}
                        ></div>
                        <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-xl z-40 p-1.5 animate-slide-in">
                          {[
                            { value: 'all', label: 'All Registry Records', desc: 'View all tickets & vouchers', icon: FolderSearch, color: 'text-slate-500 bg-slate-50' },
                            { value: 'vouchers', label: 'Generated Match Vouchers', desc: 'Audit compliance records', icon: CheckSquare, color: 'text-sky-600 bg-sky-50' },
                            { value: 'tickets', label: 'Discrepancy Tickets', desc: 'Outstanding active items', icon: AlertCircle, color: 'text-[#C74A2C] bg-orange-50' }
                          ].map((opt) => {
                            const IconComponent = opt.icon;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setFilterType(opt.value);
                                  setIsFilterDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between hover:bg-slate-50 ${filterType === opt.value ? 'bg-sky-50/50 font-semibold' : ''
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`h-5 w-5 rounded flex items-center justify-center ${opt.color} shrink-0`}>
                                    <IconComponent className="h-3 w-3" />
                                  </div>
                                  <div className="flex flex-col text-left">
                                    <span className={`text-[11px] ${filterType === opt.value ? 'text-sky-950 font-bold' : 'text-slate-700'}`}>{opt.label}</span>
                                    <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">{opt.desc}</span>
                                  </div>
                                </div>
                                {filterType === opt.value && (
                                  <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid Search Bar */}
              <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Voucher Code, Discrepancy ID, Supplier name, or reference numbers..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded text-xs placeholder:text-slate-400 focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">Clear</button>
                  )}
                </div>
              </div>

              {/* Dynamic Database Table */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 select-none">
                    <tr>
                      <th className="px-5 py-3 font-bold uppercase text-[9px] tracking-wider w-[120px]">Document ID / Code</th>
                      <th className="px-5 py-3 font-bold uppercase text-[9px] tracking-wider w-[120px]">Category Type</th>
                      <th className="px-5 py-3 font-bold uppercase text-[9px] tracking-wider">Supplier Corporate Entity</th>
                      <th className="px-5 py-3 font-bold uppercase text-[9px] tracking-wider">Associated References (Rec / Inv)</th>
                      <th className="px-5 py-3 font-bold uppercase text-[9px] tracking-wider w-[120px] text-right">Value (USD)</th>
                      <th className="px-5 py-3 font-bold uppercase text-[9px] tracking-wider w-[120px] text-center">Status</th>
                      <th className="px-5 py-3 font-bold uppercase text-[9px] tracking-wider w-[120px] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {registryRecords.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-slate-800">
                          <span
                            onClick={() => {
                              if (row.type === 'Voucher') {
                                setSelectedVoucherDetails(row.raw);
                              }
                            }}
                            className={`px-2 py-0.5 rounded ${row.type === 'Voucher'
                              ? 'bg-sky-50 text-sky-800 border border-sky-100 cursor-pointer hover:bg-sky-100 hover:text-sky-950 transition-all'
                              : row.status === 'Open'
                                ? 'bg-amber-50 text-amber-800 border border-amber-100'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                              }`}>
                            {row.id}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-600 flex items-center gap-1.5">
                          {row.type === 'Voucher' ? (
                            <>
                              <CheckSquare className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                              <span>Voucher</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3.5 w-3.5 text-[#C74A2C] shrink-0" />
                              <span>Ticket</span>
                            </>
                          )}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800">{row.supplier}</td>
                        <td className="px-5 py-3 font-mono text-slate-500">{row.ref}</td>
                        <td className="px-5 py-3 font-mono font-bold text-right text-slate-800">
                          ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider border ${row.status === 'Matched' || row.status === 'Resolved'
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                            : 'bg-amber-100 border-amber-200 text-amber-800'
                            }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {row.type === 'Voucher' ? (
                            <button
                              onClick={() => handleCopyToClipboard(row.id)}
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded transition-colors inline-flex items-center gap-1 text-[10px] font-semibold border border-slate-200"
                              title="Copy Code"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </button>
                          ) : row.status === 'Open' ? (
                            <button
                              onClick={() => handleQuickResolveTicket(row.raw)}
                              className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded text-[10px] font-bold transition-all flex items-center gap-0.5 mx-auto active:scale-95 shadow-sm"
                            >
                              <span>Match</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-0.5">
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Settled</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {registryRecords.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-5 py-8 text-center text-slate-400">
                          <SearchCode className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-xs text-slate-700">No registry records found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Change search criteria parameters or input matching values to generate vouchers.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ==========================================
          GRAND SUCCESS MODAL (Oracle Success Alert UI)
         ========================================== */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white border-2 border-sky-600 rounded-xl shadow-2xl overflow-hidden relative animate-scale-up">

            <div className="bg-sky-700 px-6 py-5 text-white flex items-start gap-4">
              <div className="h-10 w-10 bg-sky-800 rounded-full border border-sky-500/30 flex items-center justify-center text-sky-200 shrink-0">
                <Check className="h-5.5 w-5.5 text-emerald-400 stroke-[3]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold tracking-tight">AP 3-Way Match Settled</h3>
                <p className="text-xs text-sky-200 mt-0.5">Audit transaction voucher successfully generated and updated in terminal database.</p>
              </div>
            </div>

            <div className="bg-slate-50 border-b border-slate-200 p-6 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">SYSTEM COMPLIANCE VOUCHER</span>
              <div className="inline-flex items-center gap-3 bg-white border-2 border-dashed border-slate-300 px-6 py-3 rounded-lg shadow-inner">
                <span className="font-mono text-2xl font-extrabold text-slate-800 tracking-wider">{generatedVoucher}</span>
                <button
                  onClick={() => handleCopyToClipboard(generatedVoucher)}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 text-xs font-bold transition-all ${copiedText
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 active:scale-95'
                    }`}
                >
                  {copiedText ? (
                    <><Check className="h-3.5 w-3.5 text-emerald-600" /><span>Copied!</span></>
                  ) : (
                    <><Copy className="h-3.5 w-3.5 text-slate-500" /><span>Copy Code</span></>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Matching Ledger Details</span>
              <div className="border border-slate-200 rounded overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[9px] w-1/3">Supplier Entity</td>
                      <td className="px-3.5 py-2 font-semibold text-slate-800">{receiptForm.supplier || 'Intel Corporate Services'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[9px]">Receipt Reference</td>
                      <td className="px-3.5 py-2 font-mono text-slate-800">{receiptForm.receiptNumber || 'REC-2026-90412'}</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[9px]">PO Number</td>
                      <td className="px-3.5 py-2 font-mono text-slate-800">{receiptForm.poNumber || 'PO-2026-44021'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[9px]">Invoice Reference</td>
                      <td className="px-3.5 py-2 font-mono text-slate-800">{invoiceForm.invoiceNumber || 'INV-2026-77891'}</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[9px]">Calculated Sales (USD)</td>
                      <td className="px-3.5 py-2 font-bold text-slate-800 font-mono">
                        ${(parseFloat(invoiceForm.totalSales) || 1250.00).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[9px]">Calculated VAT</td>
                      <td className="px-3.5 py-2 font-bold text-slate-800 font-mono text-amber-700">
                        ${(parseFloat(invoiceForm.totalVat) || 187.50).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-sky-50 border border-sky-100 rounded text-[11px] text-sky-800 leading-normal flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                <span>This transaction is fully recorded in the local ERP database. A print-friendly copy has been archived for compliance audits.</span>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  setShowMatchModal(false);
                  handleReset();
                }}
                className="px-4 py-2 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-300 shadow-sm active:scale-95 transition-all"
              >
                Reset Workstation
              </button>
              <button onClick={() => setShowMatchModal(false)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded active:scale-95 transition-all">Dismiss Voucher</button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          VOUCHER DETAIL AUDIT MODAL (Search / Click detail view)
         ========================================== */}
      {selectedVoucherDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white border-2 border-sky-600 rounded-xl shadow-2xl overflow-hidden relative animate-scale-up">

            <div className="bg-sky-700 px-6 py-5 text-white flex items-start gap-4">
              <div className="h-10 w-10 bg-sky-800 rounded-full border border-sky-500/30 flex items-center justify-center text-sky-200 shrink-0">
                <FileText className="h-5.5 w-5.5 text-sky-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold tracking-tight">Compliance Voucher Audit Details</h3>
                <p className="text-xs text-sky-200 mt-0.5">Database audit registry details for compliance and tracking.</p>
              </div>
              <button
                onClick={() => setSelectedVoucherDetails(null)}
                className="text-sky-200 hover:text-white font-bold text-sm transition-colors animate-hover-spin"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border-b border-slate-200 p-6 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">SYSTEM COMPLIANCE VOUCHER</span>
              <div className="inline-flex items-center gap-3 bg-white border-2 border-dashed border-slate-300 px-6 py-3 rounded-lg shadow-inner">
                <span className="font-mono text-2xl font-extrabold text-slate-800 tracking-wider">{selectedVoucherDetails.voucher}</span>
                <button
                  onClick={() => handleCopyToClipboard(selectedVoucherDetails.voucher)}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 text-xs font-bold transition-all ${copiedText
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 active:scale-95'
                    }`}
                >
                  {copiedText ? (
                    <><Check className="h-3.5 w-3.5 text-emerald-600" /><span>Copied!</span></>
                  ) : (
                    <><Copy className="h-3.5 w-3.5 text-slate-500" /><span>Copy Code</span></>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Matching Ledger Details</span>
              <div className="border border-slate-200 rounded overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[9px] w-1/3">Supplier Entity</td>
                      <td className="px-3.5 py-2 font-semibold text-slate-800">{selectedVoucherDetails.supplier}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[9px]">Receipt Reference</td>
                      <td className="px-3.5 py-2 font-mono text-slate-800">{selectedVoucherDetails.receiptNo}</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[9px]">Invoice Reference</td>
                      <td className="px-3.5 py-2 font-mono text-slate-800">{selectedVoucherDetails.invoiceNo}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[9px]">Match Value (USD)</td>
                      <td className="px-3.5 py-2 font-bold text-slate-800 font-mono">
                        ${selectedVoucherDetails.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[9px]">Calculated VAT (15%)</td>
                      <td className="px-3.5 py-2 font-bold text-slate-800 font-mono text-amber-700">
                        ${selectedVoucherDetails.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[9px]">Generated On</td>
                      <td className="px-3.5 py-2 font-semibold text-slate-600">{selectedVoucherDetails.timestamp}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-sky-50 border border-sky-100 rounded text-[11px] text-sky-800 leading-normal flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                <span>This transaction is fully recorded in the local SQLite database. A print-friendly copy has been archived for compliance audits.</span>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedVoucherDetails(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded active:scale-95 transition-all"
              >
                Close Audit Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
