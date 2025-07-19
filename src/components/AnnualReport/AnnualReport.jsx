import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './AnnualReport.module.css';

export const AnnualReport = ({ data }) => {
  const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `${value / 1000}k`} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} formatter={(value) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="Entradas" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Saídas" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};