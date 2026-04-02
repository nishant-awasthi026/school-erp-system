'use client';

import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

interface MetricValue {
  value: number;
  labels: Record<string, string | number>;
}

interface Metric {
  name: string;
  help: string;
  type: string;
  values: MetricValue[];
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/metrics/dashboard');
        const json = await res.json();
        if (json.success) {
          setMetrics(json.data);
        } else {
          setError(json.error || 'Failed to fetch metrics');
        }
      } catch (err) {
        setError('Connection error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center text-muted">Loading metrics...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  // Process data for charts
  const requestCountMetric = metrics.find(m => m.name === 'http_request_count');
  const requestDurationMetric = metrics.find(m => m.name === 'http_request_duration_seconds');
  
  const statusData = requestCountMetric?.values.reduce((acc: any[], v) => {
    const status = v.labels.status_code?.toString() || 'unknown';
    const existing = acc.find(a => a.name === status);
    if (existing) {
      existing.value += v.value;
    } else {
      acc.push({ name: status, value: v.value });
    }
    return acc;
  }, []) || [];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  return (
    <div className="animate-fade-in p-6">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title text-2xl font-bold">System Monitoring</h1>
          <p className="page-subtitle text-muted">Real-time infrastructure and application metrics</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Request Status Pie Chart */}
        <div className="card bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">HTTP Status Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Request Rates / Simple Bar */}
        <div className="card bg-white p-6 rounded-xl border border-gray-100 shadow-sm col-span-1 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Requests by Route</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestCountMetric?.values.slice(0, 5) || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="labels.route" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <h2 className="text-lg font-semibold mb-4">All Registered Metrics</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Metric Name</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Help</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {metrics.map((m) => (
                <tr key={m.name} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-mono text-blue-600">{m.name}</td>
                  <td className="py-3 px-4 text-xs font-medium">
                    <span className="px-2 py-1 bg-gray-100 rounded uppercase">{m.type}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{m.help}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
