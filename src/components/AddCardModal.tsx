import { useState } from 'react';
import { useApp } from '../App';
import type { CreditCard } from '../types';

const COLORS = ['#820AD1', '#0075EB', '#FF6B35', '#003399', '#EF4444', '#22C55E', '#000000', '#6366F1', '#EC4899'];
const BRANDS: CreditCard['brand'][] = ['visa', 'mastercard', 'elo', 'amex', 'other'];

export default function AddCardModal({ onClose }: { onClose: () => void }) {
  const { setCreditCards } = useApp();
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [brand, setBrand] = useState<CreditCard['brand']>('visa');
  const [last4, setLast4] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [totalLimit, setTotalLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCard: CreditCard = {
      id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      name: name.trim(),
      institution: institution.trim() || name.trim(),
      brand,
      last4Digits: last4 || '0000',
      color,
      totalLimit: parseFloat(totalLimit) || 1000,
      closingDay: parseInt(closingDay) || 1,
      dueDay: parseInt(dueDay) || 10,
      isActive: true,
      imageUrl,
    };

    setCreditCards((prev) => [...prev, newCard]);
    
    const token = localStorage.getItem('fincontrol_token');
    try {
      await fetch('/api/cards/credit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCard)
      });
    } catch (err) {
      console.error('Failed to save credit card to DB', err);
    }
    
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__handle" />
        <div className="modal__title">Novo Cartão de Crédito</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome / Apelido *</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank" required />
          </div>

          <div className="form-group">
            <label className="form-label">Instituição</label>
            <input className="form-input" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Ex: Nu Pagamentos" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bandeira</label>
              <select className="form-select" value={brand} onChange={(e) => setBrand(e.target.value as CreditCard['brand'])}>
                {BRANDS.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Últimos 4 dígitos</label>
              <input className="form-input" value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" maxLength={4} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Limite total (R$)</label>
            <input className="form-input" type="number" step="0.01" value={totalLimit} onChange={(e) => setTotalLimit(e.target.value)} placeholder="5000" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Dia de fechamento</label>
              <input className="form-input" type="number" min="1" max="31" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} placeholder="3" />
            </div>
            <div className="form-group">
              <label className="form-label">Dia de vencimento</label>
              <input className="form-input" type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="10" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cor do cartão</label>
            <div className="color-options">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-option ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Foto do cartão (Opcional)</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="form-input" style={{ padding: '8px' }} />
            {imageUrl && <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--green)' }}>Foto carregada com sucesso!</div>}
          </div>

          <button type="submit" className="btn btn-primary">Adicionar Cartão</button>
        </form>
      </div>
    </div>
  );
}
