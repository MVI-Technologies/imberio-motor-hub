import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Phone, 
  MapPin,
  Calendar,
  Edit,
  ChevronRight
} from 'lucide-react';
import { exportClientToPDF, exportBudgetToPDF } from '@/lib/pdfExport';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getClient, getBudgetsByClient } = useData();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/operador';
  
  const client = getClient(id || '');
  const budgets = getBudgetsByClient(id || '');

  if (!client) {
    return (
      <DashboardLayout title="Cliente não encontrado">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">O cliente solicitado não foi encontrado.</p>
          <Button onClick={() => navigate(basePath)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleNewBudget = () => {
    navigate(`${basePath}/orcamento/novo/${client.id}`);
  };

  const handleExportClient = () => {
    exportClientToPDF(client, budgets);
  };

  return (
    <DashboardLayout 
      title={client.nome}
      subtitle="Detalhes do cliente"
      actions={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button 
            variant="outline" 
            className="btn-pdf"
            onClick={handleExportClient}
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Button 
            className="btn-industrial-accent"
            onClick={handleNewBudget}
          >
            <FileText className="w-4 h-4" />
            Novo Orçamento
          </Button>
        </div>
      }
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="card-industrial">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Informações</h3>
            {isAdmin && (
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium">{client.endereco || '-'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{client.telefone || '-'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Celular</p>
                <p className="font-medium">{client.celular || '-'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Cliente desde</p>
                <p className="font-medium">
                  {new Date(client.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            
            {client.observacoes && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{client.observacoes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Budget History */}
        <div className="lg:col-span-2 card-industrial">
          <h3 className="text-lg font-semibold mb-4">
            Histórico de Orçamentos ({budgets.length})
          </h3>
          
          {budgets.length > 0 ? (
            <div className="space-y-3">
              {budgets.map((budget) => (
                <div 
                  key={budget.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm text-muted-foreground">
                        #{budget.id.toUpperCase().substring(0, 6)}
                      </span>
                      <span className={
                        budget.status === 'concluido' ? 'badge-success' :
                        budget.status === 'aprovado' ? 'badge-warning' :
                        'badge-pending'
                      }>
                        {budget.status === 'concluido' ? 'Concluído' :
                         budget.status === 'aprovado' ? 'Aprovado' : 'Pendente'}
                      </span>
                    </div>
                    <p className="font-medium">
                      {budget.motor?.marca || ''} {budget.motor?.modelo || ''} - {budget.motor?.cv || '-'} CV
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(budget.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        R$ {budget.valor_total.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {budget.items.length} item(s)
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
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
                        onClick={() => navigate(`${basePath}/orcamento/${budget.id}`)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">
                Nenhum orçamento registrado para este cliente.
              </p>
              <Button 
                onClick={handleNewBudget}
                className="btn-industrial-accent"
              >
                <FileText className="w-4 h-4" />
                Criar Primeiro Orçamento
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
