import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../login/LoginPage.module.css';
import toast from 'react-hot-toast';
import { GoogleIcon } from '../../components/GoogleIcon/GoogleIcon';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('As senhas não coincidem');
    }
    if (password.length < 6) {
        return toast.error('A senha precisa ter no mínimo 6 caracteres.');
    }

    const promise = signup(email, password, name);

    toast.promise(promise, {
        loading: 'A criar a sua conta...',
        success: () => {
            navigate('/');
            return 'Conta criada com sucesso! Bem-vindo(a)!';
        },
        error: (err) => {
            console.error("Erro detalhado no cadastro:", err);
            if (err.code === 'auth/email-already-in-use') {
                return 'Este endereço de e-mail já foi cadastrado.';
            }
            return 'Ocorreu um erro ao criar a conta.';
        }
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
      toast.success('Cadastro com Google efetuado com sucesso!');
    } catch (error) {
      console.error("Erro no cadastro com Google:", error);
      toast.error("Falha ao se cadastrar com o Google.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <form onSubmit={handleEmailSubmit} className={styles.form}>
          <h2>Criar Conta</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Nome</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className={styles.button}>Cadastrar</button>
          
          <div className={styles.divider}>
            <span>OU</span>
          </div>

          <button type="button" onClick={handleGoogleSignIn} className={styles.googleButton}>
            <GoogleIcon />
            <span>Cadastrar com Google</span>
          </button>

          <p className={styles.linkText}>
            Já tem uma conta? <Link to="/login">Faça o login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};