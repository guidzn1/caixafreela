import { useMemo, useState } from 'react';
import { Header } from '../../components/Header/Header';
import { DashboardCard } from '../../components/DashboardCard/DashboardCard';
import { TransactionsTable } from '../../components/TransactionsTable/TransactionsTable';
import { TransactionModal } from '../../components/TransactionModal/TransactionModal';
import { ReportsSection } from '../../components/ReportsSection/ReportsSection';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';
import styles from './DashboardPage.module.css';

export const DashboardPage = () => {
  // --- HOOKS E CONTEXTOS ---
  const { user } = useAuth();
  const { monthlyData, loading, addTransaction, updateTransaction, deleteTransaction } = useData();
  
  // Estado para controlar o modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [modalType, setModalType] = useState('entradas');

  // --- CÁLCULOS PARA OS CARDS DE RESUMO ---
  const summary = useMemo(() => {
    if (!monthlyData) {
      return { totalEntradasPrevisto: 0, totalEntradasReal: 0, totalSaidasPrevisto: 0, totalSaidasReal: 0, saldoInicial: 0, caixaFinalReal: 0, caixaFinalPrevisto: 0, entradasProgress: 0, saidasProgress: 0 };
    }
    
    const totalEntradasPrevisto = monthlyData.entradas.reduce((acc, t) => acc + (t.valorPrevisto || 0), 0);
    const totalEntradasReal = monthlyData.entradas.reduce((acc, t) => acc + (t.valorReal || 0), 0);
    const totalSaidasPrevisto = monthlyData.saidas.reduce((acc, t) => acc + (t.valorPrevisto || 0), 0);
    const totalSaidasReal = monthlyData.saidas.reduce((acc, t) => acc + (t.valorReal || 0), 0);
    const saldoInicial = monthlyData.saldoInicial || 0;
    const caixaFinalReal = saldoInicial + totalEntradasReal - totalSaidasReal;
    const caixaFinalPrevisto = saldoInicial + totalEntradasPrevisto - totalSaidasPrevisto;
    const entradasProgress = totalEntradasPrevisto > 0 ? (totalEntradasReal / totalEntradasPrevisto) * 100 : 0;
    const saidasProgress = totalSaidasPrevisto > 0 ? (totalSaidasReal / totalSaidasPrevisto) * 100 : 0;

    return { totalEntradasPrevisto, totalEntradasReal, totalSaidasPrevisto, totalSaidasReal, saldoInicial, caixaFinalReal, caixaFinalPrevisto, entradasProgress, saidasProgress };
  }, [monthlyData]);

  // --- CÁLCULOS PARA OS INSIGHTS E SAUDAÇÃO ---
  const insights = useMemo(() => {
    if (!monthlyData || !user) return { userName: '', biggestExpense: null, biggestIncome: null };

    // Usa o displayName, se não existir, usa a parte do email antes do '@'
    const userName = user.displayName ? user.displayName.split(' ')[0] : (user.email.split('@')[0] || '');
    const capitalizedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);

    const biggestExpense = monthlyData.saidas.length > 0
      ? [...monthlyData.saidas].sort((a, b) => (b.valorReal || 0) - (a.valorReal || 0))[0]
      : null;

    const biggestIncome = monthlyData.entradas.length > 0
      ? [...monthlyData.entradas].sort((a, b) => (b.valorReal || 0) - (a.valorReal || 0))[0]
      : null;

    return { userName: capitalizedUserName, biggestExpense, biggestIncome };
  }, [monthlyData, user]);

  // --- FUNÇÕES AUXILIARES E HANDLERS ---
  const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
    const dataComTimestamp = { ...transactionData, updatedAt: new Date().toISOString() };
    if (transactionData.id) {
      await updateTransaction(type, dataComTimestamp);
    } else {
      await addTransaction(type, dataComTimestamp);
    }
    handleCloseModal();
  };
  
  const handleDeleteTransaction = async (type, transactionId) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      await deleteTransaction(type, transactionId);
    }
  };

  const handleToggleConfirm = async (type, transaction) => {
    const isConfirming = !transaction.confirmado;
    const valorReal = isConfirming && (!transaction.valorReal || transaction.valorReal === 0)
      ? transaction.valorPrevisto 
      : (isConfirming ? transaction.valorReal : 0);
      
    const updatedTransaction = { ...transaction, confirmado: isConfirming, valorReal: valorReal };
    await updateTransaction(type, updatedTransaction);
  };

  // --- RENDERIZAÇÃO ---
  if (loading) {
    return (
      <div className={styles.dashboard}>
        <Header />
        <main className={styles.mainContent}>
          <p>Carregando seus dados financeiros...</p>
        </main>
      </div>
    );
  }

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
          <DashboardCard title="Caixa Final" value={formatCurrency(summary.caixaFinalReal)} detail={`Previsto: ${formatCurrency(summary.caixaFinalPrevisto)}`} />
        </div>

        {(insights.biggestIncome || insights.biggestExpense) && (
          <div className={styles.insightsContainer}>
            {insights.biggestIncome && insights.biggestIncome.valorReal > 0 && (
              <div className={styles.insightCard}>
                <strong>💰 Maior Entrada:</strong>
                <span>{insights.biggestIncome.descricao} ({formatCurrency(insights.biggestIncome.valorReal)})</span>
              </div>
            )}
            {insights.biggestExpense && insights.biggestExpense.valorReal > 0 && (
              <div className={styles.insightCard}>
                <strong>💸 Maior Saída:</strong>
                <span>{insights.biggestExpense.descricao} ({formatCurrency(insights.biggestExpense.valorReal)})</span>
              </div>
            )}
          </div>
        )}

        <div className={styles.quickActions}>
          <button onClick={() => handleOpenModal('entradas')} className={styles.actionButtonEntrada}>
            + Nova Entrada
          </button>
          <button onClick={() => handleOpenModal('saidas')} className={styles.actionButtonSaida}>
            + Nova Saída
          </button>
        </div>

        <div className={styles.tablesGrid}>
          <TransactionsTable title="Entradas" data={monthlyData?.entradas} type="entradas" onAdd={handleOpenModal} onEdit={handleOpenModal} onDelete={handleDeleteTransaction} onToggleConfirm={handleToggleConfirm} />
          <TransactionsTable title="Saídas" data={monthlyData?.saidas} type="saidas" onAdd={handleOpenModal} onEdit={handleOpenModal} onDelete={handleDeleteTransaction} onToggleConfirm={handleToggleConfirm} />
        </div>
        
        <ReportsSection />
      </main>
      
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTransaction}
        transactionToEdit={transactionToEdit}
        type={modalType}
      />
    </div>
  );
};