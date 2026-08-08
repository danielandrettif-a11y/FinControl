import { useState } from 'react';
import { useApp } from '../App';

const COLORS = ['#000000', '#00D4AA', '#6366F1', '#0075EB', '#FF6B35', '#EF4444'];

export default function AddCryptoCardModal({ onClose }: { onClose: () => void }) {
  const { setCryptoCards } = useApp();
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [color, setColor] = useState(COLORS[0]);
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

    const newCard = {
      id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      name: name.trim(),
      institution: institution.trim() || name.trim(),
      color,
      mainCurrency: 'USD' as const,
      isActive: true,
      imageUrl,
    };

    setCryptoCards((prev) => [...prev, newCard]);

    const token = localStorage.getItem('fincontrol_token');
    try {
      await fetch('/api/cards/crypto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCard)
      });
    } catch (err) {
      console.error('Failed to save crypto card to DB', err);
    }
    
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__handle" />
        <div className="modal__title">Novo Cartão Cripto</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: OKX Card" required />
          </div>
          <div className="form-group">
            <label className="form-label">Instituição</label>
            <input className="form-input" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Ex: OKX" />
          </div>
          <div className="form-group">
            <label className="form-label">Cor do cartão</label>
            <div className="color-options">
              {COLORS.map((c) => (
                <button key={c} type="button" className={`color-option ${color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Foto do cartão (Opcional)</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="form-input" style={{ padding: '8px' }} />
            {imageUrl && <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--green)' }}>Foto carregada com sucesso!</div>}
          </div>
          <button type="submit" className="btn btn-primary">Adicionar Cartão Cripto</button>
        </form>
      </div>
    </div>
  );
}
