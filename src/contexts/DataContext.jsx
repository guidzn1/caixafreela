// src/contexts/DataContext.jsx

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
  arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { format, subMonths, addMonths } from 'date-fns';
import toast from 'react-hot-toast';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [cofrinhos, setCofrinhos] = useState([]);
  const [cofrinhosLoading, setCofrinhosLoading] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clientesLoading, setClientesLoading] = useState(true);

  const monthId = format(currentDate, 'yyyy-MM');

  // Carrega dados do mês atual
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
        const defaultData = { entradas: [], saidas: [], saldoInicial: 0 };
        setDoc(docRef, defaultData);
        setMonthlyData(defaultData);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, monthId]);

  // Carrega cofrinhos
  useEffect(() => {
    if (!user) {
      setCofrinhos([]);
      setCofrinhosLoading(false);
      return;
    }
    setCofrinhosLoading(true);
    const cofrinhosCollectionRef = collection(db, 'users', user.uid, 'cofrinhos');
    
    const unsubscribe = onSnapshot(cofrinhosCollectionRef, (snapshot) => {
      const cofrinhosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCofrinhos(cofrinhosData);
      setCofrinhosLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Carrega categorias
  useEffect(() => {
    if (!user) {
      setCategorias([]);
      return;
    }
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setCategorias(docSnap.data().categorias || []);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Carrega clientes
  useEffect(() => {
    if (!user) {
      setClientes([]);
      setClientesLoading(false);
      return;
    }
    setClientesLoading(true);
    const clientesCollectionRef = collection(db, 'users', user.uid, 'clientes');
    
    const unsubscribe = onSnapshot(clientesCollectionRef, (snapshot) => {
      const clientesData = snapshot.docs.map(doc => ({
        ...doc.data(),    // espalha os campos do documento
        id: doc.id        // depois define o id corretamente
      }));
      setClientes(clientesData);
      setClientesLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getDocRef = (targetMonthId = monthId) => {
    if (!user) return null;
    return doc(db, 'users', user.uid, 'meses', targetMonthId);
  };

  const addTransaction = async (type, transactionData) => {
    if (!user) return;
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
          parcelaInfo: { atual: parcelaAtual, total },
          parcelamentoId,
          categoria,
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
    } else {
      const { isRecorrente, mesesRecorrencia } = transactionData;
      const recorrenciaId = isRecorrente ? crypto.randomUUID() : null;
      const newTransaction = {
        ...transactionData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        recorrenciaId
      };
      const currentDocRef = getDocRef();
      const currentData = monthlyData || { entradas: [], saidas: [], saldoInicial: 0 };
      const currentUpdatedArray = [...currentData[type], newTransaction];
      await updateDoc(currentDocRef, { [type]: currentUpdatedArray });

      if (isRecorrente) {
        const numMeses = Math.max(2, Math.min(mesesRecorrencia || 2, 60));
        toast.loading('A criar transações recorrentes...');
        let lastDate = currentDate;
        for (let i = 0; i < numMeses - 1; i++) {
          lastDate = addMonths(lastDate, 1);
          const futureMonthId = format(lastDate, 'yyyy-MM');
          const futureDocRef = doc(db, 'users', user.uid, 'meses', futureMonthId);
          const futureTransaction = {
            ...newTransaction,
            id: crypto.randomUUID(),
            data: format(lastDate, 'yyyy-MM-dd'),
            confirmado: false,
            valorReal: 0
          };
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
        toast.success(`Transação recorrente criada para os próximos ${numMeses} meses!`);
      }
    }
  };

  const updateTransaction = async (type, updatedTransaction) => {
    const docRef = getDocRef();
    if (!docRef || !monthlyData) return;
    const updatedArray = monthlyData[type].map(t =>
      t.id === updatedTransaction.id ? updatedTransaction : t
    );
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

  const copyPreviousMonth = async () => {
    const confirmCopy = await new Promise(resolve => {
      resolve(window.confirm("Isso substituirá todos os dados do mês atual. Deseja continuar?"));
    });
    if (!confirmCopy) return;

    const previousMonth = subMonths(currentDate, 1);
    const previousMonthId = format(previousMonth, 'yyyy-MM');
    const prevDocRef = getDocRef(previousMonthId);
    const currentDocRef = getDocRef();

    const promise = getDoc(prevDocRef).then(docSnap => {
      if (docSnap.exists()) {
        const prevData = docSnap.data();
        const newEntradas = prevData.entradas.map(e => ({
          ...e,
          confirmado: false,
          valorReal: 0
        }));
        const newSaidas = prevData.saidas.map(s => ({
          ...s,
          confirmado: false,
          valorReal: 0
        }));
        return setDoc(currentDocRef, {
          ...prevData,
          saldoInicial: prevData.saldoInicial,
          entradas: newEntradas,
          saidas: newSaidas
        });
      } else {
        throw new Error("Nenhum dado encontrado para o mês anterior.");
      }
    });

    toast.promise(promise, {
      loading: 'Copiando dados...',
      success: 'Dados copiados com sucesso!',
      error: err => err.message
    });
  };

  const getFinancialAnalysis = async () => {
    if (!monthlyData) return;
    setIsAiLoading(true);
    setAiAnalysis('');
    const { saldoInicial, entradas, saidas } = monthlyData;
    const totalEntradasReal = entradas.reduce((acc, t) => acc + (t.valorReal || 0), 0);
    const totalSaidasReal = saidas.reduce((acc, t) => acc + (t.valorReal || 0), 0);
    const saldoFinalReal = (saldoInicial || 0) + totalEntradasReal - totalSaidasReal;

    const userDataForPrompt = `
- Saldo Inicial: ${(saldoInicial || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
- Total de Entradas Realizadas: ${totalEntradasReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${entradas.length} transações)
- Total de Saídas Realizadas: ${totalSaidasReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${saidas.length} transações)
- Saldo Final Real: ${saldoFinalReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
`;

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error("Chave de API da Groq não encontrada.");
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "Você é um consultor financeiro para freelancers no Brasil. Sua resposta deve ser concisa, em português, com 3 a 4 tópicos (bullet points usando *), e incluir uma dica prática. Use um tom amigável e profissional."
            },
            {
              role: "user",
              content: `Analise os seguintes dados financeiros do meu mês e me dê um resumo: ${userDataForPrompt}`
            }
          ],
          model: "llama3-8b-8192"
        })
      });
      if (!response.ok) {
        const errorBody = await response.json();
        console.error("API Error Body:", errorBody);
        throw new Error(`Falha na resposta da API da Groq: ${response.statusText}`);
      }
      const result = await response.json();
      setAiAnalysis(result.choices[0]?.message?.content || "Não foi possível obter uma análise.");
    } catch (error) {
      console.error("Erro na API Groq:", error);
      setAiAnalysis("Desculpe, não foi possível gerar a análise. Verifique sua chave de API e a conexão.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const addCofrinho = async (cofrinhoData) => {
    if (!user) return;
    const cofrinhosCollectionRef = collection(db, 'users', user.uid, 'cofrinhos');
    await addDoc(cofrinhosCollectionRef, {
      ...cofrinhoData,
      createdAt: new Date().toISOString()
    });
  };

  const deleteCofrinho = async (cofrinhoId) => {
    if (!user || !cofrinhoId) return;
    const cofrinhoDocRef = doc(db, 'users', user.uid, 'cofrinhos', cofrinhoId);
    await deleteDoc(cofrinhoDocRef);
  };

  const updateCofrinhoValue = async (cofrinhoId, amount, type) => {
    if (!user || !amount) return;
    const cofrinhoDocRef = doc(db, 'users', user.uid, 'cofrinhos', cofrinhoId);
    try {
      await runTransaction(db, async (transaction) => {
        const cofrinhoDoc = await transaction.get(cofrinhoDocRef);
        if (!cofrinhoDoc.exists()) throw "Cofrinho não encontrado!";
        const currentAmount = cofrinhoDoc.data().valorAtual || 0;
        const newAmount = type === 'deposit' ? currentAmount + amount : currentAmount - amount;
        if (newAmount < 0) throw "Saldo do cofrinho não pode ser negativo!";
        transaction.update(cofrinhoDocRef, { valorAtual: newAmount });
      });
      toast.success("Operação realizada com sucesso!");
    } catch (e) {
      console.error("Erro na transação do cofrinho:", e);
      toast.error(`Falha na operação: ${e}`);
    }
  };

  const updateCategorias = async (newCategoriasArray) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, { categorias: newCategoriasArray });
  };

  const addCliente = async (clienteData) => {
    if (!user) return;
    const clientesCollectionRef = collection(db, 'users', user.uid, 'clientes');
    await addDoc(clientesCollectionRef, {
      nome: clienteData.nome,
      email: clienteData.email,
      telefone: clienteData.telefone,
      createdAt: new Date().toISOString()
    });
  };

  const updateCliente = async (clienteId, clienteData) => {
    if (!user || !clienteId) return;
    const clienteDocRef = doc(db, 'users', user.uid, 'clientes', clienteId);
    await updateDoc(clienteDocRef, clienteData);
  };

  const deleteCliente = async (clienteId) => {
    if (!user || !clienteId) {
      console.error("ID de cliente inválido para exclusão:", clienteId);
      return;
    }
    const clienteDocRef = doc(db, 'users', user.uid, 'clientes', clienteId);
    await deleteDoc(clienteDocRef);
  };

  const value = {
    monthlyData,
    loading,
    currentDate,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateSaldoInicial,
    aiAnalysis,
    isAiLoading,
    getFinancialAnalysis,
    changeMonth,
    copyPreviousMonth,
    cofrinhos,
    cofrinhosLoading,
    addCofrinho,
    deleteCofrinho,
    updateCofrinhoValue,
    categorias,
    updateCategorias,
    clientes,
    clientesLoading,
    addCliente,
    updateCliente,
    deleteCliente
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
