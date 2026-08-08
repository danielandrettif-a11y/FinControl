import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface Rates {
  USDBRL: number;
  EURBRL: number;
  BTCBRL: number;
}

export default function ConverterModal({ onClose }: { onClose: () => void }) {
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState(false);

  // Values in string format to allow decimal typing
  const [values, setValues] = useState({
    btc: '',
    sats: '',
    usd: '',
    brl: '',
    eur: ''
  });

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL');
      const data = await res.json();
      if (data && data.USDBRL) {
        setRates({
          USDBRL: parseFloat(data.USDBRL.bid),
          EURBRL: parseFloat(data.EURBRL.bid),
          BTCBRL: parseFloat(data.BTCBRL.bid),
        });
      }
    } catch (e) {
      console.error('Failed to fetch rates', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleInputChange = (field: keyof typeof values, value: string) => {
    // allow empty, numbers, commas and dots
    if (value !== '' && !/^[0-9.,]*$/.test(value)) return;
    
    // Convert comma to dot for parsing
    const numericValue = parseFloat(value.replace(',', '.'));
    
    if (isNaN(numericValue) || !rates) {
      setValues({ ...values, [field]: value });
      return;
    }

    // Convert everything to BRL first as the base
    let baseBRL = 0;
    if (field === 'brl') baseBRL = numericValue;
    else if (field === 'usd') baseBRL = numericValue * rates.USDBRL;
    else if (field === 'eur') baseBRL = numericValue * rates.EURBRL;
    else if (field === 'btc') baseBRL = numericValue * rates.BTCBRL;
    else if (field === 'sats') baseBRL = (numericValue / 100000000) * rates.BTCBRL;

    // Now calculate all other fields from baseBRL
    const format = (num: number, maxDecimals = 2) => {
      if (num === 0) return '0';
      return parseFloat(num.toFixed(maxDecimals)).toString().replace('.', ',');
    };

    setValues({
      brl: field === 'brl' ? value : format(baseBRL, 2),
      usd: field === 'usd' ? value : format(baseBRL / rates.USDBRL, 2),
      eur: field === 'eur' ? value : format(baseBRL / rates.EURBRL, 2),
      btc: field === 'btc' ? value : format(baseBRL / rates.BTCBRL, 8),
      sats: field === 'sats' ? value : format((baseBRL / rates.BTCBRL) * 100000000, 0),
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div 
        className="modal" 
        style={{ 
          maxWidth: '400px', 
          padding: '0', 
          background: '#111318', 
          border: '1px solid #2A2E39', 
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)' 
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #1E2129' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#251E16', color: '#F7931A', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="14.01"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="16" y1="18" x2="16" y2="18.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line><line x1="16" y1="10" x2="16" y2="10.01"></line><line x1="12" y1="10" x2="12" y2="10.01"></line><line x1="8" y1="10" x2="8" y2="10.01"></line></svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#FFF' }}>Calculadora</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>BTC - SATS - USD - BRL - EUR</div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: '#1A1D24', 
              border: '1px solid #2A2E39', 
              color: '#888', 
              width: '32px', height: '32px', 
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Inputs */}
        <div style={{ padding: '0 24px' }}>
          {[
            { id: 'btc', label: 'BTC' },
            { id: 'sats', label: 'SATS' },
            { id: 'usd', label: 'USD' },
            { id: 'brl', label: 'BRL' },
            { id: 'eur', label: 'EUR' },
          ].map((field, idx, arr) => (
            <div 
              key={field.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '16px 0',
                borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #1E2129'
              }}
            >
              <div style={{ width: '60px', color: '#888', fontWeight: 600, fontSize: '0.9rem' }}>{field.label}</div>
              <input 
                type="text" 
                value={values[field.id as keyof typeof values]}
                onChange={(e) => handleInputChange(field.id as keyof typeof values, e.target.value)}
                placeholder="0"
                disabled={!rates}
                style={{ 
                  flex: 1, 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#FFF', 
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  outline: 'none',
                  fontFamily: 'monospace'
                }} 
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ background: '#0D0E12', padding: '12px 24px', borderTop: '1px solid #1E2129', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: '#888' }}>
          <button 
            onClick={fetchRates}
            disabled={loading}
            style={{ background: 'transparent', border: 'none', color: '#0066CC', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
          {rates ? (
            <div style={{ display: 'flex', gap: '12px' }}>
              <span>BTC/USD: ${(rates.BTCBRL / rates.USDBRL).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              <span>USD/BRL: R${rates.USDBRL.toFixed(2)}</span>
              <span>EUR/USD: ${(rates.EURBRL / rates.USDBRL).toFixed(4)}</span>
            </div>
          ) : (
            <span>Carregando cotações...</span>
          )}
        </div>

      </div>
    </div>
  );
}
