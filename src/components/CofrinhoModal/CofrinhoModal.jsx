import { useState, useEffect } from 'react';
import styles from '../TransactionModal/TransactionModal.module.css'; // Reutilizando

export const CofrinhoModal = ({ isOpen, onClose, onSave }) => {
  const [nome, setNome] = useState('');
  const [meta, setMeta] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNome('');
      setMeta('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ nome, metaFinanceira: parseFloat(meta) || 0, valorAtual: 0 });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Criar Novo Cofrinho</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Nome do Cofrinho (ex: Viagem, Emergência)</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Meta Financeira (opcional)</label>
            <input type="number" step="0.01" value={meta} onChange={(e) => setMeta(e.target.value)} />
          </div>
          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
            <button type="submit" className={styles.saveButton}>Criar</button>
          </div>
        </form>
      </div>
    </div>
  );
};