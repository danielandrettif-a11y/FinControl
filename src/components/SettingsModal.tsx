import { useState } from 'react';
import { useApp } from '../App';
import { RefreshCw } from 'lucide-react';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, setSettings } = useApp();
  const [limit, setLimit] = useState(settings.monthlyLimit.toString());
  const [rate, setRate] = useState(settings.exchangeRateUsdBrl.toString());
  const [loadingRate, setLoadingRate] = useState(false);

  const fetchRate = async () => {
    setLoadingRate(true);
    try {
      const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
      const data = await res.json();
      if (data?.USDBRL?.bid) {
        setRate(parseFloat(data.USDBRL.bid).toFixed(2));
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao buscar cotação. Verifique sua conexão.');
    } finally {
      setLoadingRate(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLimit = parseFloat(limit);
    const newRate = parseFloat(rate);

    if (!isNaN(newLimit) && !isNaN(newRate)) {
      setSettings({
        monthlyLimit: newLimit,
        exchangeRateUsdBrl: newRate,
      });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__handle" />
        <div className="modal__title">Configurações</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Limite Mensal Geral (R$)</label>
            <input className="form-input" type="number" step="0.01" value={limit} onChange={e => setLimit(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Cotação Dólar (R$)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="form-input" type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} required />
              <button 
                type="button" 
                className="btn" 
                onClick={fetchRate} 
                disabled={loadingRate}
                style={{ padding: '0 var(--space-md)', background: 'var(--bg-elevated)', color: 'var(--text-color)' }}
                title="Puxar cotação em tempo real"
              >
                <RefreshCw size={18} className={loadingRate ? 'spin' : ''} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Salvar Configurações</button>
        </form>
      </div>
    </div>
  );
}
