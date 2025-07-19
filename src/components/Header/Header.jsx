import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Copy, LogOut, User, Menu, X } from 'lucide-react';
import styles from './Header.module.css';
import logoImg from '../../assets/logo.png';

export const Header = () => {
  const { user, logout } = useAuth();
  const { currentDate, changeMonth, copyPreviousMonth } = useData();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;
  const userInitial = user?.displayName ? user.displayName[0].toUpperCase() : <User size={20} />;

  const handleCloseMenu = () => setIsMenuOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link to="/" className={styles.logoLink} onClick={handleCloseMenu}>
            <img src={logoImg} alt="CaixaFreela Logo" className={styles.logo} />
          </Link>
        </div>

        {/* --- O CONTAINER DO MENU MÓVEL AGORA INCLUI AS AÇÕES --- */}
        <div className={`${styles.navWrapper} ${isMenuOpen ? styles.navOpen : ''}`}>
          <nav className={styles.nav}>
            <NavLink to="/" className={navLinkClass} end onClick={handleCloseMenu}>Dashboard</NavLink>
            <NavLink to="/cofrinhos" className={navLinkClass} onClick={handleCloseMenu}>Cofrinhos</NavLink>
          </nav>
          
          {/* --- AÇÕES DUPLICADAS, APENAS PARA O MENU MÓVEL --- */}
          <div className={styles.mobileActions}>
            <hr className={styles.mobileDivider} />
            <Link to="/perfil" className={styles.mobileProfileLink} onClick={handleCloseMenu}>
              <div className={styles.profileCircle}>{userInitial}</div>
              <span>{user?.displayName || user?.email}</span>
            </Link>
            <button onClick={() => { copyPreviousMonth(); handleCloseMenu(); }} className={styles.mobileButton}>
              <Copy size={18} />
              <span>Copiar Mês Anterior</span>
            </button>
            <button onClick={() => { logout(); handleCloseMenu(); }} className={styles.mobileButton}>
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
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
        
        {/* ESTA SEÇÃO AGORA SÓ APARECE NO DESKTOP */}
        <div className={styles.rightSection}>
          <button onClick={copyPreviousMonth} className={styles.iconButton} title="Copiar dados do mês anterior">
            <Copy size={18} />
            <span className={styles.iconButtonText}>Copiar Mês</span>
          </button>
          <Link to="/perfil" className={styles.profileLink} title={user?.displayName || user?.email}>
            <div className={styles.profileCircle}>{userInitial}</div>
          </Link>
          <button onClick={logout} className={styles.iconButton} title="Sair">
            <LogOut size={18} />
          </button>
        </div>

        <button className={styles.hamburgerButton} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
};