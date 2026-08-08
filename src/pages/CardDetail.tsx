import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { getCardMonthlyExpenses, MONTH_NAMES } from '../utils/finance';
import { formatBrl } from '../utils/currency';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, CreditCard, Edit2, Trash2 } from 'lucide-react';
import AddTransactionModal from '../components/AddTransactionModal';

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { creditCards, setCreditCards, creditTransactions, rawCreditTransactions, setCreditTransactions, categories } = useApp();

  const card = creditCards.find((c) => c.id === id);
  const [showAddTx, setShowAddTx] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);

  const handleDeleteTx = (tx: any) => {
    if (window.confirm('Tem certeza que deseja excluir este gasto?')) {
      const baseId = tx.parentTransactionId || tx.id;
      setCreditTransactions(prev => prev.filter(t => t.id !== baseId));
    }
  };

  const handleEditTx = (tx: any) => {
    const baseId = tx.parentTransactionId || tx.id;
    const baseTx = rawCreditTransactions.find(t => t.id === baseId);
    if (baseTx) setEditingTx(baseTx);
  };

  // Invoice month navigation
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

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

  const monthExpense = getCardMonthlyExpenses(creditTransactions, card.id, viewMonth, viewYear);
  const limitUsed = monthExpense;
  const limitAvailable = card.totalLimit - limitUsed;

  // Transactions for this card in viewed month
  const monthTransactions = creditTransactions
    .filter((t) => t.creditCardId === card.id)
    .filter((t) => {
      const d = new Date(t.date);
      if (t.currentInstallment) {
        const baseDate = new Date(t.date);
        const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + (t.currentInstallment - 1), 1);
        return targetDate.getMonth() === viewMonth && targetDate.getFullYear() === viewYear;
      }
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Future installments for this card
  const futureInstallments: { month: number; year: number; total: number; items: typeof monthTransactions }[] = [];
  const installmentTxs = creditTransactions.filter(
    (t) => t.creditCardId === card.id && t.currentInstallment && t.totalInstallments && t.currentInstallment < t.totalInstallments
  );

  installmentTxs.forEach((t) => {
    const baseDate = new Date(t.date);
    for (let i = t.currentInstallment!; i < t.totalInstallments!; i++) {
      const futureDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const m = futureDate.getMonth();
      const y = futureDate.getFullYear();
      let entry = futureInstallments.find((e) => e.month === m && e.year === y);
      if (!entry) {
        entry = { month: m, year: y, total: 0, items: [] };
        futureInstallments.push(entry);
      }
      entry.total += t.amount;
      entry.items.push(t);
    }
  });
  futureInstallments.sort((a, b) => a.year - b.year || a.month - b.month);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || catId;
  const getCategoryIcon = (catId: string) => categories.find(c => c.id === catId)?.icon || '📦';

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/cartoes')}>
        <ArrowLeft size={18} /> Cartões
      </button>

      {/* Card Visual (large) */}
      <div className="detail-card-wrapper">
        <div
          className="credit-card-visual"
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
              <div className="credit-card-visual__expense">{formatBrl(monthExpense)}</div>
            </div>
            <div>
              <div className="credit-card-visual__due-label">Vencimento</div>
              <div className="credit-card-visual__due">{String(card.dueDay).padStart(2, '0')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat">
          <div className="stat__label">Gasto atual</div>
          <div className="stat__value">{formatBrl(limitUsed)}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Limite utilizado</div>
          <div className="stat__value">{formatBrl(limitUsed)}</div>
          <div className="stat__sub">de {formatBrl(card.totalLimit)}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Limite disponível</div>
          <div className="stat__value" style={{ color: 'var(--green)' }}>{formatBrl(limitAvailable)}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Fechamento / Vencimento</div>
          <div className="stat__value">
            {String(card.closingDay).padStart(2, '0')} / {String(card.dueDay).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Quick action */}
      <div className="quick-actions">
        <button className="quick-action" onClick={() => setShowAddTx(true)}>
          <Plus size={16} /> Novo gasto
        </button>
      </div>

      {/* Invoice navigation */}
      <div className="section-title">
        <CreditCard size={18} /> Fatura
      </div>
      <div className="invoice-nav">
        <button className="invoice-nav__btn" onClick={prevMonth}>
          <ChevronLeft size={18} />
        </button>
        <div className="invoice-nav__month">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </div>
        <button className="invoice-nav__btn" onClick={nextMonth}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Transactions list */}
      <div className="card">
        {monthTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📄</div>
            <div className="empty-state__title">Nenhum lançamento</div>
            <div className="empty-state__text">Nenhuma transação neste mês.</div>
          </div>
        ) : (
          monthTransactions.map((tx) => (
            <div key={tx.id} className="list-item">
              <div className="list-item__left">
                <div className="list-item__icon" style={{ background: 'var(--bg-elevated)' }}>
                  {getCategoryIcon(tx.categoryId)}
                </div>
                <div className="list-item__info">
                  <span className="list-item__title">{tx.description}</span>
                  <span className="list-item__subtitle">
                    {getCategoryName(tx.categoryId)}
                    {tx.currentInstallment && ` • ${tx.currentInstallment}/${tx.totalInstallments}`}
                  </span>
                </div>
              </div>
              <div className="list-item__right" style={{ alignItems: 'flex-end', gap: '4px' }}>
                <div className="list-item__amount negative">-{formatBrl(tx.amount)}</div>
                <div className="list-item__secondary">
                  {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={(e) => { e.stopPropagation(); handleEditTx(tx); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTx(tx); }} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total */}
      {monthTransactions.length > 0 && (
        <div style={{ textAlign: 'right', marginTop: 'var(--space-sm)', padding: '0 var(--space-md)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total: </span>
          <span style={{ fontSize: '1rem', fontWeight: 700 }}>{formatBrl(monthExpense)}</span>
        </div>
      )}

      {/* Future Installments */}
      {futureInstallments.length > 0 && (
        <div style={{ marginTop: 'var(--space-xl)' }}>
          <div className="section-title">📅 Parcelas Futuras</div>
          <div className="card">
            {futureInstallments.slice(0, 6).map((fi) => (
              <div key={`${fi.year}-${fi.month}`} className="list-item">
                <div className="list-item__left">
                  <div className="list-item__info">
                    <span className="list-item__title">{MONTH_NAMES[fi.month]} {fi.year}</span>
                    <span className="list-item__subtitle">{fi.items.length} parcela{fi.items.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="list-item__right">
                  <div className="list-item__amount">{formatBrl(fi.total)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Card */}
      <div style={{ marginTop: 'var(--space-2xl)', padding: '0 var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
        <button 
          className="btn" 
          style={{ width: '100%', background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)' }}
          onClick={() => {
            if (window.confirm('Tem certeza que deseja apagar este cartão? Isso o esconderá da sua lista.')) {
              setCreditCards(prev => prev.map(c => c.id === card.id ? { ...c, isActive: false } : c));
              navigate('/cartoes');
            }
          }}
        >
          Apagar Cartão
        </button>
      </div>

      {showAddTx && <AddTransactionModal onClose={() => setShowAddTx(false)} defaultCardId={card.id} />}
      {editingTx && <AddTransactionModal onClose={() => setEditingTx(null)} defaultCardId={card.id} editTransaction={editingTx} />}
    </div>
  );
}
