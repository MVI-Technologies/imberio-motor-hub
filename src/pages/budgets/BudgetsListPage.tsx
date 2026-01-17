import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Download, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { exportBudgetToPDF } from '@/lib/pdfExport';

export default function BudgetsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();
  const { budgets } = useData();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/operador';
  
  let filteredBudgets = budgets;
  
  if (statusFilter !== 'all') {
    filteredBudgets = filteredBudgets.filter(b => b.status === statusFilter);
  }
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredBudgets = filteredBudgets.filter(b => 
      b.client_name.toLowerCase().includes(query) ||
      b.motor?.marca?.toLowerCase().includes(query) ||
      b.motor?.modelo?.toLowerCase().includes(query)
    );
  }
  
  // Sort by date descending
  filteredBudgets = [...filteredBudgets].sort((a, b) => 
    new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  return (
    <DashboardLayout 
      title="Orçamentos" 
      subtitle={`${budgets.length} orçamentos registrados`}
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1 max-w-md">
          <div className="search-industrial">
            <Search className="w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por cliente ou motor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Budgets Table */}
      {filteredBudgets.length > 0 ? (
        <div className="card-industrial overflow-x-auto">
          <table className="table-industrial">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Motor</th>
                <th>Data</th>
                <th className="text-right">Valor</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.map((budget) => (
                <tr key={budget.id}>
                  <td className="font-mono text-sm">
                    #{budget.id.toUpperCase().substring(0, 6)}
                  </td>
                  <td className="font-medium">{budget.client_name}</td>
                  <td className="text-muted-foreground">
                    {budget.motor?.marca || ''} {budget.motor?.modelo || ''}
                  </td>
                  <td className="text-muted-foreground">
                    {new Date(budget.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="text-right font-mono font-semibold">
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
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="btn-pdf"
                        onClick={() => exportBudgetToPDF(budget)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`${basePath}/clientes/${budget.client_id}`)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-industrial text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all' 
              ? 'Nenhum orçamento encontrado com os filtros aplicados.' 
              : 'Nenhum orçamento registrado ainda.'
            }
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
