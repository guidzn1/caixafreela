import styles from './DashboardCard.module.css';

// Componente interno para a barra de progresso
const ProgressBar = ({ value, color }) => {
  // Garante que o valor da barra não ultrapasse 100% visualmente
  const progress = value > 100 ? 100 : value;

  return (
    <div className={styles.progressContainer}>
      <div 
        className={styles.progressBar} 
        style={{ width: `${progress}%`, backgroundColor: color }}
      >
      </div>
    </div>
  );
};

export const DashboardCard = ({ 
  title, 
  value, 
  detail, 
  valueColor,
  progressValue,
  progressColor
}) => {
  return (
    <div className={styles.card}>
      <div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.value} style={{ color: valueColor }}>
          {value}
        </p>
        {detail && <p className={styles.detail}>{detail}</p>}
      </div>

      {/* Renderiza a barra de progresso apenas se o valor for um número válido */}
      {typeof progressValue === 'number' && progressValue >= 0 && (
        <ProgressBar value={progressValue} color={progressColor} />
      )}
    </div>
  );
};