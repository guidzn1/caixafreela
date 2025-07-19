import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import toast from 'react-hot-toast';
import logoImg from '../../assets/logo_azul.png';
import { GoogleIcon } from '../../components/GoogleIcon/GoogleIcon';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const promise = login(email, password);

    toast.promise(promise, {
      loading: 'A verificar as suas credenciais...',
      success: () => {
        navigate('/');
        return 'Login efetuado com sucesso!';
      },
      error: (err) => {
        console.error("Erro detalhado no login:", err);
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/invalid-email':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            return 'E-mail ou senha inválidos.';
          default:
            return 'Ocorreu um erro ao fazer o login.';
        }
      }
    });
  };
  
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
      toast.success('Login com Google efetuado com sucesso!');
    } catch (error) {
      console.error("Erro no login com Google:", error);
      toast.error("Falha ao fazer login com o Google.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <img src={logoImg} alt="CaixaFreela Logo" className={styles.loginLogo} />
        <form onSubmit={handleEmailSubmit} className={styles.form}>
          <h2>Entrar</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.button}>Entrar</button>
          
          <div className={styles.divider}>
            <span>OU</span>
          </div>
          
          <button type="button" onClick={handleGoogleSignIn} className={styles.googleButton}>
            <GoogleIcon />
            <span>Entrar com Google</span>
          </button>

          <p className={styles.linkText}>
            Não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>
        </form>
      </div>
    </div>
  );
};