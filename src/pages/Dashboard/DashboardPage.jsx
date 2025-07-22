// src/pages/DashboardPage/DashboardPage.jsx

import { useMemo, useState } from 'react';
import { Header } from '../../components/Header/Header';
import { DashboardCard } from '../../components/DashboardCard/DashboardCard';
import { TransactionsTable } from '../../components/TransactionsTable/TransactionsTable';
import { TransactionModal } from '../../components/TransactionModal/TransactionModal';
import { ReportsSection } from '../../components/ReportsSection/ReportsSection';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal';
import { LoadingScreen } from '../../components/LoadingScreen/LoadingScreen';
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
    categorias,
    clientes 
  } = useData();
  
  console.log(
    "%c2. [DashboardPage] Clientes recebidos do DataContext:", 
    "color: #32cd32; font-weight: bold;", 
    clientes
  );
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [modalType, setModalType] = useState('entradas');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const summary = useMemo(() => {
    if (!monthlyData) {
      return {
        totalEntradasPrevisto: 0,
        totalEntradasReal: 0,
        totalSaidasPrevisto: 0,
        totalSaidasReal: 0,
        saldoInicial: 0,
        caixaFinalReal: 0,
        caixaFinalPrevisto: 0,
        entradasProgress: 0,
        saidasProgress: 0
      };
    }
    
    const totalEntradasPrevisto = monthlyData.entradas.reduce((acc, t) => acc + (t.valorPrevisto || 0), 0);
    const totalEntradasReal    = monthlyData.entradas.reduce((acc, t) => acc + (t.valorReal     || 0), 0);
    const totalSaidasPrevisto  = monthlyData.saidas.reduce  ((acc, t) => acc + (t.valorPrevisto || 0), 0);
    const totalSaidasReal      = monthlyData.saidas.reduce  ((acc, t) => acc + (t.valorReal     || 0), 0);
    const saldoInicial         = monthlyData.saldoInicial || 0;
    const caixaFinalReal       = saldoInicial + totalEntradasReal - totalSaidasReal;
    const caixaFinalPrevisto   = saldoInicial + totalEntradasPrevisto - totalSaidasPrevisto;
    const entradasProgress     = totalEntradasPrevisto > 0 ? (totalEntradasReal / totalEntradasPrevisto) * 100 : 0;
    const saidasProgress       = totalSaidasPrevisto  > 0 ? (totalSaidasReal   / totalSaidasPrevisto ) * 100 : 0;

    return {
      totalEntradasPrevisto,
      totalEntradasReal,
      totalSaidasPrevisto,
      totalSaidasReal,
      saldoInicial,
      caixaFinalReal,
      caixaFinalPrevisto,
      entradasProgress,
      saidasProgress
    };
  }, [monthlyData]);

  const insights = useMemo(() => {
    if (!monthlyData || !user) return { userName: '', biggestExpense: null, biggestIncome: null };
    const rawName = user.displayName || user.email.split('@')[0] || '';
    const userName = rawName.split(' ')[0];
    const capitalizedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);
    const biggestExpense = monthlyData.saidas.length > 0
      ? [...monthlyData.saidas].sort((a, b) => (b.valorReal || 0) - (a.valorReal || 0))[0]
      : null;
    const biggestIncome  = monthlyData.entradas.length > 0
      ? [...monthlyData.entradas].sort((a, b) => (b.valorReal || 0) - (a.valorReal || 0))[0]
      : null;
    return { userName: capitalizedUserName, biggestExpense, biggestIncome };
  }, [monthlyData, user]);

  const formatCurrency = (value) =>
    (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleOpenModal = (type, transaction = null) => {
    setModalType(type);
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTransactionToEdit(null);
  };

  const handleSaveTransaction = async (type, transactionData) => {
    console.log('↪ onSave chamado com:', type, transactionData);
    handleCloseModal();

    // Adiciona timestamp e remove campos undefined
    const rawPayload = { 
      ...transactionData, 
      updatedAt: new Date().toISOString() 
    };
    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(([, v]) => v !== undefined)
    );

    if (transactionData.id) {
      try {
        await updateTransaction(type, payload);
        toast.success('Transação atualizada com sucesso!');
      } catch (err) {
        console.error('Erro ao atualizar transação:', err);
        toast.error('Não foi possível atualizar a transação. Veja o console.');
      }
    } else {
      try {
        await addTransaction(type, payload);
        toast.success('Transação criada com sucesso!');
      } catch (err) {
        console.error('Erro ao criar transação:', err);
        toast.error('Não foi possível criar a transação. Veja o console.');
      }
    }
  };
  
  const handleDeleteTransaction = (type, transactionId) => {
    setDeleteTarget({ type, id: transactionId });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteTransaction(deleteTarget.type, deleteTarget.id);
      toast.success("Transação excluída com sucesso!");
    }
    setIsConfirmModalOpen(false);
    setDeleteTarget(null);
  };

  const handleToggleConfirm = async (type, transaction) => {
    const updated = {
      ...transaction,
      confirmado: !transaction.confirmado,
      valorReal: !transaction.confirmado && !transaction.valorReal
        ? transaction.valorPrevisto
        : transaction.valorReal
    };
    try {
      await updateTransaction(type, updated);
      toast.success('Status atualizado!');
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Não foi possível atualizar o status. Veja o console.');
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <Header />
        <main className={styles.mainContent}>
          <LoadingScreen />
        </main>
      </div>
    );
  }
  
  const sortTransactions = (transactions) => {
    if (!transactions) return [];
    return [...transactions].sort((a, b) => {
      if (a.confirmado !== b.confirmado) {
        return a.confirmado - b.confirmado;
      }
      return new Date(b.data) - new Date(a.data);
    });
  };

  const sortedEntradas = sortTransactions(monthlyData?.entradas);
  const sortedSaidas   = sortTransactions(monthlyData?.saidas);

  return (
    <div className={styles.dashboard}>
      <Header />
      <main className={styles.mainContent}>
        
        <div className={styles.welcomeHeader}>
          <h2>Olá, {insights.userName}!</h2>
          <p>Aqui está o resumo do seu mês.</p>
        </div>

        <div className={styles.cardsContainer}>
          <DashboardCard title="Saldo Inicial" value={formatCurrency(summary.saldoInicial)} />
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
            {insights.biggestIncome && insights.biggestIncome.valorReal > 0 && (
              <div className={styles.insightCard}>
                <strong>💰 Maior Entrada:</strong>
                <span>
                  {insights.biggestIncome.descricao} ({formatCurrency(insights.biggestIncome.valorReal)})
                </span>
              </div>
            )}
            {insights.biggestExpense && insights.biggestExpense.valorReal > 0 && (
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
