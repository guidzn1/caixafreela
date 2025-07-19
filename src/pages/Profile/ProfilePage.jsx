import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Header } from '../../components/Header/Header';
import styles from './ProfilePage.module.css';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const { user, updateUserPassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState(''); // NOVO ESTADO
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Por favor, insira sua senha atual.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As novas senhas não coincidem.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha precisa ter no mínimo 6 caracteres.");
      return;
    }

    // A função agora espera a senha atual e a nova senha
    const promise = updateUserPassword(currentPassword, newPassword);

    toast.promise(promise, {
      loading: 'Atualizando senha...',
      success: 'Senha atualizada com sucesso!',
      error: (err) => {
        // Fornece feedback mais específico para o erro de senha incorreta
        if (err.code === 'auth/wrong-password') {
          return 'A senha atual está incorreta.';
        }
        return 'Ocorreu um erro ao atualizar a senha.';
      }
    });

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className={styles.profilePage}>
      <Header />
      <main className={styles.mainContent}>
        <div className={styles.profileContainer}>
          <h2>Perfil do Usuário</h2>
          <div className={styles.userInfo}>
            <strong>Email:</strong>
            <span>{user?.email}</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.passwordForm}>
            <h3>Alterar Senha</h3>
            {/* NOVO CAMPO PARA A SENHA ATUAL */}
            <div className={styles.inputGroup}>
              <label htmlFor="currentPassword">Senha Atual</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <hr className={styles.divider} />
            <div className={styles.inputGroup}>
              <label htmlFor="newPassword">Nova Senha</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.saveButton}>Salvar Nova Senha</button>
          </form>
        </div>
      </main>
    </div>
  );
};