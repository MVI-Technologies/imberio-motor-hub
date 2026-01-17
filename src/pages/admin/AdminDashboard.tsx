import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { 
  Users, 
  FileText, 
  Package, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { clients, budgets, parts } = useData();
  
  const pendingBudgets = budgets.filter(b => b.status === 'pendente').length;
  const approvedBudgets = budgets.filter(b => b.status === 'aprovado').length;
  const completedBudgets = budgets.filter(b => b.status === 'concluido').length;
  
  const totalRevenue = budgets
    .filter(b => b.status === 'concluido')
    .reduce((sum, b) => sum + b.valor_total, 0);

  const stats = [
    { 
      icon: Users, 
      label: 'Clientes', 
      value: clients.length,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      icon: FileText, 
      label: 'Orçamentos', 
      value: budgets.length,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    { 
      icon: Package, 
      label: 'Peças', 
      value: parts.length,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    { 
      icon: TrendingUp, 
      label: 'Faturamento', 
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
  ];

  const statusCards = [
    { icon: Clock, label: 'Pendentes', value: pendingBudgets, color: 'text-warning', bgColor: 'bg-warning/10' },
    { icon: AlertCircle, label: 'Aprovados', value: approvedBudgets, color: 'text-accent', bgColor: 'bg-accent/10' },
    { icon: CheckCircle, label: 'Concluídos', value: completedBudgets, color: 'text-success', bgColor: 'bg-success/10' },
  ];

  const recentBudgets = [...budgets]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Visão geral do sistema"
    >
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="stat-value">{stat.value}</p>
              <p className="stat-label">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Budget Status */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Status dos Orçamentos</h3>
          <div className="space-y-4">
            {statusCards.map((status) => (
              <div key={status.label} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${status.bgColor} flex items-center justify-center`}>
                    <status.icon className={`w-5 h-5 ${status.color}`} />
                  </div>
                  <span className="font-medium">{status.label}</span>
                </div>
                <span className={`text-2xl font-bold ${status.color}`}>{status.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Budgets */}
        <div className="lg:col-span-2 card-industrial">
          <h3 className="text-lg font-semibold mb-4">Orçamentos Recentes</h3>
          {recentBudgets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table-industrial">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Motor</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBudgets.map((budget) => (
                    <tr key={budget.id}>
                      <td className="font-medium">{budget.client_name}</td>
                      <td className="text-muted-foreground">
                        {budget.motor.marca} {budget.motor.modelo}
                      </td>
                      <td className="font-mono">
                        R$ {budget.valor_total.toFixed(2)}
                      </td>
                      <td>
                        <span className={
                          budget.status === 'concluido' ? 'badge-success' :
                          budget.status === 'aprovado' ? 'badge-warning' :
                          'badge-pending'
                        }>
                          {budget.status === 'concluido' ? 'Concluído' :
                           budget.status === 'aprovado' ? 'Aprovado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="text-muted-foreground">
                        {new Date(budget.data).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum orçamento registrado ainda.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
