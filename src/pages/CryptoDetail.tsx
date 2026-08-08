import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { getCryptoCardBalance, getMonthlyCryptoExpenses } from '../utils/finance';
import { formatBrl, formatUsd, convertUsdToBrl } from '../utils/currency';
import { ArrowLeft, Plus } from 'lucide-react';
import CryptoTopUpModal from '../components/CryptoTopUpModal';
import AddCryptoTransactionModal from '../components/AddCryptoTransactionModal';

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

export default function CryptoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cryptoCards, setCryptoCards, cryptoTopUps, cryptoTransactions, settings } = useApp();

  const card = cryptoCards.find((c) => c.id === id);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);

  if (!card) {
    return (
      <div>
        <button className="back-btn" onClick={() => navigate('/cartoes')}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <div className="empty-state__title">Cartão não encontrado</div>
        </div>
      </div>
    );
  }

  const balance = getCryptoCardBalance(card.id, cryptoTopUps, cryptoTransactions);
  const monthExpenses = getMonthlyCryptoExpenses(cryptoTransactions, card.id, currentMonth, currentYear);
  const monthTopUps = cryptoTopUps
    .filter(t => t.cryptoCardId === card.id && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear);
  const monthTopUpUsd = monthTopUps.reduce((s, t) => s + t.amountUsd, 0);
  const monthTopUpBrl = monthTopUps.reduce((s, t) => s + t.amountBrl, 0);

  // History: merge topups and transactions, sort by date desc
  const history = [
    ...cryptoTopUps
      .filter(t => t.cryptoCardId === card.id)
      .map(t => ({ type: 'topup' as const, date: t.date, description: 'Abastecimento', amountUsd: t.amountUsd, id: t.id })),
    ...cryptoTransactions
      .filter(t => t.cryptoCardId === card.id)
      .map(t => ({ type: 'expense' as const, date: t.date, description: t.description, amountUsd: t.amountUsd, id: t.id })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // const getCategoryIcon = (catId: string) => categories.find(c => c.id === catId)?.icon || '📦';

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/cartoes')}>
        <ArrowLeft size={18} /> Cartões
      </button>

      {/* Card Visual */}
      <div className="detail-card-wrapper">
        <div
          className="crypto-card-visual"
          style={{
            background: card.imageUrl ? `url(${card.imageUrl}) center/cover no-repeat` : `linear-gradient(135deg, ${card.color} 0%, ${card.gradientEnd || card.color} 100%)`,
            maxWidth: 420,
            cursor: 'default',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
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
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat">
          <div className="stat__label">Saldo atual</div>
          <div className="stat__value">{formatUsd(balance)}</div>
          <div className="stat__sub">{formatBrl(convertUsdToBrl(balance, settings.exchangeRateUsdBrl))}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Abastecido neste mês</div>
          <div className="stat__value" style={{ color: 'var(--green)' }}>{formatUsd(monthTopUpUsd)}</div>
          <div className="stat__sub">{formatBrl(monthTopUpBrl)}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Gasto neste mês</div>
          <div className="stat__value" style={{ color: 'var(--red)' }}>{formatUsd(monthExpenses)}</div>
          <div className="stat__sub">{formatBrl(convertUsdToBrl(monthExpenses, settings.exchangeRateUsdBrl))}</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <button className="quick-action" onClick={() => setShowTopUp(true)}>
          <Plus size={16} /> Adicionar saldo
        </button>
        <button className="quick-action" onClick={() => setShowAddTx(true)}>
          <Plus size={16} /> Novo gasto
        </button>
      </div>

      {/* History */}
      <div className="section-title">📋 Histórico</div>
      <div className="card">
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📄</div>
            <div className="empty-state__title">Nenhum registro</div>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="list-item">
              <div className="list-item__left">
                <div className="list-item__icon" style={{
                  background: item.type === 'topup' ? 'var(--green-soft)' : 'var(--bg-elevated)',
                }}>
                  {item.type === 'topup' ? '💰' : '🛒'}
                </div>
                <div className="list-item__info">
                  <span className="list-item__title">{item.description}</span>
                  <span className="list-item__subtitle">
                    {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className="list-item__right">
                <div className={`list-item__amount ${item.type === 'topup' ? 'positive' : 'negative'}`}>
                  {item.type === 'topup' ? '+' : '-'}{formatUsd(item.amountUsd)}
                </div>
                <div className="list-item__secondary">
                  {formatBrl(convertUsdToBrl(item.amountUsd, settings.exchangeRateUsdBrl))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Card */}
      <div style={{ marginTop: 'var(--space-2xl)', padding: '0 var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
        <button 
          className="btn" 
          style={{ width: '100%', background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)' }}
          onClick={() => {
            if (window.confirm('Tem certeza que deseja apagar este cartão? Isso o esconderá da sua lista.')) {
              setCryptoCards(prev => prev.map(c => c.id === card.id ? { ...c, isActive: false } : c));
              navigate('/cartoes');
            }
          }}
        >
          Apagar Cartão
        </button>
      </div>

      {showTopUp && <CryptoTopUpModal onClose={() => setShowTopUp(false)} defaultCardId={card.id} />}
      {showAddTx && <AddCryptoTransactionModal onClose={() => setShowAddTx(false)} defaultCardId={card.id} />}
    </div>
  );
}
