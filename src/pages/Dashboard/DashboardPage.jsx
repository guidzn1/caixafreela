// src/pages/DashboardPage/DashboardPage.jsx

import { useMemo, useState, useEffect } from 'react';
import { Header } from '../../components/Header/Header';
import { DashboardCard } from '../../components/DashboardCard/DashboardCard';
import { TransactionsTable } from '../../components/TransactionsTable/TransactionsTable';
import { TransactionModal } from '../../components/TransactionModal/TransactionModal';
import { ReportsSection } from '../../components/ReportsSection/ReportsSection';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal';
import { LoadingScreen } from '../../components/LoadingScreen/LoadingScreen';
import { Edit, Check } from 'lucide-react';
import styles from './DashboardPage.module.css';
import toast from 'react-hot-toast';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { 
    monthlyData, 
    loading, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    updateSaldoInicial,
    categorias,
    clientes 
  } = useData();

  // controle de edição do saldo inicial
  const [isEditingSaldo, setIsEditingSaldo] = useState(false);
  const [saldoInicialInput, setSaldoInicialInput] = useState(0);

  useEffect(() => {
    if (monthlyData) {
      setSaldoInicialInput(monthlyData.saldoInicial ?? 0);
    }
  }, [monthlyData]);

  const handleSaldoEditClick = () => {
    setIsEditingSaldo(true);
  };

  const handleConfirmSaldo = () => {
    const novo = parseFloat(saldoInicialInput);
    if (!isNaN(novo)) {
      updateSaldoInicial(novo);
      toast.success('Saldo Inicial atualizado!');
    } else {
      setSaldoInicialInput(monthlyData.saldoInicial ?? 0);
      toast.error('Valor inválido');
    }
    setIsEditingSaldo(false);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [modalType, setModalType] = useState('entradas');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const summary = useMemo(() => {
    if (!monthlyData) return {
      totalEntradasPrevisto: 0, totalEntradasReal: 0,
      totalSaidasPrevisto: 0,   totalSaidasReal: 0,
      saldoInicial: 0, caixaFinalReal: 0,
      caixaFinalPrevisto: 0, entradasProgress: 0,
      saidasProgress: 0
    };
    const teP = monthlyData.entradas.reduce((a,t)=>a+(t.valorPrevisto||0),0);
    const teR = monthlyData.entradas.reduce((a,t)=>a+(t.valorReal   ||0),0);
    const tsP = monthlyData.saidas .reduce((a,t)=>a+(t.valorPrevisto||0),0);
    const tsR = monthlyData.saidas .reduce((a,t)=>a+(t.valorReal   ||0),0);
    const si  = monthlyData.saldoInicial||0;
    return {
      totalEntradasPrevisto: teP,
      totalEntradasReal:    teR,
      totalSaidasPrevisto:  tsP,
      totalSaidasReal:      tsR,
      saldoInicial:         si,
      caixaFinalReal:       si + teR - tsR,
      caixaFinalPrevisto:   si + teP - tsP,
      entradasProgress:     teP>0?teR/teP*100:0,
      saidasProgress:       tsP>0?tsR/tsP*100:0
    };
  }, [monthlyData]);

  const insights = useMemo(() => {
    if (!monthlyData || !user) return { userName:'', biggestExpense:null, biggestIncome:null };
    const raw = user.displayName||user.email.split('@')[0]||'';
    const first = raw.split(' ')[0];
    const userName = first.charAt(0).toUpperCase()+first.slice(1);
    const biggestExpense = monthlyData.saidas.length
      ? [...monthlyData.saidas].sort((a,b)=>(b.valorReal||0)-(a.valorReal||0))[0]
      : null;
    const biggestIncome = monthlyData.entradas.length
      ? [...monthlyData.entradas].sort((a,b)=>(b.valorReal||0)-(a.valorReal||0))[0]
      : null;
    return { userName, biggestExpense, biggestIncome };
  }, [monthlyData, user]);

  const formatCurrency = v =>
    (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  const handleOpenModal = (type, tx=null) => {
    setModalType(type);
    setTransactionToEdit(tx);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTransactionToEdit(null);
  };

  const handleSaveTransaction = async (type, txData) => {
    handleCloseModal();
    const raw = {...txData, updatedAt:new Date().toISOString()};
    const payload = Object.fromEntries(Object.entries(raw).filter(([,v])=>v!==undefined));
    try {
      if (txData.id) {
        await updateTransaction(type,payload);
        toast.success('Transação atualizada!');
      } else {
        await addTransaction(type,payload);
        toast.success('Transação adicionada!');
      }
    } catch(err){
      console.error(err);
      toast.error('Erro ao salvar transação.');
    }
  };

  const handleDeleteTransaction = (type,id) => {
    setDeleteTarget({type,id});
    setIsConfirmModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if(deleteTarget){
      await deleteTransaction(deleteTarget.type,deleteTarget.id);
      toast.success('Transação excluída!');
    }
    setIsConfirmModalOpen(false);
    setDeleteTarget(null);
  };

  const handleToggleConfirm = async (type,tx) => {
    const updated = {
      ...tx,
      confirmado:!tx.confirmado,
      valorReal:!tx.confirmado && !tx.valorReal? tx.valorPrevisto: tx.valorReal
    };
    try {
      await updateTransaction(type,updated);
      toast.success('Status alterado!');
    } catch(err){
      console.error(err);
      toast.error('Erro ao alterar status.');
    }
  };

  if(loading){
    return <div className={styles.dashboard}><Header/><main className={styles.mainContent}><LoadingScreen/></main></div>;
  }

  const sortTx = arr =>
    (arr||[]).slice().sort((a,b)=>{
      if(a.confirmado!==b.confirmado) return a.confirmado - b.confirmado;
      return new Date(b.data)-new Date(a.data);
    });
  const sortedEntradas = sortTx(monthlyData.entradas);
  const sortedSaidas   = sortTx(monthlyData.saidas);

  return (
    <div className={styles.dashboard}>
      <Header/>
      <main className={styles.mainContent}>

        <div className={styles.welcomeHeader}>
          <h2>Olá, {insights.userName}!</h2>
          <p>Aqui está o resumo do seu mês.</p>
        </div>

        <div className={styles.cardsContainer}>
          <DashboardCard
            title={
              <div className={styles.saldoCardHeader}>
                <span>Saldo Inicial</span>
                <Edit
                  size={18}
                  className={styles.editIcon}
                  onClick={handleSaldoEditClick}
                />
              </div>
            }
            value={
              isEditingSaldo
                ? (
                  <div className={styles.saldoInputWrapper}>
                    <input
                      className={styles.saldoInput}
                      type="number"
                      step="0.01"
                      value={saldoInicialInput}
                      onChange={e => setSaldoInicialInput(e.target.value)}
                    />
                    <button
                      className={styles.confirmButton}
                      onClick={handleConfirmSaldo}
                    >
                      <Check size={16}/>
                    </button>
                  </div>
                )
                : formatCurrency(summary.saldoInicial)
            }
          />
          <DashboardCard
            title="Entradas (Mês)"
            value={formatCurrency(summary.totalEntradasReal)}
            detail={`Previsto: ${formatCurrency(summary.totalEntradasPrevisto)}`}
            valueColor="var(--color-success)"
            progressValue={summary.entradasProgress}
            progressColor="var(--color-success)"
          />
          <DashboardCard
            title="Saídas (Mês)"
            value={formatCurrency(summary.totalSaidasReal)}
            detail={`Previsto: ${formatCurrency(summary.totalSaidasPrevisto)}`}
            valueColor="var(--color-danger)"
            progressValue={summary.saidasProgress}
            progressColor="var(--color-danger)"
          />
          <DashboardCard
            title="Caixa Final"
            value={formatCurrency(summary.caixaFinalReal)}
            detail={`Previsto: ${formatCurrency(summary.caixaFinalPrevisto)}`}
          />
        </div>

        {(insights.biggestIncome || insights.biggestExpense) && (
          <div className={styles.insightsContainer}>
            {insights.biggestIncome?.valorReal > 0 && (
              <div className={styles.insightCard}>
                <strong>💰 Maior Entrada:</strong>
                <span>
                  {insights.biggestIncome.descricao} ({formatCurrency(insights.biggestIncome.valorReal)})
                </span>
              </div>
            )}
            {insights.biggestExpense?.valorReal > 0 && (
              <div className={styles.insightCard}>
                <strong>💸 Maior Saída:</strong>
                <span>
                  {insights.biggestExpense.descricao} ({formatCurrency(insights.biggestExpense.valorReal)})
                </span>
              </div>
            )}
          </div>
        )}

        <div className={styles.quickActions}>
          <button
            onClick={() => handleOpenModal('entradas')}
            className={styles.actionButtonEntrada}
          >
            + Nova Entrada
          </button>
          <button
            onClick={() => handleOpenModal('saidas')}
            className={styles.actionButtonSaida}
          >
            + Nova Saída
          </button>
        </div>

        <div className={styles.tablesGrid}>
          <TransactionsTable
            title="Entradas"
            data={sortedEntradas}
            type="entradas"
            onAdd={handleOpenModal}
            onEdit={handleOpenModal}
            onDelete={handleDeleteTransaction}
            onToggleConfirm={handleToggleConfirm}
          />
          <TransactionsTable
            title="Saídas"
            data={sortedSaidas}
            type="saidas"
            onAdd={handleOpenModal}
            onEdit={handleOpenModal}
            onDelete={handleDeleteTransaction}
            onToggleConfirm={handleToggleConfirm}
          />
        </div>

        <ReportsSection />
      </main>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTransaction}
        transactionToEdit={transactionToEdit}
        type={modalType}
        categorias={categorias}
        clientes={clientes}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Você tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
      />
    </div>
  );
};