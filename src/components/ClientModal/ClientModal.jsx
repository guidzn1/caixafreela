import { useState, useEffect } from 'react';
import styles from './ClientModal.module.css';

export const ClientModal = ({ isOpen, onClose, onSave, clientToEdit }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  const isEditing = !!clientToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setNome(clientToEdit.nome || '');
        setEmail(clientToEdit.email || '');
        setTelefone(clientToEdit.telefone || '');
      } else {
        setNome('');
        setEmail('');
        setTelefone('');
      }
    }
  }, [clientToEdit, isOpen, isEditing]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      id: isEditing ? clientToEdit.id : null,
      nome, 
      email, 
      telefone 
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{isEditing ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Nome do Cliente</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Email (opcional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label>Telefone (opcional)</label>
            <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </div>
          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
            <button type="submit" className={styles.saveButton}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};