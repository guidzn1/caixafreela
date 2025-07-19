import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useData } from '../../contexts/DataContext';
import styles from './ReportsSection.module.css';

export const ReportsSection = () => {
  const { monthlyData, aiAnalysis, isAiLoading, getFinancialAnalysis } = useData();

  const chartData = useMemo(() => {
    if (!monthlyData) return { barData: [], pieData: [] };
    
    const totalEntradasReal = monthlyData.entradas.reduce((acc, t) => acc + (t.valorReal || 0), 0);
    const totalSaidasReal = monthlyData.saidas.reduce((acc, t) => acc + (t.valorReal || 0), 0);
    
    const pieData = monthlyData.saidas
      .filter(s => s.valorReal > 0)
      .map(s => ({ name: s.categoria, value: s.valorReal }));

    return {
      barData: [{ name: 'Mês', Entradas: totalEntradasReal, Saídas: totalSaidasReal }],
      pieData: pieData
    };
  }, [monthlyData]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0'];

  return (
    <div className={styles.reportsContainer}>
      <h2>Relatórios e Análise</h2>
      <div className={styles.contentGrid}>
        <div className={styles.chartWrapper}>
          <h3>Fluxo de Caixa (Realizado)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.barData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
              <Tooltip formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              <Legend />
              <Bar dataKey="Entradas" fill="var(--color-success)" />
              <Bar dataKey="Saídas" fill="var(--color-danger)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.chartWrapper}>
          <h3>Composição das Saídas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {chartData.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={`${styles.chartWrapper} ${styles.aiWrapper}`}>
          <h3>Análise Inteligente com IA</h3>
          <button onClick={getFinancialAnalysis} disabled={isAiLoading} className={styles.aiButton}>
            {isAiLoading ? 'Analisando...' : '✨ Gerar Análise'}
          </button>
          {aiAnalysis && (
            <div className={styles.aiResult}>
              <p>{aiAnalysis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};