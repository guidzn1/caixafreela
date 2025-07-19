import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

export const EmptyState = ({ message, actionText, onAction }) => {
  return (
    <div className={styles.emptyState}>
      <Inbox size={48} className={styles.icon} />
      <p className={styles.message}>{message}</p>
      <button onClick={onAction} className={styles.actionButton}>
        {actionText}
      </button>
    </div>
  );
};