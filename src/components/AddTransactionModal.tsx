import { useState } from 'react';
import { useApp } from '../App';
import type { CreditCardTransaction } from '../types';

export default function AddTransactionModal({ onClose, defaultCardId, editTransaction }: { onClose: () => void, defaultCardId?: string, editTransaction?: CreditCardTransaction }) {
  const { creditCards, categories, setCreditTransactions } = useApp();
  const [description, setDescription] = useState(editTransaction?.description || '');
  const [amount, setAmount] = useState(editTransaction ? String(editTransaction.amount) : '');
  const [cardId, setCardId] = useState(editTransaction?.creditCardId || defaultCardId || (creditCards[0]?.id || ''));
  const [categoryId, setCategoryId] = useState(editTransaction?.categoryId || categories[0]?.id || '');
  const [date, setDate] = useState(editTransaction ? new Date(editTransaction.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [installments, setInstallments] = useState(editTransaction ? String(editTransaction.installments) : '1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !cardId) return;

    const newTx: CreditCardTransaction = {
      id: editTransaction ? editTransaction.id : 'tx-' + Date.now(),
      creditCardId: cardId,
      description: description.trim(),
      categoryId,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      installments: parseInt(installments) || 1,
      notes: editTransaction?.notes || '',
    };

    if (editTransaction) {
      setCreditTransactions(prev => prev.map(t => t.id === editTransaction.id ? newTx : t));
    } else {
      setCreditTransactions(prev => [...prev, newTx]);
      
      const token = localStorage.getItem('fincontrol_token');
      try {
        await fetch('/api/transactions/credit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newTx)
        });
      } catch (err) {
        console.error('Failed to save transaction to DB', err);
      }
    }
    onClose();
  };

  const activeCards = creditCards.filter(c => c.isActive);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__handle" />
        <div className="modal__title">{editTransaction ? 'Editar Gasto' : 'Novo Gasto (Crédito)'}</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Descrição *</label>
            <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Supermercado" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor (R$) *</label>
              <input className="form-input" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label className="form-label">Data</label>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cartão</label>
              <select className="form-select" value={cardId} onChange={e => setCardId(e.target.value)} required>
                {activeCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Parcelas</label>
            <select className="form-select" value={installments} onChange={e => setInstallments(e.target.value)}>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x</option>)}
            </select>
          </div>

          <button type="submit" className="btn btn-primary">{editTransaction ? 'Salvar Alterações' : 'Adicionar Gasto'}</button>
        </form>
      </div>
    </div>
  );
}
