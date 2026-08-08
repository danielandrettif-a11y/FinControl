import { useState, useEffect } from 'react';
import { useApp } from '../App';
import type { CryptoTopUp } from '../types';
import { convertUsdToBrl } from '../utils/currency';

export default function CryptoTopUpModal({ onClose, defaultCardId }: { onClose: () => void, defaultCardId?: string }) {
  const { cryptoCards, settings, setCryptoTopUps } = useApp();
  const [cardId, setCardId] = useState(defaultCardId || (cryptoCards[0]?.id || ''));
  const [amountUsd, setAmountUsd] = useState('');
  const [amountBrl, setAmountBrl] = useState('0');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const usd = parseFloat(amountUsd) || 0;
    setAmountBrl(convertUsdToBrl(usd, settings.exchangeRateUsdBrl).toFixed(2));
  }, [amountUsd, settings.exchangeRateUsdBrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountUsd || !cardId) return;

    const topUp: CryptoTopUp = {
      id: 'topup-' + Date.now(),
      cryptoCardId: cardId,
      amountUsd: parseFloat(amountUsd),
      amountBrl: parseFloat(amountBrl),
      exchangeRate: settings.exchangeRateUsdBrl,
      date: new Date(date).toISOString(),
    };

    setCryptoTopUps(prev => [...prev, topUp]);
    onClose();
  };

  const activeCards = cryptoCards.filter(c => c.isActive);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__handle" />
        <div className="modal__title">Abastecer Cartão Cripto</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Cartão Cripto</label>
            <select className="form-select" value={cardId} onChange={e => setCardId(e.target.value)} required>
              {activeCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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

          <div className="form-group">
            <div className="stat" style={{ background: 'var(--bg-elevated)', border: 'none' }}>
              <div className="stat__label">Equivalente em BRL (Cotação R$ {settings.exchangeRateUsdBrl})</div>
              <div className="stat__value" style={{ color: 'var(--orange)' }}>R$ {amountBrl}</div>
              <div className="stat__sub">Este valor reduzirá o seu limite mensal geral.</div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary">Adicionar Saldo</button>
        </form>
      </div>
    </div>
  );
}
