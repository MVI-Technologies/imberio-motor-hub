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
  Filter,
  FileText
} from 'lucide-react';
import { exportBudgetToPDF, exportMotorHeaderToPDF } from '@/lib/pdfExport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function BudgetsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();
  const { budgets, isLoading, getClient } = useData();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando orçamentos...</p>
        </div>
      </DashboardLayout>
    );
  }
  
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
              <SelectItem value="pre_orcamento">Pré-Orçamento</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="baixado">Baixado</SelectItem>
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
                      budget.status === 'baixado' ? 'badge-success' :
                      budget.status === 'concluido' ? 'badge-warning' :
                      budget.status === 'pre_orcamento' ? 'px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'badge-pending'
                    }>
                      {budget.status === 'baixado' ? 'Baixado' :
                       budget.status === 'concluido' ? 'Concluído' : 
                       budget.status === 'pre_orcamento' ? 'Pré-Orçamento' : 'Pendente'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="btn-pdf"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => exportBudgetToPDF(budget)}>
                            <FileText className="w-4 h-4 mr-2" />
                            PDF do Orçamento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const client = getClient(budget.client_id);
                            const clientPhone = client?.telefone || client?.celular || '';
                            exportMotorHeaderToPDF(budget, clientPhone);
                          }}>
                            <Download className="w-4 h-4 mr-2" />
                            PDF do Cabeçário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`${basePath}/orcamento/${budget.id}`)}
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
