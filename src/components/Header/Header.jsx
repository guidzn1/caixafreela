import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Copy, LogOut, User } from 'lucide-react';
import styles from './Header.module.css';
import logoImg from '../../assets/logo.png'; // 1. IMPORTE A IMAGEM DO LOGO

export const Header = () => {
  const { user, logout } = useAuth();
  const { currentDate, changeMonth, copyPreviousMonth } = useData();

  const navLinkClass = ({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;
  const userInitial = user?.displayName ? user.displayName[0].toUpperCase() : <User size={20} />;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          {/* 2. SUBSTITUA O H1 POR UMA IMAGEM */}
          <Link to="/" className={styles.logoLink}>
            <img src={logoImg} alt="CaixaFreela Logo" className={styles.logo} />
          </Link>
          
          <nav className={styles.nav}>
            <NavLink to="/" className={navLinkClass} end>Dashboard</NavLink>
            <NavLink to="/cofrinhos" className={navLinkClass}>Cofrinhos</NavLink>
          </nav>
        </div>

        <div className={styles.centerSection}>
          <div className={styles.monthSelector}>
            <button onClick={() => changeMonth('prev')} className={styles.monthButton} title="Mês anterior">
              <ChevronLeft size={20} />
            </button>
            <span className={styles.monthText}>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</span>
            <button onClick={() => changeMonth('next')} className={styles.monthButton} title="Próximo mês">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className={styles.rightSection}>
          <button onClick={copyPreviousMonth} className={styles.iconButton} title="Copiar dados do mês anterior">
            <Copy size={18} />
            <span>Copiar Mês</span>
          </button>
          <Link to="/perfil" className={styles.profileLink} title={user?.displayName || user?.email}>
            <div className={styles.profileCircle}>{userInitial}</div>
          </Link>
          <button onClick={logout} className={styles.iconButton} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};