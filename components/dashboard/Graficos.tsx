'use client';

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GraficoTendenciaProps {
  data: Array<{ nombre: string; valor: number }>;
  titulo: string;
  color?: string;
}

export function GraficoLinea({ data, titulo, color = '#3b82f6' }: GraficoTendenciaProps) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{titulo}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="nombre" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Line type="monotone" dataKey="valor" stroke={color} strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraficoBarras({ data, titulo, color = '#3b82f6' }: GraficoTendenciaProps) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{titulo}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="nombre" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Bar dataKey="valor" fill={color} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface GraficoPieProps {
  data: Array<{ nombre: string; valor: number }>;
  titulo: string;
  colores?: string[];
}

export function GraficoPie({ data, titulo, colores = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'] }: GraficoPieProps) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{titulo}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ nombre, percent }) => `${nombre}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="valor"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
