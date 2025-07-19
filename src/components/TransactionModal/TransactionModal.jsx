import { useState, useEffect } from 'react';
import styles from './TransactionModal.module.css';

const CATEGORIAS_SAIDA = ['Moradia', 'Alimentação', 'Transporte', 'Ferramentas', 'Assinaturas', 'Saúde', 'Lazer', 'Outros'];

export const TransactionModal = ({ isOpen, onClose, onSave, transactionToEdit, type }) => {
  const [descricao, setDescricao] = useState('');
  const [valorPrevisto, setValorPrevisto] = useState('');
  const [valorReal, setValorReal] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS_SAIDA[0]);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [mesesRecorrencia, setMesesRecorrencia] = useState('12');
  
  const [isParcelado, setIsParcelado] = useState(false);
  const [totalParcelas, setTotalParcelas] = useState('');
  const [parcelasPagas, setParcelasPagas] = useState('0');

  const isEditing = !!transactionToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setDescricao(transactionToEdit.descricao);
        setValorPrevisto(transactionToEdit.valorPrevisto || '');
        setValorReal(transactionToEdit.valorReal || '');
        setData(transactionToEdit.data || new Date().toISOString().slice(0, 10));
        setIsRecorrente(transactionToEdit.isRecorrente || false);
        setIsParcelado(transactionToEdit.isParcelado || false);
        if (type === 'saidas') {
          setCategoria(transactionToEdit.categoria || CATEGORIAS_SAIDA[0]);
        }
      } else {
        setDescricao('');
        setValorPrevisto('');
        setValorReal('');
        setCategoria(CATEGORIAS_SAIDA[0]);
        setData(new Date().toISOString().slice(0, 10));
        setIsRecorrente(false);
        setMesesRecorrencia('12');
        setIsParcelado(false);
        setTotalParcelas('');
        setParcelasPagas('0');
      }
    }
  }, [transactionToEdit, isOpen, isEditing, type]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const transactionData = {
      id: isEditing ? transactionToEdit.id : null,
      descricao,
      data,
      valorPrevisto: parseFloat(valorPrevisto) || 0,
      valorReal: parseFloat(valorReal) || 0,
      confirmado: isEditing ? transactionToEdit.confirmado : false,
      isRecorrente,
      mesesRecorrencia: parseInt(mesesRecorrencia),
      isParcelado,
      parcelamentoInfo: isParcelado ? {
        total: parseInt(totalParcelas),
        pagas: parseInt(parcelasPagas) || 0
      } : null,
      ...(type === 'saidas' && { categoria })
    };
    onSave(type, transactionData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{isEditing ? 'Editar' : 'Adicionar'} {type === 'entradas' ? 'Entrada' : 'Saída'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Descrição</label>
            <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Valor Previsto {isParcelado && '(Valor Total da Compra)'}</label>
            <input type="number" step="0.01" value={valorPrevisto} onChange={(e) => setValorPrevisto(e.target.value)} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Valor Real (Pago/Recebido)</label>
            <input type="number" step="0.01" value={valorReal} onChange={(e) => setValorReal(e.target.value)} />
          </div>
          {type === 'saidas' && (
            <div className={styles.inputGroup}>
              <label>Categoria</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {CATEGORIAS_SAIDA.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          )}
          
          {!isEditing && (
            <>
              <div className={styles.checkboxGroup}>
                <input 
                  type="checkbox" 
                  id="recorrente" 
                  checked={isRecorrente} 
                  onChange={(e) => setIsRecorrente(e.target.checked)}
                  disabled={isParcelado} 
                />
                <label htmlFor="recorrente">É uma transação recorrente?</label>
              </div>

              {isRecorrente && (
                <div className={styles.parcelamentoFields}>
                  <div className={styles.inputGroup}>
                    <label>Repetir por quantos meses?</label>
                    <input type="number" value={mesesRecorrencia} onChange={(e) => setMesesRecorrencia(e.target.value)} placeholder="Ex: 12" min="2" max="60" required />
                  </div>
                </div>
              )}

              {type === 'saidas' && (
                <div className={styles.checkboxGroup}>
                  <input 
                    type="checkbox" 
                    id="parcelado" 
                    checked={isParcelado} 
                    onChange={(e) => setIsParcelado(e.target.checked)}
                    disabled={isRecorrente}
                  />
                  <label htmlFor="parcelado">É uma compra parcelada?</label>
                </div>
              )}

              {isParcelado && type === 'saidas' && (
                <div className={styles.parcelamentoFields}>
                  <div className={styles.inputGroup}>
                    <label>Número Total de Parcelas</label>
                    <input type="number" value={totalParcelas} onChange={(e) => setTotalParcelas(e.target.value)} placeholder="Ex: 12" required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Parcelas Já Pagas (opcional)</label>
                    <input type="number" value={parcelasPagas} onChange={(e) => setParcelasPagas(e.target.value)} placeholder="Ex: 3" />
                  </div>
                  <p className={styles.infoText}>O "Valor Previsto" que você inseriu deve ser o valor TOTAL da compra.</p>
                </div>
              )}
            </>
          )}

          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
            <button type="submit" className={styles.saveButton}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};