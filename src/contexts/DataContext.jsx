import { createContext, useState, useEffect, useContext } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
  addDoc,
  deleteDoc,
  runTransaction,
  arrayUnion // Import que faltava
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { format, subMonths, addMonths } from 'date-fns';
import toast from 'react-hot-toast';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Estados para dados mensais
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para a IA
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');

  // Estados para os Cofrinhos
  const [cofrinhos, setCofrinhos] = useState([]);
  const [cofrinhosLoading, setCofrinhosLoading] = useState(true);

  const monthId = format(currentDate, 'yyyy-MM');

  // useEffect para buscar dados MENSAIS
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setMonthlyData(null);
      return;
    }
    setLoading(true);
    setAiAnalysis('');
    const docRef = doc(db, 'users', user.uid, 'meses', monthId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setMonthlyData(docSnap.data());
      } else {
        const defaultData = {
          entradas: [],
          saidas: [],
          saldoInicial: 0,
        };
        setDoc(docRef, defaultData);
        setMonthlyData(defaultData);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, monthId]);

  // useEffect para buscar os COFRINHOS
  useEffect(() => {
    if (!user) {
      setCofrinhos([]);
      setCofrinhosLoading(false);
      return;
    }
    setCofrinhosLoading(true);
    const cofrinhosCollectionRef = collection(db, 'users', user.uid, 'cofrinhos');
    
    const unsubscribe = onSnapshot(cofrinhosCollectionRef, (snapshot) => {
      const cofrinhosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCofrinhos(cofrinhosData);
      setCofrinhosLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Funções ---
  const getDocRef = (targetMonthId = monthId) => {
    if (!user) return null;
    return doc(db, 'users', user.uid, 'meses', targetMonthId);
  };

  const addTransaction = async (type, transactionData) => {
    if (!user) return;

    // LÓGICA DE PARCELAMENTO
    if (type === 'saidas' && transactionData.isParcelado) {
      const { descricao, valorPrevisto, parcelamentoInfo, categoria, data } = transactionData;
      const { total, pagas } = parcelamentoInfo;
      
      if (!total || total <= 0) {
        return toast.error("Número total de parcelas deve ser maior que zero.");
      }

      const valorParcela = valorPrevisto / total;
      const parcelasRestantes = total - pagas;
      const parcelamentoId = crypto.randomUUID();
      const dataInicial = new Date(data + 'T12:00:00');

      toast.loading('A criar transações parceladas...');

      for (let i = 0; i < parcelasRestantes; i++) {
        const parcelaAtual = pagas + i + 1;
        const dataParcela = addMonths(dataInicial, i);
        const futureMonthId = format(dataParcela, 'yyyy-MM');
        const futureDocRef = doc(db, 'users', user.uid, 'meses', futureMonthId);

        const futureTransaction = {
          id: crypto.randomUUID(),
          descricao: `${descricao} (${parcelaAtual}/${total})`,
          data: format(dataParcela, 'yyyy-MM-dd'),
          valorPrevisto: valorParcela,
          valorReal: 0,
          confirmado: false,
          isParcelado: true,
          parcelaInfo: { atual: parcelaAtual, total: total },
          parcelamentoId: parcelamentoId,
          categoria: categoria,
          createdAt: new Date().toISOString()
        };

        const docSnap = await getDoc(futureDocRef);
        if (docSnap.exists()) {
          await updateDoc(futureDocRef, { saidas: arrayUnion(futureTransaction) });
        } else {
          const defaultData = { entradas: [], saidas: [futureTransaction], saldoInicial: 0 };
          await setDoc(futureDocRef, defaultData);
        }
      }
      toast.dismiss();
      toast.success('Compra parcelada adicionada com sucesso!');
    } else { // LÓGICA PARA TRANSAÇÕES NORMAIS E RECORRENTES
      const isRecorrente = transactionData.isRecorrente;
      const recorrenciaId = isRecorrente ? crypto.randomUUID() : null;
      const newTransaction = { ...transactionData, id: crypto.randomUUID(), createdAt: new Date().toISOString(), recorrenciaId };
      const currentDocRef = getDocRef();
      const currentData = monthlyData || { entradas: [], saidas: [], saldoInicial: 0 };
      const currentUpdatedArray = [...currentData[type], newTransaction];
      await updateDoc(currentDocRef, { [type]: currentUpdatedArray });

      if (isRecorrente) {
        toast.loading('A criar transações recorrentes...');
        let lastDate = currentDate;
        for (let i = 0; i < 11; i++) {
          lastDate = addMonths(lastDate, 1);
          const futureMonthId = format(lastDate, 'yyyy-MM');
          const futureDocRef = doc(db, 'users', user.uid, 'meses', futureMonthId);
          const futureTransaction = { ...newTransaction, id: crypto.randomUUID(), data: format(lastDate, 'yyyy-MM-dd'), confirmado: false, valorReal: 0 };
          const docSnap = await getDoc(futureDocRef);
          if (docSnap.exists()) {
            await updateDoc(futureDocRef, { [type]: arrayUnion(futureTransaction) });
          } else {
            const defaultData = { entradas: [], saidas: [], saldoInicial: 0 };
            defaultData[type] = [futureTransaction];
            await setDoc(futureDocRef, defaultData);
          }
        }
        toast.dismiss();
        toast.success('Transação recorrente criada para os próximos 12 meses!');
      }
    }
  };
  
  const updateTransaction = async (type, updatedTransaction) => {
    const docRef = getDocRef();
    if (!docRef || !monthlyData) return;
    const updatedArray = monthlyData[type].map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
    await updateDoc(docRef, { [type]: updatedArray });
  };
  
  const updateSaldoInicial = async (novoSaldo) => {
    const docRef = getDocRef();
    if (!docRef) return;
    await updateDoc(docRef, { saldoInicial: parseFloat(novoSaldo) || 0 });
  };

  const deleteTransaction = async (type, transactionId) => {
    const docRef = getDocRef();
    if (!docRef || !monthlyData) return;
    const updatedArray = monthlyData[type].filter(t => t.id !== transactionId);
    await updateDoc(docRef, { [type]: updatedArray });
  };

  const changeMonth = (direction) => {
    if (direction === 'next') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else {
      setCurrentDate(prev => subMonths(prev, 1));
    }
  };

  const copyPreviousMonth = async () => { /* ... (sem alteração) ... */ };
  const getFinancialAnalysis = async () => { /* ... (sem alteração) ... */ };
  const addCofrinho = async (cofrinhoData) => { /* ... (sem alteração) ... */ };
  const deleteCofrinho = async (cofrinhoId) => { /* ... (sem alteração) ... */ };
  const updateCofrinhoValue = async (cofrinhoId, amount, type) => { /* ... (sem alteração) ... */ };

  const value = {
    monthlyData, loading, currentDate, addTransaction, updateTransaction, deleteTransaction,
    updateSaldoInicial, aiAnalysis, isAiLoading, getFinancialAnalysis, changeMonth, copyPreviousMonth,
    cofrinhos, cofrinhosLoading, addCofrinho, deleteCofrinho, updateCofrinhoValue
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);