import { EmptyState } from '../EmptyState/EmptyState';
import styles from './TransactionsTable.module.css';
import { Repeat, Layers } from 'lucide-react';

export const TransactionsTable = ({ title, data = [], type, onAdd, onEdit, onDelete, onToggleConfirm }) => {
  const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <h2>{title}</h2>
        <button onClick={() => onAdd(type)} className={styles.addButton}>+ Adicionar</button>
      </div>
      
      {data.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Conf.</th>
              {type === 'saidas' && <th>Categoria</th>}
              <th>Descrição</th>
              <th>Previsto</th>
              <th>Real</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} className={item.confirmado ? styles.confirmed : ''}>
                <td><input type="checkbox" checked={item.confirmado} onChange={() => onToggleConfirm(type, item)} /></td>
                {type === 'saidas' && <td>{item.categoria}</td>}
                <td className={styles.descriptionCell}>
                  <span>{item.descricao}</span>
                  {item.isRecorrente && <Repeat size={14} className={styles.recurringIcon} title="Transação Recorrente"/>}
                  {item.isParcelado && <Layers size={14} className={styles.recurringIcon} title="Compra Parcelada"/>}
                </td>
                <td>{formatCurrency(item.valorPrevisto)}</td>
                <td className={type === 'entradas' ? styles.entrada : styles.saida}>{formatCurrency(item.valorReal)}</td>
                <td className={styles.actions}>
                  <button onClick={() => onEdit(type, item)} className={styles.actionButton}>Editar</button>
                  <button onClick={() => onDelete(type, item.id)} className={`${styles.actionButton} ${styles.deleteButton}`}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState 
          message={`Nenhuma ${type === 'entradas' ? 'entrada' : 'saída'} registrada este mês.`}
          actionText={`Adicionar Primeira ${type === 'entradas' ? 'Entrada' : 'Saída'}`}
          onAction={() => onAdd(type)}
        />
      )}
    </div>
  );
};