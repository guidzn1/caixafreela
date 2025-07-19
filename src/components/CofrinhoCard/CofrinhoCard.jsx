import styles from './CofrinhoCard.module.css';

export const CofrinhoCard = ({ cofrinho, onDeposit, onDelete }) => {
  const { nome, valorAtual, metaFinanceira } = cofrinho;
  const progresso = metaFinanceira > 0 ? (valorAtual / metaFinanceira) * 100 : 0;
  const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className={styles.card}>
      <button onClick={() => onDelete(cofrinho.id)} className={styles.deleteButton}>X</button>
      <h3 className={styles.title}>{nome}</h3>
      <p className={styles.amount}>{formatCurrency(valorAtual)}</p>
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${progresso > 100 ? 100 : progresso}%` }}></div>
      </div>
      <p className={styles.goal}>Meta: {formatCurrency(metaFinanceira)}</p>
      <div className={styles.actions}>
        <button onClick={() => onDeposit(cofrinho, 'withdraw')} className={styles.actionButton}>Retirar</button>
        <button onClick={() => onDeposit(cofrinho, 'deposit')} className={`${styles.actionButton} ${styles.depositButton}`}>Depositar</button>
      </div>
    </div>
  );
};