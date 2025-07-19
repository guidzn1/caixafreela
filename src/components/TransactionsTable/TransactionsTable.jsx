import { EmptyState } from '../EmptyState/EmptyState';
import styles from './TransactionsTable.module.css';
import { Repeat, Layers, Edit, Trash2 } from 'lucide-react'; // Importe os ícones de ação

export const TransactionsTable = ({ title, data = [], type, onAdd, onEdit, onDelete, onToggleConfirm }) => {
  const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <h2>{title}</h2>
        <button onClick={() => onAdd(type)} className={styles.addButton}>+ Adicionar</button>
      </div>
      
      {data.length > 0 ? (
        <>
          {/* ESTRUTURA PARA DESKTOP (será escondida no mobile) */}
          <div className={styles.tableWrapper}>
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
                      <button onClick={() => onEdit(type, item)} className={styles.actionButton}><Edit size={16} /></button>
                      <button onClick={() => onDelete(type, item.id)} className={`${styles.actionButton} ${styles.deleteButton}`}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* NOVA ESTRUTURA PARA MOBILE (será escondida no desktop) */}
          <div className={styles.mobileList}>
            {data.map(item => (
              <div key={item.id} className={`${styles.mobileCard} ${item.confirmado ? styles.confirmedMobile : ''}`}>
                <div className={styles.cardHeader}>
                  <input type="checkbox" checked={item.confirmado} onChange={() => onToggleConfirm(type, item)} />
                  <div className={styles.descriptionMobile}>
                    <span>{item.descricao}</span>
                    <div className={styles.iconsMobile}>
                      {item.isRecorrente && <Repeat size={14} className={styles.recurringIcon} title="Transação Recorrente"/>}
                      {item.isParcelado && <Layers size={14} className={styles.recurringIcon} title="Compra Parcelada"/>}
                    </div>
                  </div>
                  <div className={styles.actionsMobile}>
                    <button onClick={() => onEdit(type, item)} className={styles.actionButtonMobile}><Edit size={18} /></button>
                    <button onClick={() => onDelete(type, item.id)} className={`${styles.actionButtonMobile} ${styles.deleteButtonMobile}`}><Trash2 size={18} /></button>
                  </div>
                </div>
                {type === 'saidas' && <div className={styles.categoryMobile}>{item.categoria}</div>}
                <div className={styles.cardValues}>
                  <div>
                    <span>Previsto</span>
                    <p>{formatCurrency(item.valorPrevisto)}</p>
                  </div>
                  <div>
                    <span>Real</span>
                    <p className={type === 'entradas' ? styles.entrada : styles.saida}>{formatCurrency(item.valorReal)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
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