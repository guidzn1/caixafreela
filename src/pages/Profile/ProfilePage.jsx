import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';
import { Header } from '../../components/Header/Header';
import { AnnualReport } from '../../components/AnnualReport/AnnualReport';
import { ClientModal } from '../../components/ClientModal/ClientModal';
import styles from './ProfilePage.module.css';
import toast from 'react-hot-toast';
import {
  collection,
  query,
  where,
  getDocs,
  documentId
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { X, Edit, Trash2, PlusCircle, Save, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';

const getMonthName = (monthNumber) => {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').replace(/^\w/, c => c.toUpperCase());
};

export const ProfilePage = () => {
  const { user, updateUserPassword } = useAuth();
  const {
    categorias,
    updateCategorias,
    clientes,
    addCliente,
    updateCliente,
    deleteCliente
  } = useData();

  // Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Relatório Anual
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [annualData, setAnnualData] = useState([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [annualTotal, setAnnualTotal] = useState(0);

  // Categorias
  const [newCategory, setNewCategory] = useState('');

  // Modal de Cliente
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);

  // Relatório por Cliente
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportClient, setReportClient] = useState(null);
  const [reportCount, setReportCount] = useState(0);
  const [reportTotal, setReportTotal] = useState(0);
  const [reportLoadingClient, setReportLoadingClient] = useState(false);

  // Handlers para o Modal de Clientes
  const handleOpenClientModal = (client = null) => {
    setClientToEdit(client);
    setIsClientModalOpen(true);
  };
  const handleCloseClientModal = () => {
    setIsClientModalOpen(false);
    setClientToEdit(null);
  };
  const handleSaveCliente = async (clientData) => {
    const promise = clientData.id
      ? updateCliente(clientData.id, clientData)
      : addCliente(clientData);
    toast.promise(promise, {
      loading: 'A salvar cliente...',
      success: `Cliente ${clientData.id ? 'atualizado' : 'adicionado'}!`,
      error: 'Erro ao salvar cliente'
    });
    handleCloseClientModal();
  };
  const handleDeleteCliente = (clienteId) => {
    const confirmDelete = window.confirm('Tem a certeza que deseja excluir este cliente? Todas as transações associadas a ele perderão o vínculo.');
    if (confirmDelete) {
      deleteCliente(clienteId).then(() => {
        toast.success('Cliente excluído!');
      });
    }
  };

  // Handlers para o Relatório de Clientes
  const handleOpenClientReport = async (client) => {
    setReportClient(client);
    setIsReportOpen(true);
    setReportLoadingClient(true);

    try {
      const startOfYear = `${selectedYear}-01`;
      const endOfYear = `${selectedYear}-12`;
      const mesesRef = collection(db, 'users', user.uid, 'meses');
      const q = query(mesesRef, where(documentId(), '>=', startOfYear), where(documentId(), '<=', endOfYear));
      const querySnapshot = await getDocs(q);

      let count = 0;
      let total = 0;

      querySnapshot.forEach(docSnap => {
        const monthData = docSnap.data();
        if (monthData && Array.isArray(monthData.entradas)) {
          monthData.entradas.forEach(transaction => {
            if (transaction.clienteId === client.id) {
              count++;
              total += Number(transaction.valorReal) || 0;
            }
          });
        }
      });

      setReportCount(count);
      setReportTotal(total);
    } catch (err) {
      console.error('Erro ao gerar relatório de cliente:', err);
      toast.error('Falha ao gerar relatório.');
    } finally {
      setReportLoadingClient(false);
    }
  };
  const handleCloseClientReport = () => {
    setIsReportOpen(false);
    setReportClient(null);
  };
  
  // Handlers para Categorias
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    if (categorias.find(cat => cat.toLowerCase() === newCategory.toLowerCase())) {
      return toast.error("Essa categoria já existe.");
    }
    const newArray = [...categorias, newCategory.trim()];
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

  // Busca de Dados Anuais
  useEffect(() => {
    if (!user) return;
    const fetchAnnualData = async () => {
      setReportLoading(true);
      try {
        const startOfYear = `${selectedYear}-01`;
        const endOfYear = `${selectedYear}-12`;
        const mesesRef = collection(db, 'users', user.uid, 'meses');
        const q = query(mesesRef, where(documentId(), '>=', startOfYear), where(documentId(), '<=', endOfYear));
        const snap = await getDocs(q);
        
        const months = Array.from({ length: 12 }, (_, i) => ({
          name: getMonthName(i + 1), Entradas: 0, Saídas: 0
        }));
        let totalFaturado = 0;

        snap.forEach(docSnap => {
          const m = parseInt(docSnap.id.split('-')[1], 10) - 1;
          const d = docSnap.data() || {};
          const entradasSum = (d.entradas || []).reduce((a, t) => a + (Number(t.valorReal) || 0), 0);
          const saidasSum = (d.saidas || []).reduce((a, t) => a + (Number(t.valorReal) || 0), 0);
          months[m].Entradas = entradasSum;
          months[m]['Saídas'] = saidasSum;
          totalFaturado += entradasSum;
        });

        setAnnualData(months);
        setAnnualTotal(totalFaturado);
      } catch (err) {
        console.error('Erro ao buscar dados anuais:', err);
        toast.error("Não foi possível carregar os dados anuais.");
      } finally {
        setReportLoading(false);
      }
    };
    fetchAnnualData();
  }, [user, selectedYear]);

  // Handler para Alterar Senha
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword) return toast.error('Insira a senha atual');
    if (newPassword !== confirmPassword) return toast.error('Senhas não coincidem');
    if (newPassword.length < 6) return toast.error('Senha precisa ter no mínimo 6 caracteres');
    
    const promise = updateUserPassword(currentPassword, newPassword);
    toast.promise(promise, {
      loading: 'Atualizando senha...',
      success: 'Senha atualizada!',
      error: err => err.code === 'auth/wrong-password' ? 'Senha atual incorreta' : 'Erro ao atualizar senha'
    });
    
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const formatCurrency = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className={styles.profilePage}>
      <Header />
      <main className={styles.mainContent}>

        <section className={styles.profileContainer}>
          <div className={styles.sectionHeader}>
            <h2>Perfil do Usuário</h2>
          </div>
          <div className={styles.userInfo}>
            <strong>Email:</strong> <span>{user?.email}</span>
          </div>
          <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
            <h3>Alterar Senha</h3>
            <div className={styles.inputGroup}>
              <label htmlFor="currentPassword">Senha Atual</label>
              <input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>
            <hr className={styles.divider}/>
            <div className={styles.inputGroup}>
              <label htmlFor="newPassword">Nova Senha</label>
              <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" required />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirmar Senha</label>
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className={styles.saveButton}>
              <Save size={16} /> Salvar Nova Senha
            </button>
          </form>
        </section>

        <section className={styles.profileContainer}>
          <div className={styles.sectionHeader}>
            <h2>Gerir Clientes</h2>
            <button onClick={() => handleOpenClientModal()} className={styles.addButton}>
              <UserPlus size={16} /> Novo Cliente
            </button>
          </div>
          <div className={styles.itemList}>
            {clientes.length > 0 ? (
              clientes.map(c => (
                <div key={c.id} className={styles.item}>
                  <div className={styles.itemInfo} onClick={() => handleOpenClientReport(c)} title="Ver relatório do cliente">
                    <span className={styles.itemName}>{c.nome}</span>
                    <span className={styles.itemContact}>{c.email || c.telefone}</span>
                  </div>
                  <div className={styles.itemActions}>
                    <button onClick={() => handleOpenClientModal(c)} title="Editar cliente"><Edit size={16}/></button>
                    <button onClick={() => handleDeleteCliente(c.id)} title="Excluir cliente"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyText}>Nenhum cliente cadastrado.</p>
            )}
          </div>
        </section>

        <section className={styles.profileContainer}>
          <div className={styles.sectionHeader}>
            <h2>Gerir Categorias de Saída</h2>
          </div>
          <div className={styles.itemList}>
            {categorias.map(cat => (
              <div key={cat} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{cat}</span>
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => handleDeleteCategory(cat)} title={`Excluir categoria ${cat}`}><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.addCategoryForm}>
            <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nome da nova categoria"/>
            <button onClick={handleAddCategory}>
              <PlusCircle size={16} /> Adicionar
            </button>
          </div>
        </section>

        <section className={styles.reportContainer}>
          <h2>Relatório Anual</h2>
          <div className={styles.yearSelector}>
            <button onClick={() => setSelectedYear(y => y - 1)}><ChevronLeft size={20} /></button>
            <span>{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)}><ChevronRight size={20} /></button>
          </div>
          {reportLoading ? (
            <p className={styles.emptyText}>A carregar o relatório...</p>
          ) : (
            <>
              <div className={styles.totalCard}>
                <span>Faturamento Total em {selectedYear}</span>
                <p>{formatCurrency(annualTotal)}</p>
              </div>
              <AnnualReport data={annualData} />
            </>
          )}
        </section>
      </main>

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={handleCloseClientModal}
        onSave={handleSaveCliente}
        clientToEdit={clientToEdit}
      />
      
      {isReportOpen && (
        <div className={styles.overlay} onClick={handleCloseClientReport}>
          <div className={styles.clientReportModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={handleCloseClientReport}><X size={18}/></button>
            <h3>Relatório de {reportClient?.nome} ({selectedYear})</h3>
            {reportLoadingClient ? (
              <p className={styles.emptyText}>A carregar...</p>
            ) : (
              <div className={styles.reportData}>
                <p><strong>Nº de Serviços/Projetos:</strong> {reportCount}</p>
                <p><strong>Total Faturado:</strong> {formatCurrency(reportTotal)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};