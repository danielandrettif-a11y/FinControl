import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import {
  getMonthlyCreditCardExpenses, getMonthlyCryptoTopUps,
  getMonthlySpendingUsed, getMonthlySpendingRemaining,
  getSpendingPercent, getSpendingStatus,
} from '../utils/finance';
import { formatBrl, convertBrlToUsd, formatUsd } from '../utils/currency';
import { TrendingUp, CreditCard, Target, PiggyBank, FileText, BarChart3, CalendarClock, Calculator } from 'lucide-react';
import ConverterModal from '../components/ConverterModal';

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const MODULES = [
  { id: 'cards', name: 'Cartões', icon: <CreditCard size={24} />, desc: 'Crédito e Cripto', path: '/cartoes', featured: true },
  { id: 'overview', name: 'Visão Geral', icon: <BarChart3 size={24} />, desc: 'Resumo financeiro', soon: true },
  { id: 'calculator', name: 'Calculadora', icon: <Calculator size={24} />, desc: 'Conversão em tempo real', action: 'open_calculator' },
  { id: 'expenses', name: 'Gastos', icon: <TrendingUp size={24} />, desc: 'Controle de gastos', soon: true },
  { id: 'income', name: 'Receitas', icon: <PiggyBank size={24} />, desc: 'Fontes de renda', soon: true },
  { id: 'investments', name: 'Investimentos', icon: <TrendingUp size={24} />, desc: 'Carteira e rendimentos', soon: true },
  { id: 'goals', name: 'Metas', icon: <Target size={24} />, desc: 'Objetivos financeiros', soon: true },
  { id: 'planning', name: 'Planejamento', icon: <CalendarClock size={24} />, desc: 'Orçamento mensal', soon: true },
  { id: 'reports', name: 'Relatórios', icon: <FileText size={24} />, desc: 'Análises detalhadas', soon: true },
];

function getGreeting(): string {
  const h = now.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomePage() {
  const { settings, creditTransactions, cryptoTopUps } = useApp();
  const navigate = useNavigate();
  const [showCalculator, setShowCalculator] = useState(false);

  const creditExpenses = getMonthlyCreditCardExpenses(creditTransactions, currentMonth, currentYear);
  const cryptoTopUpsBrl = getMonthlyCryptoTopUps(cryptoTopUps, currentMonth, currentYear);
  const used = getMonthlySpendingUsed(creditExpenses, cryptoTopUpsBrl);
  const remaining = getMonthlySpendingRemaining(settings.monthlyLimit, creditExpenses, cryptoTopUpsBrl);
  const percent = getSpendingPercent(used, settings.monthlyLimit);
  const status = getSpendingStatus(percent);

  return (
    <div>
      <div className="dashboard-greeting">{getGreeting()} 👋</div>
      <div className="dashboard-greeting__sub">
        Aqui está seu resumo financeiro de hoje.
      </div>

      {/* Quick financial summary */}
      <div className="spending-limit">
        <div className="spending-limit__header">
          <div>
            <div className="spending-limit__label">Limite mensal</div>
            <div className="spending-limit__value">
              {formatBrl(used)} <span className="spending-limit__of">de {formatBrl(settings.monthlyLimit)}</span>
            </div>
          </div>
          <div className="spending-limit__remaining">
            <div className="spending-limit__remaining-label">Disponível</div>
            <div className="spending-limit__remaining-value" style={{ color: remaining >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {formatBrl(remaining)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {formatUsd(convertBrlToUsd(remaining, settings.exchangeRateUsdBrl))}
            </div>
          </div>
        </div>

        <div className="spending-limit__bar">
          <div
            className={`spending-limit__bar-fill ${status}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>

        <div className="spending-limit__breakdown">
          <div className="spending-limit__breakdown-item">
            <span className="spending-limit__breakdown-label">Cartões crédito</span>
            <span className="spending-limit__breakdown-value negative">-{formatBrl(creditExpenses)}</span>
          </div>
          <div className="spending-limit__breakdown-item">
            <span className="spending-limit__breakdown-label">Abastecimentos cripto</span>
            <span className="spending-limit__breakdown-value negative">-{formatBrl(cryptoTopUpsBrl)}</span>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="section-title">Módulos</div>
      <div className="dashboard-modules">
        {MODULES.map((mod) => (
          <div
            key={mod.id}
            className={`module-card ${mod.featured ? 'featured' : ''}`}
            onClick={() => {
              if (mod.path) navigate(mod.path);
              else if ((mod as any).action === 'open_calculator') setShowCalculator(true);
            }}
          >
            <div className="module-card__icon">{mod.icon}</div>
            <div className="module-card__name">{mod.name}</div>
            <div className="module-card__desc">{mod.desc}</div>
            {mod.featured && <div className="module-card__badge">Ativo</div>}
            {mod.soon && <div className="module-card__badge soon">Em breve</div>}
          </div>
        ))}
      </div>

      {showCalculator && <ConverterModal onClose={() => setShowCalculator(false)} />}
    </div>
  );
}
