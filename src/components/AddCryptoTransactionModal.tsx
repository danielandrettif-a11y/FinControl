import { useState } from 'react';
import { useApp } from '../App';
import type { CryptoTransaction } from '../types';

export default function AddCryptoTransactionModal({ onClose, defaultCardId }: { onClose: () => void, defaultCardId?: string }) {
  const { cryptoCards, categories, setCryptoTransactions } = useApp();
  const [description, setDescription] = useState('');
  const [amountUsd, setAmountUsd] = useState('');
  const [cardId, setCardId] = useState(defaultCardId || (cryptoCards[0]?.id || ''));
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amountUsd || !cardId) return;

    const newTx: CryptoTransaction = {
      id: 'ctx-' + Date.now(),
      cryptoCardId: cardId,
      description: description.trim(),
      categoryId,
      amountUsd: parseFloat(amountUsd),
      date: new Date(date).toISOString(),
    };

    setCryptoTransactions(prev => [...prev, newTx]);
    onClose();
  };

  const activeCards = cryptoCards.filter(c => c.isActive);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__handle" />
        <div className="modal__title">Novo Gasto (Cripto)</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Descrição *</label>
            <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Netflix" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor (USD) *</label>
              <input className="form-input" type="number" step="0.01" value={amountUsd} onChange={e => setAmountUsd(e.target.value)} placeholder="0.00" required />
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

          <button type="submit" className="btn btn-primary">Adicionar Gasto Cripto</button>
        </form>
      </div>
    </div>
  );
}
