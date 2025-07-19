import { useState } from 'react';
import { Header } from '../../components/Header/Header';
import { CofrinhoCard } from '../../components/CofrinhoCard/CofrinhoCard';
import { CofrinhoModal } from '../../components/CofrinhoModal/CofrinhoModal';
import { useData } from '../../contexts/DataContext';
import styles from './CofrinhosPage.module.css';
import toast from 'react-hot-toast';

export const CofrinhosPage = () => {
  const { cofrinhos, cofrinhosLoading, addCofrinho, deleteCofrinho, updateCofrinhoValue } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveCofrinho = async (cofrinhoData) => {
    await addCofrinho(cofrinhoData);
    toast.success("Cofrinho criado com sucesso!");
    setIsModalOpen(false);
  };

  const handleDelete = async (cofrinhoId) => {
    if(window.confirm("Tem certeza que deseja excluir este cofrinho? Esta ação não pode ser desfeita.")) {
      await deleteCofrinho(cofrinhoId);
      toast.success("Cofrinho excluído.");
    }
  };

  const handleDeposit = (cofrinho, type) => {
    const amount = parseFloat(prompt(`Digite o valor para ${type === 'deposit' ? 'depositar' : 'retirar'}:`));
    if (isNaN(amount) || amount <= 0) {
      return toast.error("Por favor, insira um valor válido.");
    }
    updateCofrinhoValue(cofrinho.id, amount, type);
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <h1>Meus Cofrinhos</h1>
          <button onClick={() => setIsModalOpen(true)} className={styles.addButton}>+ Criar Cofrinho</button>
        </div>
        {cofrinhosLoading ? (
          <p>Carregando cofrinhos...</p>
        ) : (
          <div className={styles.grid}>
            {cofrinhos.length > 0 ? (
              cofrinhos.map(c => <CofrinhoCard key={c.id} cofrinho={c} onDelete={handleDelete} onDeposit={handleDeposit} />)
            ) : (
              <p>Você ainda não tem nenhum cofrinho. Que tal criar um?</p>
            )}
          </div>
        )}
      </main>
      <CofrinhoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveCofrinho} />
    </div>
  );
};