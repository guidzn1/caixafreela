// src/components/TransactionModal/TransactionModal.jsx

import { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import styles from './TransactionModal.module.css';
import toast from 'react-hot-toast';
import { ClientModal } from '../ClientModal/ClientModal';

export const TransactionModal = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  type,
  categorias = [],
  clientes = []
}) => {
  const isEditing = Boolean(transactionToEdit);

  const [clienteId, setClienteId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorPrevisto, setValorPrevisto] = useState('');
  const [valorReal, setValorReal] = useState('');
  const [categoria, setCategoria] = useState('');        // <— inicia em ''
  const [data, setData] = useState(new Date().toISOString().slice(0,10));
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [mesesRecorrencia, setMesesRecorrencia] = useState('12');
  const [isParcelado, setIsParcelado] = useState(false);
  const [totalParcelas, setTotalParcelas] = useState('');
  const [parcelasPagas, setParcelasPagas] = useState('0');
  const [modoCriacaoCategoria, setModoCriacaoCategoria] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');

  const { addCliente, updateCategorias } = useData();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEditing) {
      // Edição: carrega os valores existentes
      setClienteId(transactionToEdit.clienteId || '');
      let desc = transactionToEdit.descricao || '';
      if (type === 'entradas' && transactionToEdit.clienteNome) {
        desc = desc.replace(` - ${transactionToEdit.clienteNome}`, '');
      }
      setDescricao(desc);
      setValorPrevisto(transactionToEdit.valorPrevisto?.toString() || '');
      setValorReal(transactionToEdit.valorReal?.toString() || '');
      setData(transactionToEdit.data || new Date().toISOString().slice(0,10));
      setCategoria(transactionToEdit.categoria || '');
      setIsRecorrente(!!transactionToEdit.isRecorrente);
      setMesesRecorrencia(transactionToEdit.mesesRecorrencia?.toString() || '12');
      setIsParcelado(!!transactionToEdit.isParcelado);
      setTotalParcelas(transactionToEdit.parcelamentoInfo?.total?.toString() || '');
      setParcelasPagas(transactionToEdit.parcelamentoInfo?.pagas?.toString() || '0');
    } else {
      // Novo: force placeholder (valor vazio)
      setClienteId('');
      setDescricao('');
      setValorPrevisto('');
      setValorReal('');
      setData(new Date().toISOString().slice(0,10));
      setCategoria('');                              // <— aqui também
      setIsRecorrente(false);
      setMesesRecorrencia('12');
      setIsParcelado(false);
      setTotalParcelas('');
      setParcelasPagas('0');
    }
    setModoCriacaoCategoria(false);
    setNovaCategoria('');
  }, [isOpen, transactionToEdit, clientes, categorias, type]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedClient = clientes.find(c => c.id === clienteId);
    const finalDescription = (type === 'entradas' && selectedClient)
      ? `${descricao.trim()} - ${selectedClient.nome}`
      : descricao.trim();
    const payload = {
      ...(isEditing && { id: transactionToEdit.id }),
      descricao: finalDescription,
      data,
      valorPrevisto: parseFloat(valorPrevisto) || 0,
      valorReal: parseFloat(valorReal) || 0,
      confirmado: isEditing ? transactionToEdit.confirmado : false,
      ...(type === 'entradas' && {
        clienteId,
        clienteNome: selectedClient?.nome || null
      }),
      ...(type === 'saidas' && { categoria }),
      isRecorrente,
      mesesRecorrencia: isRecorrente ? parseInt(mesesRecorrencia, 10) : null,
      isParcelado,
      parcelamentoInfo: isParcelado
        ? { total: parseInt(totalParcelas, 10), pagas: parseInt(parcelasPagas, 10) || 0 }
        : null
    };
    onSave(type, payload);
    onClose();
  };

  const handleSaveNewClient = async (clientData) => {
    await addCliente(clientData);
    toast.success("Cliente adicionado! Feche e abra o modal para vê-lo.");
    setIsClientModalOpen(false);
  };

  const handleAddNewCategory = async () => {
    const trimmed = novaCategoria.trim();
    if (!trimmed) return;
    if (categorias.some(cat => cat.toLowerCase() === trimmed.toLowerCase())) {
      return toast.error("Essa categoria já existe.");
    }
    await updateCategorias([...categorias, trimmed]);
    setCategoria(trimmed);
    setNovaCategoria('');
    setModoCriacaoCategoria(false);
    toast.success("Categoria adicionada!");
  };

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <h2>
            {isEditing ? 'Editar' : 'Adicionar'}{' '}
            {type === 'entradas' ? 'Entrada' : 'Saída'}
          </h2>
          <form onSubmit={handleSubmit}>
            {type === 'entradas' && (
              <div className={styles.inputGroup}>
                <label>Cliente</label>
                <div className={styles.selectCategoryWrapper}>
                  <select
                    value={clienteId}
                    onChange={e => setClienteId(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      -- Selecione um cliente --
                    </option>
                    {clientes.map(cli => (
                      <option key={cli.id} value={cli.id}>
                        {cli.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.addCategoryButton}
                    onClick={() => setIsClientModalOpen(true)}
                    title="Adicionar novo cliente"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label>Descrição</label>
              <input
                type="text"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Data</label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Valor Previsto</label>
              <input
                type="number"
                step="0.01"
                value={valorPrevisto}
                onChange={e => setValorPrevisto(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Valor Real</label>
              <input
                type="number"
                step="0.01"
                value={valorReal}
                onChange={e => setValorReal(e.target.value)}
              />
            </div>

            {type === 'saidas' && (
              <div className={styles.inputGroup}>
                <label>Categoria</label>
                {modoCriacaoCategoria ? (
                  <div className={styles.createCategoryWrapper}>
                    <input
                      type="text"
                      value={novaCategoria}
                      onChange={e => setNovaCategoria(e.target.value)}
                      placeholder="Nome da nova categoria"
                      autoFocus
                    />
                    <button
                      type="button"
                      className={styles.saveCategoryButton}
                      onClick={handleAddNewCategory}
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      className={styles.cancelCategoryButton}
                      onClick={() => setModoCriacaoCategoria(false)}
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <div className={styles.selectCategoryWrapper}>
                    <select
                      value={categoria}
                      onChange={e => setCategoria(e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        -- Selecione uma categoria --
                      </option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.addCategoryButton}
                      onClick={() => setModoCriacaoCategoria(true)}
                      title="Adicionar nova categoria"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isEditing && (
              <>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="recorrente"
                    checked={isRecorrente}
                    onChange={e => setIsRecorrente(e.target.checked)}
                    disabled={isParcelado}
                  />
                  <label htmlFor="recorrente">
                    Transação recorrente?
                  </label>
                </div>
                {isRecorrente && (
                  <div className={styles.parcelamentoFields}>
                    <div className={styles.inputGroup}>
                      <label>Meses de recorrência</label>
                      <input
                        type="number"
                        value={mesesRecorrencia}
                        onChange={e => setMesesRecorrencia(e.target.value)}
                        min="2"
                        max="60"
                        required
                      />
                    </div>
                  </div>
                )}
                {type === 'saidas' && (
                  <div className={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="parcelado"
                      checked={isParcelado}
                      onChange={e => setIsParcelado(e.target.checked)}
                      disabled={isRecorrente}
                    />
                    <label htmlFor="parcelado">
                      Compra parcelada?
                    </label>
                  </div>
                )}
                {isParcelado && type === 'saidas' && (
                  <div className={styles.parcelamentoFields}>
                    <div className={styles.inputGroup}>
                      <label>Total de Parcelas</label>
                      <input
                        type="number"
                        value={totalParcelas}
                        onChange={e => setTotalParcelas(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Parcelas Já Pagas</label>
                      <input
                        type="number"
                        value={parcelasPagas}
                        onChange={e => setParcelasPagas(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.saveButton}>
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveNewClient}
      />
    </>
  );
};
