import { useState, createContext, useContext } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, CreditCard, Plus, BarChart3, Menu, Settings } from 'lucide-react';
import type {
  UserSettings, CreditCard as CreditCardType, CryptoCard,
  CreditCardTransaction, CryptoTopUp, CryptoTransaction, Category,
} from './types';
import {
  DEFAULT_SETTINGS, DEFAULT_CATEGORIES,
  INITIAL_CREDIT_CARDS, INITIAL_CRYPTO_CARDS,
  INITIAL_CREDIT_TRANSACTIONS, INITIAL_CRYPTO_TOPUPS, INITIAL_CRYPTO_TRANSACTIONS,
} from './data';
import { generateInstallments } from './utils/finance';
import HomePage from './pages/Home';
import CardsPage from './pages/Cards';
import CardDetailPage from './pages/CardDetail';
import CryptoDetailPage from './pages/CryptoDetail';
import LoginPage from './pages/Login';

// ===== Context (ponytail: one context, no zustand) =====
export interface AppState {
  settings: UserSettings;
  setSettings: (s: UserSettings) => void;
  creditCards: CreditCardType[];
  setCreditCards: React.Dispatch<React.SetStateAction<CreditCardType[]>>;
  cryptoCards: CryptoCard[];
  setCryptoCards: React.Dispatch<React.SetStateAction<CryptoCard[]>>;
  creditTransactions: CreditCardTransaction[];
  rawCreditTransactions: CreditCardTransaction[];
  setCreditTransactions: React.Dispatch<React.SetStateAction<CreditCardTransaction[]>>;
  cryptoTopUps: CryptoTopUp[];
  setCryptoTopUps: React.Dispatch<React.SetStateAction<CryptoTopUp[]>>;
  cryptoTransactions: CryptoTransaction[];
  setCryptoTransactions: React.Dispatch<React.SetStateAction<CryptoTransaction[]>>;
  categories: Category[];
}

export const AppContext = createContext<AppState | null>(null);
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppContext');
  return ctx;
};

// ===== Expand installments into individual monthly entries =====
function expandTransactions(transactions: CreditCardTransaction[]): CreditCardTransaction[] {
  return transactions.flatMap((t) =>
    t.installments > 1 ? generateInstallments(t) : [t]
  );
}

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [cryptoCards, setCryptoCards] = useState<CryptoCard[]>([]);
  const [rawTransactions, setRawTransactions] = useState<CreditCardTransaction[]>([]);
  const [cryptoTopUps, setCryptoTopUps] = useState<CryptoTopUp[]>([]);
  const [cryptoTransactions, setCryptoTransactions] = useState<CryptoTransaction[]>([]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('fincontrol_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch('/api/data', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        if (data.settings) setSettings(data.settings);
        if (data.creditCards) setCreditCards(data.creditCards);
        if (data.cryptoCards) setCryptoCards(data.cryptoCards);
        // Map transactions from credit cards if they exist
        const allTx = data.creditCards ? data.creditCards.flatMap((c: any) => c.transactions) : [];
        setRawTransactions(allTx);
        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem('fincontrol_token');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Expand installments on the fly
  const creditTransactions = expandTransactions(rawTransactions);

  if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;

  // Import locally to avoid cyclic dependencies or use it directly
  if (!isAuthenticated && location.pathname !== '/login') {
    return <LoginPage />;
  }

  const ctx: AppState = {
    settings, setSettings,
    creditCards, setCreditCards,
    cryptoCards, setCryptoCards,
    creditTransactions,
    rawCreditTransactions: rawTransactions,
    setCreditTransactions: setRawTransactions,
    cryptoTopUps, setCryptoTopUps,
    cryptoTransactions, setCryptoTransactions,
    categories: DEFAULT_CATEGORIES,
  };

  const isHome = location.pathname === '/';
  const isCards = location.pathname.startsWith('/cartoes');

  return (
    <AppContext.Provider value={ctx}>
      <div className="app">
        {/* Header */}
        <header className="app-header">
          <div className="app-header__logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="app-header__logo-icon">💰</div>
            <span>FinControl</span>
          </div>

          <nav className="app-header__nav">
            <NavLink to="/" className={({ isActive }) => `app-header__nav-link ${isActive ? 'active' : ''}`}>
              Início
            </NavLink>
            <NavLink to="/cartoes" className={({ isActive }) => `app-header__nav-link ${isActive ? 'active' : ''}`}>
              Cartões
            </NavLink>
          </nav>

          <div className="app-header__actions">
            <button className="app-header__btn" title="Configurações">
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="app-content">
          <div className="container" style={{ paddingTop: 'var(--space-lg)' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cartoes" element={<CardsPage />} />
              <Route path="/cartoes/:id" element={<CardDetailPage />} />
              <Route path="/cartoes/cripto/:id" element={<CryptoDetailPage />} />
            </Routes>
          </div>
        </main>

        {/* Bottom Navigation (Mobile) */}
        <nav className="bottom-nav">
          <NavLink to="/" className={({ isActive }) => `bottom-nav__item ${isActive && isHome ? 'active' : ''}`}>
            <HomeIcon size={22} />
            <span>Início</span>
          </NavLink>
          <NavLink to="/cartoes" className={() => `bottom-nav__item ${isCards ? 'active' : ''}`}>
            <CreditCard size={22} />
            <span>Cartões</span>
          </NavLink>
          <button className="bottom-nav__add" onClick={() => navigate('/cartoes')}>
            <Plus size={24} />
          </button>
          <NavLink to="/" className="bottom-nav__item">
            <BarChart3 size={22} />
            <span>Relatórios</span>
          </NavLink>
          <NavLink to="/" className="bottom-nav__item">
            <Menu size={22} />
            <span>Mais</span>
          </NavLink>
        </nav>
      </div>
    </AppContext.Provider>
  );
}
