import styles from './DashboardCard.module.css';

export const DashboardCard = ({ 
  title, 
  value, 
  detail, 
  valueColor,
  // Novas props para a barra de progresso
  progressValue,
  progressColor
}) => {
  // Garante que o valor da barra não ultrapasse 100% visualmente
  const progress = progressValue > 100 ? 100 : progressValue;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.value} style={{ color: valueColor }}>
        {value}
      </p>
      {detail && <p className={styles.detail}>{detail}</p>}

      {/* Renderiza a barra de progresso apenas se o valor for fornecido */}
      {progressValue !== undefined && progressValue >= 0 && (
        <div className={styles.progressContainer}>
          <div 
            className={styles.progressBar} 
            style={{ width: `${progress}%`, backgroundColor: progressColor }}
          >
          </div>
        </div>
      )}
    </div>
  );
};