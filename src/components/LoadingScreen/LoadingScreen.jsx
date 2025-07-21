import styles from './LoadingScreen.module.css';
import logoImg from '../../assets/logo_azul.png'; // Usaremos o mesmo logo da página de login

export const LoadingScreen = () => {
  return (
    <div className={styles.loadingContainer}>
      <img 
        src={logoImg} 
        alt="Carregando CaixaFreela..." 
        className={styles.logo} 
      />
    </div>
  );
};