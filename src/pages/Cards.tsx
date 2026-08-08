import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import {
  getMonthlyCreditCardExpenses, getMonthlyCryptoTopUps, getMonthlyCryptoTopUpsUsd,
  getMonthlySpendingUsed, getMonthlySpendingRemaining,
  getSpendingPercent, getSpendingStatus,
  getCardMonthlyExpenses, getCryptoCardBalance,
  getFutureInstallments, MONTH_NAMES,
} from '../utils/finance';
import { formatBrl, formatUsd, convertBrlToUsd, convertUsdToBrl } from '../utils/currency';
import { Plus, CreditCard, Wallet, Calendar, ChevronRight, Settings } from 'lucide-react';
import AddCardModal from '../components/AddCardModal';
import AddTransactionModal from '../components/AddTransactionModal';
import AddCryptoCardModal from '../components/AddCryptoCardModal';
import CryptoTopUpModal from '../components/CryptoTopUpModal';
import SettingsModal from '../components/SettingsModal';

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

type Tab = 'credit' | 'crypto';

export default function CardsPage() {
  const {
    settings, creditCards, cryptoCards,
    creditTransactions, cryptoTopUps, cryptoTransactions,
  } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('credit');
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddCryptoCard, setShowAddCryptoCard] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleMonth = (key: string) => setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleCard = (key: string) => setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));

  // Calculations
  const creditExpenses = getMonthlyCreditCardExpenses(creditTransactions, currentMonth, currentYear);
  const cryptoTopUpsBrl = getMonthlyCryptoTopUps(cryptoTopUps, currentMonth, currentYear);
  const cryptoTopUpsUsd = getMonthlyCryptoTopUpsUsd(cryptoTopUps, currentMonth, currentYear);
  const used = getMonthlySpendingUsed(creditExpenses, cryptoTopUpsBrl);
  const remaining = getMonthlySpendingRemaining(settings.monthlyLimit, creditExpenses, cryptoTopUpsBrl);
  const percent = getSpendingPercent(used, settings.monthlyLimit);
  const status = getSpendingStatus(percent);
  const futureInstallments = getFutureInstallments(creditTransactions, currentMonth, currentYear);

  // Upcoming due dates
  const upcomingDues = creditCards
    .filter((c) => c.isActive)
    .map((c) => ({
      ...c,
      monthExpense: getCardMonthlyExpenses(creditTransactions, c.id, currentMonth, currentYear),
    }))
    .sort((a, b) => a.dueDay - b.dueDay);

  return (
    <div>
      {/* Title + Settings */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Cartões</h1>
        <button className="settings-inline" onClick={() => setShowSettings(true)}>
          <Settings size={12} /> Limite e Cotação
        </button>
      </div>

      {/* Spending Limit */}
      <div className="spending-limit">
        <div className="spending-limit__header">
          <div>
            <div className="spending-limit__label">Limite mensal de cartões</div>
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
            <span className="spending-limit__breakdown-label">Limite mensal</span>
            <span className="spending-limit__breakdown-value">{formatBrl(settings.monthlyLimit)}</span>
          </div>
          <div className="spending-limit__breakdown-item">
            <span className="spending-limit__breakdown-label">Cartões crédito</span>
            <span className="spending-limit__breakdown-value negative">-{formatBrl(creditExpenses)}</span>
          </div>
          <div className="spending-limit__breakdown-item">
            <span className="spending-limit__breakdown-label">Abastecimentos cripto</span>
            <span className="spending-limit__breakdown-value negative">-{formatBrl(cryptoTopUpsBrl)}</span>
          </div>
          <div className="spending-limit__breakdown-item">
            <span className="spending-limit__breakdown-label">Disponível</span>
            <span className="spending-limit__breakdown-value positive">{formatBrl(remaining)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tabs__tab ${tab === 'credit' ? 'active' : ''}`} onClick={() => setTab('credit')}>
          <CreditCard size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Crédito
        </button>
        <button className={`tabs__tab ${tab === 'crypto' ? 'active' : ''}`} onClick={() => setTab('crypto')}>
          <Wallet size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Cripto
        </button>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {tab === 'credit' ? (
          <>
            <button className="quick-action" onClick={() => setShowAddTx(true)}>
              <Plus size={16} /> Novo gasto
            </button>
            <button className="quick-action" onClick={() => setShowAddCard(true)}>
              <Plus size={16} /> Novo cartão
            </button>
          </>
        ) : (
          <>
            <button className="quick-action" onClick={() => setShowTopUp(true)}>
              <Plus size={16} /> Abastecer cripto
            </button>
            <button className="quick-action" onClick={() => setShowAddCryptoCard(true)}>
              <Plus size={16} /> Novo cartão cripto
            </button>
          </>
        )}
      </div>

      {/* Credit Tab */}
      {tab === 'credit' && (
        <>
          {/* Cards Carousel */}
          <div className="section-title">Meus Cartões</div>
          <div className="cards-carousel">
            {creditCards.filter(c => c.isActive).map((card) => {
              const expense = getCardMonthlyExpenses(creditTransactions, card.id, currentMonth, currentYear);
              return (
                <div
                  key={card.id}
                  className="credit-card-visual"
                  style={{ 
                    background: card.imageUrl ? `url(${card.imageUrl}) center/cover no-repeat` : `linear-gradient(135deg, ${card.color} 0%, ${card.gradientEnd || card.color} 100%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => navigate(`/cartoes/${card.id}`)}
                >
                  {!card.imageUrl ? (
                    <>
                      <div className="credit-card-visual__top">
                        <div>
                          <div className="credit-card-visual__name">{card.name}</div>
                          <div className="credit-card-visual__brand">{card.brand}</div>
                        </div>
                      </div>
                      <div className="credit-card-visual__chip" />
                      <div className="credit-card-visual__number">•••• •••• •••• {card.last4Digits}</div>
                    </>
                  ) : (
                    <div style={{ flex: 1 }} />
                  )}
                  <div className="credit-card-visual__bottom" style={card.imageUrl ? { background: 'rgba(0,0,0,0.6)', padding: '8px 12px', margin: '0 -20px -20px -20px', borderRadius: '0 0 16px 16px', backdropFilter: 'blur(4px)' } : {}}>
                    <div>
                      <div className="credit-card-visual__expense-label">Gasto neste mês</div>
                      <div className="credit-card-visual__expense">{formatBrl(expense)}</div>
                    </div>
                    <div>
                      <div className="credit-card-visual__due-label">Vencimento</div>
                      <div className="credit-card-visual__due">{String(card.dueDay).padStart(2, '0')}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            <button className="add-card-btn" onClick={() => setShowAddCard(true)}>
              <Plus size={32} />
              Adicionar cartão
            </button>
          </div>

          {/* Upcoming Invoices */}
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div className="section-title">
              <Calendar size={18} /> Próximos Vencimentos
            </div>
            <div className="card">
              {upcomingDues.map((card) => (
                <div
                  key={card.id}
                  className="list-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/cartoes/${card.id}`)}
                >
                  <div className="list-item__left">
                    <div className="list-item__icon" style={{ background: card.color + '22', color: card.color }}>
                      <CreditCard size={18} />
                    </div>
                    <div className="list-item__info">
                      <span className="list-item__title">{card.name}</span>
                      <span className="list-item__subtitle">Dia {String(card.dueDay).padStart(2, '0')}</span>
                    </div>
                  </div>
                  <div className="list-item__right">
                    <div className="list-item__amount">{formatBrl(card.monthExpense)}</div>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Future Installments */}
          {futureInstallments.length > 0 && (
            <div style={{ marginTop: 'var(--space-xl)' }}>
              <div className="section-title">📅 Parcelas Futuras</div>
            <div className="card">
              {futureInstallments.slice(0, 12).map((fi) => {
                const monthKey = `${fi.year}-${fi.month}`;
                const isExpandedMonth = expandedMonths[monthKey];
                const totalInstallmentsCount = fi.cards.reduce((sum, c) => sum + c.items.length, 0);
                
                return (
                  <div key={monthKey} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: isExpandedMonth ? 'var(--space-md)' : 0 }}>
                    <div 
                      className="list-item" 
                      style={{ cursor: 'pointer', borderBottom: 'none' }} 
                      onClick={() => toggleMonth(monthKey)}
                    >
                      <div className="list-item__left">
                        <div className="list-item__info">
                          <span className="list-item__title">{MONTH_NAMES[fi.month]} {fi.year}</span>
                          <span className="list-item__subtitle">{totalInstallmentsCount} parcela{totalInstallmentsCount > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="list-item__right">
                        <div className="list-item__amount">{formatBrl(fi.total)}</div>
                      </div>
                    </div>
                    
                    {isExpandedMonth && (
                      <div style={{ paddingLeft: 'var(--space-xl)', paddingRight: 'var(--space-sm)' }}>
                        {fi.cards.map((cardGroup) => {
                          const c = creditCards.find(cc => cc.id === cardGroup.cardId);
                          if (!c) return null;
                          const cardKey = `${monthKey}-${cardGroup.cardId}`;
                          const isExpandedCard = expandedCards[cardKey];
                          
                          return (
                            <div key={cardKey}>
                              <div 
                                className="list-item" 
                                style={{ cursor: 'pointer', background: 'var(--bg-elevated)', borderRadius: '8px', padding: 'var(--space-sm) var(--space-md)', marginTop: 'var(--space-xs)' }}
                                onClick={() => toggleCard(cardKey)}
                              >
                                <div className="list-item__left">
                                  <div className="list-item__info">
                                    <span className="list-item__title" style={{ fontSize: '0.9rem' }}>{c.name}</span>
                                    <span className="list-item__subtitle">{cardGroup.items.length} parcela{cardGroup.items.length > 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                                <div className="list-item__right">
                                  <div className="list-item__amount" style={{ fontSize: '0.9rem' }}>{formatBrl(cardGroup.total)}</div>
                                </div>
                              </div>
                              
                              {isExpandedCard && (
                                <div style={{ paddingLeft: 'var(--space-md)', marginTop: 'var(--space-xs)', borderLeft: `2px solid ${c.color}`, marginLeft: 'var(--space-sm)' }}>
                                  {cardGroup.items.map((item) => (
                                    <div key={item.id} className="list-item" style={{ padding: 'var(--space-xs) 0', border: 'none' }}>
                                      <div className="list-item__left">
                                        <div className="list-item__info">
                                          <span className="list-item__title" style={{ fontSize: '0.85rem' }}>{item.description}</span>
                                          <span className="list-item__subtitle">{item.currentInstallment}/{item.totalInstallments}</span>
                                        </div>
                                      </div>
                                      <div className="list-item__right">
                                        <div className="list-item__amount" style={{ fontSize: '0.85rem' }}>{formatBrl(item.amount)}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </>
      )}

      {/* Crypto Tab */}
      {tab === 'crypto' && (
        <>
          {/* Crypto Summary */}
          <div className="crypto-summary">
            <div className="crypto-summary__row">
              <span className="crypto-summary__label">Limite mensal</span>
              <div className="crypto-summary__values">
                <div className="crypto-summary__brl">{formatBrl(settings.monthlyLimit)}</div>
              </div>
            </div>
            <div className="crypto-summary__row">
              <span className="crypto-summary__label">Cartões tradicionais</span>
              <div className="crypto-summary__values">
                <div className="crypto-summary__brl" style={{ color: 'var(--red)' }}>-{formatBrl(creditExpenses)}</div>
              </div>
            </div>
            <div className="crypto-summary__row">
              <span className="crypto-summary__label">Disponível p/ abastecimento</span>
              <div className="crypto-summary__values">
                <div className="crypto-summary__brl">{formatBrl(remaining + cryptoTopUpsBrl)}</div>
                <div className="crypto-summary__usd">{formatUsd(convertBrlToUsd(remaining + cryptoTopUpsBrl, settings.exchangeRateUsdBrl))}</div>
              </div>
            </div>
            <div className="crypto-summary__row">
              <span className="crypto-summary__label">Já abastecido este mês</span>
              <div className="crypto-summary__values">
                <div className="crypto-summary__brl" style={{ color: 'var(--orange)' }}>-{formatBrl(cryptoTopUpsBrl)}</div>
                <div className="crypto-summary__usd">{formatUsd(cryptoTopUpsUsd)}</div>
              </div>
            </div>
            <div className="crypto-summary__row">
              <span className="crypto-summary__label">Ainda disponível</span>
              <div className="crypto-summary__values">
                <div className="crypto-summary__brl" style={{ color: 'var(--green)' }}>{formatBrl(remaining)}</div>
                <div className="crypto-summary__usd">{formatUsd(convertBrlToUsd(remaining, settings.exchangeRateUsdBrl))}</div>
              </div>
            </div>
          </div>

          {/* Crypto Cards */}
          <div className="section-title">Meus Cartões Cripto</div>
          <div className="cards-carousel">
            {cryptoCards.filter(c => c.isActive).map((card) => {
              const balance = getCryptoCardBalance(card.id, cryptoTopUps, cryptoTransactions);
              const monthTopUps = cryptoTopUps
                .filter(t => t.cryptoCardId === card.id && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
                .reduce((s, t) => s + t.amountUsd, 0);

              return (
                <div
                  key={card.id}
                  className="crypto-card-visual"
                  style={{ 
                    background: card.imageUrl ? `url(${card.imageUrl}) center/cover no-repeat` : `linear-gradient(135deg, ${card.color} 0%, ${card.gradientEnd || card.color} 100%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => navigate(`/cartoes/cripto/${card.id}`)}
                >
                  {!card.imageUrl ? (
                    <div className="crypto-card-visual__top">
                      <div className="crypto-card-visual__name">{card.name}</div>
                      <div className="crypto-card-visual__type">Crypto</div>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }} />
                  )}
                  <div className="crypto-card-visual__bottom" style={card.imageUrl ? { background: 'rgba(0,0,0,0.6)', padding: '8px 12px', margin: '0 -20px -20px -20px', borderRadius: '0 0 16px 16px', backdropFilter: 'blur(4px)' } : {}}>
                    <div className="crypto-card-visual__balance-label">Saldo</div>
                    <div className="crypto-card-visual__balance-usd">{formatUsd(balance)}</div>
                    <div className="crypto-card-visual__balance-brl">{formatBrl(convertUsdToBrl(balance, settings.exchangeRateUsdBrl))}</div>
                    {monthTopUps > 0 && (
                      <>
                        <div className="crypto-card-visual__topup-label">Abastecido no mês</div>
                        <div className="crypto-card-visual__topup-value">{formatUsd(monthTopUps)}</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <button className="add-card-btn" onClick={() => setShowAddCryptoCard(true)}>
              <Plus size={32} />
              Adicionar cartão cripto
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      {showAddCard && <AddCardModal onClose={() => setShowAddCard(false)} />}
      {showAddCryptoCard && <AddCryptoCardModal onClose={() => setShowAddCryptoCard(false)} />}
      {showAddTx && <AddTransactionModal onClose={() => setShowAddTx(false)} />}
      {showTopUp && <CryptoTopUpModal onClose={() => setShowTopUp(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
