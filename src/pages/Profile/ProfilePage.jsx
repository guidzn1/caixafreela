import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';
import { Header } from '../../components/Header/Header';
import { AnnualReport } from '../../components/AnnualReport/AnnualReport';
import styles from './ProfilePage.module.css';
import toast from 'react-hot-toast';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { X } from 'lucide-react';

const getMonthName = (monthNumber) => {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString('pt-BR', { month: 'short' });
};

export const ProfilePage = () => {
  const { user, updateUserPassword } = useAuth();
  const { categorias, updateCategorias } = useData();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [annualData, setAnnualData] = useState([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [annualTotal, setAnnualTotal] = useState(0);

  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    if (categorias.find(cat => cat.toLowerCase() === newCategory.toLowerCase())) {
      return toast.error("Essa categoria já existe.");
    }
    const newArray = [...categorias, newCategory];
    await updateCategorias(newArray);
    setNewCategory('');
    toast.success("Categoria adicionada!");
  };

  const handleDeleteCategory = async (categoryToDelete) => {
    if (categorias.length <= 1) {
        return toast.error("Você deve ter pelo menos uma categoria.");
    }
    const newArray = categorias.filter(cat => cat !== categoryToDelete);
    await updateCategorias(newArray);
    toast.success("Categoria removida!");
  };

  useEffect(() => {
    const fetchAnnualData = async () => {
      if (!user) return;
      setReportLoading(true);

      const startOfYear = `${selectedYear}-01`;
      const endOfYear = `${selectedYear}-12`;
      
      const mesesRef = collection(db, 'users', user.uid, 'meses');
      const q = query(mesesRef, where(documentId(), '>=', startOfYear), where(documentId(), '<=', endOfYear));
      
      const querySnapshot = await getDocs(q);
      
      const monthsData = Array.from({ length: 12 }, (_, i) => ({
        name: getMonthName(i + 1).replace('.', '').charAt(0).toUpperCase() + getMonthName(i + 1).replace('.', '').slice(1),
        Entradas: 0,
        Saídas: 0,
      }));

      let totalFaturadoNoAno = 0;

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const monthIndex = parseInt(doc.id.split('-')[1], 10) - 1;
        
        const totalEntradas = data.entradas.reduce((acc, t) => acc + (t.valorReal || 0), 0);
        const totalSaidas = data.saidas.reduce((acc, t) => acc + (t.valorReal || 0), 0);

        monthsData[monthIndex].Entradas = totalEntradas;
        monthsData[monthIndex].Saídas = totalSaidas;

        totalFaturadoNoAno += totalEntradas;
      });

      setAnnualData(monthsData);
      setAnnualTotal(totalFaturadoNoAno);
      setReportLoading(false);
    };

    fetchAnnualData();
  }, [user, selectedYear]);

  const handlePasswordSubmit = async (e) => {
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
    const promise = updateUserPassword(currentPassword, newPassword);
    toast.promise(promise, {
      loading: 'Atualizando senha...',
      success: 'Senha atualizada com sucesso!',
      error: (err) => {
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

  const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

          <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
            <h3>Alterar Senha</h3>
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
        
        <div className={styles.profileContainer}>
          <h2>Gerir Categorias de Saída</h2>
          <div className={styles.categoryList}>
            {categorias.map(cat => (
              <div key={cat} className={styles.categoryTag}>
                <span>{cat}</span>
                <button onClick={() => handleDeleteCategory(cat)} title={`Excluir categoria ${cat}`}><X size={14} /></button>
              </div>
            ))}
          </div>
          <div className={styles.addCategoryForm}>
            <input 
              type="text" 
              value={newCategory} 
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nome da nova categoria"
            />
            <button onClick={handleAddCategory}>Adicionar</button>
          </div>
        </div>

        <div className={styles.reportContainer}>
          <h2>Relatório Anual</h2>
          <div className={styles.yearSelector}>
            <button onClick={() => setSelectedYear(y => y - 1)}>&lt;</button>
            <span>{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)}>&gt;</button>
          </div>
          {reportLoading ? (
            <p>A carregar o relatório...</p>
          ) : (
            <>
              <div className={styles.totalCard}>
                <span>Faturamento Total em {selectedYear}</span>
                <p>{formatCurrency(annualTotal)}</p>
              </div>
              <AnnualReport data={annualData} />
            </>
          )}
        </div>
      </main>
    </div>
  );
};