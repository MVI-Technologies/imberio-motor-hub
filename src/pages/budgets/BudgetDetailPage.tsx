import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Download, 
  Edit,
  Trash2,
  Save,
  X,
  Cog,
  FileText,
  User,
  Calendar,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { exportBudgetToPDF, exportMotorHeaderToPDF } from '@/lib/pdfExport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getBudget, updateBudget, deleteBudget, isLoading } = useData();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/operador';
  
  const budget = getBudget(id || '');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    laudo_tecnico: budget?.laudo_tecnico || '',
    observacoes: budget?.observacoes || '',
    status: budget?.status || 'pendente' as 'pre_orcamento' | 'pendente' | 'concluido' | 'baixado',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do orçamento...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!budget) {
    return (
      <DashboardLayout title="Orçamento não encontrado">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">O orçamento solicitado não foi encontrado.</p>
          <Button onClick={() => navigate(basePath)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleEdit = () => {
    setEditData({
      laudo_tecnico: budget.laudo_tecnico || '',
      observacoes: budget.observacoes || '',
      status: budget.status || 'pendente',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      laudo_tecnico: budget.laudo_tecnico || '',
      observacoes: budget.observacoes || '',
      status: budget.status || 'pendente',
    });
  };

  const handleSaveEdit = async () => {
    await updateBudget(budget.id, editData);
    setIsEditing(false);
    toast.success('Orçamento atualizado com sucesso!');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteBudget(budget.id);
    setIsDeleting(false);
    
    if (success) {
      toast.success('Orçamento excluído com sucesso!');
      navigate(`${basePath}/orcamentos`);
    } else {
      toast.error('Erro ao excluir orçamento');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pre_orcamento':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Pré-Orçamento</span>;
      case 'baixado':
        return <span className="badge-success">Baixado</span>;
      case 'concluido':
        return <span className="badge-warning">Concluído</span>;
      default:
        return <span className="badge-pending">Pendente</span>;
    }
  };

  // Opções de status baseadas no role do usuário
  const getStatusOptions = () => {
    const currentStatus = budget?.status || 'pendente';
    
    if (isAdmin) {
      // Admin pode mudar para qualquer status
      return ['pre_orcamento', 'pendente', 'concluido', 'baixado'];
    } else {
      // Operador
      if (currentStatus === 'pre_orcamento') {
        return ['pre_orcamento', 'pendente']; // Pode converter para orçamento
      } else if (currentStatus === 'pendente') {
        return ['pendente', 'concluido'];
      } else if (currentStatus === 'concluido') {
        return ['concluido']; // Não pode voltar nem avançar
      } else {
        return [currentStatus]; // Baixado - não pode mudar
      }
    }
  };

  // Converter pré-orçamento em orçamento
  const handleConvertToOrcamento = async () => {
    if (budget.items.length === 0) {
      toast.error('Adicione peças e serviços antes de converter para orçamento.');
      return;
    }
    setIsConverting(true);
    await updateBudget(budget.id, { status: 'pendente' });
    setIsConverting(false);
    toast.success('Pré-orçamento convertido em orçamento!');
  };

  return (
    <DashboardLayout 
      title={`Orçamento #${budget.id.toUpperCase().substring(0, 8)}`}
      subtitle={`Cliente: ${budget.client_name}`}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="btn-pdf">
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportBudgetToPDF(budget)}>
                <FileText className="w-4 h-4 mr-2" />
                PDF do Orçamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportMotorHeaderToPDF(budget)}>
                <Download className="w-4 h-4 mr-2" />
                PDF do Cabeçário
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {!isEditing ? (
            <>
              {budget.status === 'pre_orcamento' && (
                <Button 
                  onClick={handleConvertToOrcamento}
                  disabled={isConverting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isConverting ? 'Convertendo...' : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Converter em Orçamento
                    </>
                  )}
                </Button>
              )}
              
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Excluindo...' : 'Excluir'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} className="btn-industrial-accent">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="card-industrial flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-semibold">{budget.client_name}</p>
            </div>
          </div>
          
          <div className="card-industrial flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-semibold">{new Date(budget.data).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          
          <div className="card-industrial flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {isEditing ? (
                <Select 
                  value={editData.status} 
                  onValueChange={(v) => setEditData(prev => ({ ...prev, status: v as 'pre_orcamento' | 'pendente' | 'concluido' | 'baixado' }))}
                  disabled={getStatusOptions().length <= 1}
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatusOptions().includes('pre_orcamento') && (
                      <SelectItem value="pre_orcamento">Pré-Orçamento</SelectItem>
                    )}
                    {getStatusOptions().includes('pendente') && (
                      <SelectItem value="pendente">Pendente</SelectItem>
                    )}
                    {getStatusOptions().includes('concluido') && (
                      <SelectItem value="concluido">Concluído</SelectItem>
                    )}
                    {getStatusOptions().includes('baixado') && (
                      <SelectItem value="baixado">Baixado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                getStatusBadge(budget.status)
              )}
            </div>
          </div>
          
          <div className="card-industrial flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
              <span className="text-xl font-bold text-accent">R$</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="font-bold text-xl text-primary">R$ {budget.valor_total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Motor Data */}
        <div className="card-industrial">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cog className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Dados Técnicos do Motor</h3>
              <p className="text-sm text-muted-foreground">Especificações do motor</p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Equipamento</p>
              <p className="font-medium">{budget.motor?.equipamento || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Marca</p>
              <p className="font-medium">{budget.motor?.marca || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Modelo</p>
              <p className="font-medium">{budget.motor?.modelo || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Nº Série</p>
              <p className="font-medium">{budget.motor?.numero_serie || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">CV</p>
              <p className="font-medium">{budget.motor?.cv || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Tensão</p>
              <p className="font-medium">{budget.motor?.tensao || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Passe</p>
              <p className="font-medium">{budget.motor?.passe || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Espiras</p>
              <p className="font-medium">{budget.motor?.espiras || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Nº Fios</p>
              <p className="font-medium">{budget.motor?.fios || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Ligação</p>
              <p className="font-medium">{budget.motor?.ligacao || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">RPM</p>
              <p className="font-medium">{budget.motor?.rpm || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Tipo</p>
              <p className="font-medium">{budget.motor?.tipo || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Diâm. Externo</p>
              <p className="font-medium">{budget.motor?.diametro_externo || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Comp. Externo</p>
              <p className="font-medium">{budget.motor?.comprimento_externo || '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Original</p>
              <p className="font-medium">{budget.motor?.original ? 'Sim' : 'Não'}</p>
            </div>
          </div>
        </div>

        {/* Laudo Técnico */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Laudo Técnico</h3>
          {isEditing ? (
            <Textarea
              value={editData.laudo_tecnico}
              onChange={(e) => setEditData(prev => ({ ...prev, laudo_tecnico: e.target.value }))}
              placeholder="Descreva o problema encontrado, diagnóstico e serviços necessários..."
              rows={4}
            />
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {budget.laudo_tecnico || 'Nenhum laudo técnico registrado.'}
            </p>
          )}
        </div>

        {/* Items */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Peças e Serviços</h3>
          
          {budget.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table-industrial">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Qtd</th>
                    <th className="text-right">Valor Unit.</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {budget.items.map(item => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.part_name}</td>
                      <td className="text-center">{item.quantidade}</td>
                      <td className="text-right font-mono">R$ {item.valor_unitario.toFixed(2)}</td>
                      <td className="text-right font-mono font-semibold">R$ {item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right font-semibold text-lg">TOTAL:</td>
                    <td className="text-right font-mono font-bold text-xl text-primary">
                      R$ {budget.valor_total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum item registrado neste orçamento.
            </p>
          )}
        </div>

        {/* Observações */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Observações</h3>
          {isEditing ? (
            <Textarea
              value={editData.observacoes}
              onChange={(e) => setEditData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais sobre o orçamento..."
              rows={3}
            />
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {budget.observacoes || 'Nenhuma observação registrada.'}
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

