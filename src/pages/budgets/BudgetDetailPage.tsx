import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData, Motor } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
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
  ArrowRight,
  Plus,
  Pencil,
  MessageCircle,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { exportBudgetToPDF, exportMotorHeaderToPDF, sendBudgetViaWhatsApp } from '@/lib/pdfExport';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { 
    getBudget, 
    updateBudget, 
    deleteBudget, 
    getClient, 
    updateBudgetMotor,
    addBudgetItem,
    updateBudgetItem,
    removeBudgetItem,
    refreshBudgets,
    parts,
    isLoading 
  } = useData();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/operador';
  
  const budget = getBudget(id || '');
  
  // Calcular valores com desconto
  const subtotalValue = budget ? budget.items.reduce((sum, item) => sum + item.subtotal, 0) : 0;
  const descontoPercentual = budget?.desconto_percentual || 0;
  const descontoValue = descontoPercentual > 0 ? (subtotalValue * descontoPercentual) / 100 : 0;
  const valorTotalComDesconto = subtotalValue - descontoValue;
  
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingMotor, setIsEditingMotor] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [partComboboxOpen, setPartComboboxOpen] = useState(false);
  
  const [editData, setEditData] = useState({
    laudo_tecnico: budget?.laudo_tecnico || '',
    observacoes: budget?.observacoes || '',
    status: budget?.status || 'pendente' as 'pre_orcamento' | 'pendente' | 'concluido' | 'baixado',
    desconto_percentual: budget?.desconto_percentual || 0,
  });
  
  const [hasDescontoEdit, setHasDescontoEdit] = useState(!!budget?.desconto_percentual);
  
  const [motorData, setMotorData] = useState<Partial<Motor>>({
    equipamento: budget?.motor?.equipamento || '',
    marca: budget?.motor?.marca || '',
    modelo: budget?.motor?.modelo || '',
    numero_serie: budget?.motor?.numero_serie || '',
    cv: budget?.motor?.cv || '',
    tensao: budget?.motor?.tensao || '',
    rpm: budget?.motor?.rpm || '',
    tipo: budget?.motor?.tipo || '',
    passe: budget?.motor?.passe || '',
    espiras: budget?.motor?.espiras || '',
    fios: budget?.motor?.fios || '',
    ligacao: budget?.motor?.ligacao || '',
    diametro_externo: budget?.motor?.diametro_externo || '',
    comprimento_externo: budget?.motor?.comprimento_externo || '',
    original: budget?.motor?.original || false,
  });
  
  const [newItem, setNewItem] = useState({
    part_id: '',
    quantidade: 1,
    valor_unitario: 0,
  });
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Atualizar estados quando o budget mudar
  useEffect(() => {
    if (budget) {
      setEditData({
        laudo_tecnico: budget.laudo_tecnico || '',
        observacoes: budget.observacoes || '',
        status: budget.status || 'pendente',
        desconto_percentual: budget.desconto_percentual || 0,
      });
      setHasDescontoEdit(!!budget.desconto_percentual);
      setMotorData({
        equipamento: budget.motor?.equipamento || '',
        marca: budget.motor?.marca || '',
        modelo: budget.motor?.modelo || '',
        numero_serie: budget.motor?.numero_serie || '',
        cv: budget.motor?.cv || '',
        tensao: budget.motor?.tensao || '',
        rpm: budget.motor?.rpm || '',
        tipo: budget.motor?.tipo || '',
        passe: budget.motor?.passe || '',
        espiras: budget.motor?.espiras || '',
        fios: budget.motor?.fios || '',
        ligacao: budget.motor?.ligacao || '',
        diametro_externo: budget.motor?.diametro_externo || '',
        comprimento_externo: budget.motor?.comprimento_externo || '',
        original: budget.motor?.original || false,
      });
    }
  }, [budget]);

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
      desconto_percentual: budget.desconto_percentual || 0,
    });
    setHasDescontoEdit(!!budget.desconto_percentual);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsEditingMotor(false);
    setIsAddingItem(false);
    setEditingItemId(null);
    setEditData({
      laudo_tecnico: budget.laudo_tecnico || '',
      observacoes: budget.observacoes || '',
      status: budget.status || 'pendente',
      desconto_percentual: budget.desconto_percentual || 0,
    });
    setHasDescontoEdit(!!budget.desconto_percentual);
    setMotorData({
      equipamento: budget?.motor?.equipamento || '',
      marca: budget?.motor?.marca || '',
      modelo: budget?.motor?.modelo || '',
      numero_serie: budget?.motor?.numero_serie || '',
      cv: budget?.motor?.cv || '',
      tensao: budget?.motor?.tensao || '',
      rpm: budget?.motor?.rpm || '',
      tipo: budget?.motor?.tipo || '',
      passe: budget?.motor?.passe || '',
      espiras: budget?.motor?.espiras || '',
      fios: budget?.motor?.fios || '',
      ligacao: budget?.motor?.ligacao || '',
      diametro_externo: budget?.motor?.diametro_externo || '',
      comprimento_externo: budget?.motor?.comprimento_externo || '',
      original: budget?.motor?.original || false,
    });
    setNewItem({ part_id: '', quantidade: 1, valor_unitario: 0 });
  };

  const handleSaveEdit = async () => {
    // Validar desconto para operador (máximo 7%)
    if (hasDescontoEdit && !isAdmin && editData.desconto_percentual > 7) {
      toast.error('Operadores podem dar no máximo 7% de desconto.');
      return;
    }
    
    // Validar desconto para admin (máximo 100%)
    if (hasDescontoEdit && isAdmin && editData.desconto_percentual > 100) {
      toast.error('O desconto máximo é de 100%.');
      return;
    }
    
    // Calcular novo valor total com desconto
    const subtotal = budget.items.reduce((sum, item) => sum + item.subtotal, 0);
    const desconto = hasDescontoEdit && editData.desconto_percentual > 0
      ? (subtotal * editData.desconto_percentual) / 100
      : 0;
    const novoValorTotal = subtotal - desconto;
    
    await updateBudget(budget.id, {
      ...editData,
      valor_total: novoValorTotal,
      desconto_percentual: hasDescontoEdit ? editData.desconto_percentual : undefined,
    });
    setIsEditing(false);
    setIsEditingMotor(false);
    setIsAddingItem(false);
    setEditingItemId(null);
    await refreshBudgets();
    toast.success('Orçamento atualizado com sucesso!');
  };

  const handleEditMotor = () => {
    setMotorData({
      equipamento: budget?.motor?.equipamento || '',
      marca: budget?.motor?.marca || '',
      modelo: budget?.motor?.modelo || '',
      numero_serie: budget?.motor?.numero_serie || '',
      cv: budget?.motor?.cv || '',
      tensao: budget?.motor?.tensao || '',
      rpm: budget?.motor?.rpm || '',
      tipo: budget?.motor?.tipo || '',
      passe: budget?.motor?.passe || '',
      espiras: budget?.motor?.espiras || '',
      fios: budget?.motor?.fios || '',
      ligacao: budget?.motor?.ligacao || '',
      diametro_externo: budget?.motor?.diametro_externo || '',
      comprimento_externo: budget?.motor?.comprimento_externo || '',
      original: budget?.motor?.original || false,
    });
    setIsEditingMotor(true);
  };

  const handleSaveMotor = async () => {
    const success = await updateBudgetMotor(budget.id, motorData);
    if (success) {
      setIsEditingMotor(false);
      await refreshBudgets();
      toast.success('Dados do motor atualizados com sucesso!');
    } else {
      toast.error('Erro ao atualizar dados do motor');
    }
  };

  const handleAddItem = () => {
    setNewItem({ part_id: '', quantidade: 1, valor_unitario: 0 });
    setIsAddingItem(true);
  };

  const handleSaveItem = async () => {
    if (!newItem.part_id) {
      toast.error('Selecione uma peça');
      return;
    }
    if (newItem.quantidade <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }
    if (newItem.valor_unitario <= 0) {
      toast.error('Valor unitário deve ser maior que zero');
      return;
    }
    
    const success = await addBudgetItem(budget.id, newItem);
    if (success) {
      setIsAddingItem(false);
      setNewItem({ part_id: '', quantidade: 1, valor_unitario: 0 });
      await refreshBudgets();
      toast.success('Peça adicionada com sucesso!');
    } else {
      toast.error('Erro ao adicionar peça');
    }
  };

  const handleEditItem = (itemId: string) => {
    const item = budget.items.find(i => i.id === itemId);
    if (item) {
      setNewItem({
        part_id: item.part_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
      });
      setEditingItemId(itemId);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItemId) return;
    if (newItem.quantidade <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }
    if (newItem.valor_unitario <= 0) {
      toast.error('Valor unitário deve ser maior que zero');
      return;
    }
    
    const success = await updateBudgetItem(editingItemId, {
      quantidade: newItem.quantidade,
      valor_unitario: newItem.valor_unitario,
    });
    if (success) {
      setEditingItemId(null);
      setNewItem({ part_id: '', quantidade: 1, valor_unitario: 0 });
      await refreshBudgets();
      toast.success('Peça atualizada com sucesso!');
    } else {
      toast.error('Erro ao atualizar peça');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const success = await removeBudgetItem(budget.id, itemId);
    if (success) {
      await refreshBudgets();
      toast.success('Peça removida com sucesso!');
    } else {
      toast.error('Erro ao remover peça');
    }
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
              <DropdownMenuItem onClick={() => {
                const client = getClient(budget.client_id);
                const clientPhone = client?.telefone || client?.celular || '';
                exportMotorHeaderToPDF(budget, clientPhone);
              }}>
                <Download className="w-4 h-4 mr-2" />
                PDF do Cabeçário
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const client = getClient(budget.client_id);
                const clientPhone = client?.telefone || client?.celular || '';
                const success = sendBudgetViaWhatsApp(budget, clientPhone);
                if (!success) {
                  toast.error('Cliente não possui número de WhatsApp cadastrado ou número inválido.');
                } else {
                  toast.success('WhatsApp aberto! O PDF foi baixado e pode ser anexado na conversa.');
                }
              }}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar via WhatsApp
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
              <p className="font-bold text-xl text-primary">
                R$ {budget.valor_total.toFixed(2)}
                {descontoPercentual > 0 && (
                  <span className="text-sm font-normal text-muted-foreground block">
                    (com {descontoPercentual}% de desconto)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Motor Data */}
        <div className="card-industrial">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Cog className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Dados Técnicos do Motor</h3>
                <p className="text-sm text-muted-foreground">Especificações do motor</p>
              </div>
            </div>
            {isEditing && !isEditingMotor && (
              <Button variant="outline" size="sm" onClick={handleEditMotor}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar Motor
              </Button>
            )}
            {isEditingMotor && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => {
                  setIsEditingMotor(false);
                  setMotorData({
                    equipamento: budget?.motor?.equipamento || '',
                    marca: budget?.motor?.marca || '',
                    modelo: budget?.motor?.modelo || '',
                    numero_serie: budget?.motor?.numero_serie || '',
                    cv: budget?.motor?.cv || '',
                    tensao: budget?.motor?.tensao || '',
                    rpm: budget?.motor?.rpm || '',
                    tipo: budget?.motor?.tipo || '',
                    passe: budget?.motor?.passe || '',
                    espiras: budget?.motor?.espiras || '',
                    fios: budget?.motor?.fios || '',
                    ligacao: budget?.motor?.ligacao || '',
                    diametro_externo: budget?.motor?.diametro_externo || '',
                    comprimento_externo: budget?.motor?.comprimento_externo || '',
                    original: budget?.motor?.original || false,
                  });
                }}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveMotor} className="btn-industrial-accent">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Equipamento</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.equipamento || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, equipamento: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.equipamento || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Marca</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.marca || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, marca: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.marca || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Modelo</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.modelo || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, modelo: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.modelo || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Nº Série</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.numero_serie || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, numero_serie: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.numero_serie || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">CV</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.cv || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, cv: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.cv || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Tensão</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.tensao || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, tensao: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.tensao || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Passe</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.passe || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, passe: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.passe || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Espiras</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.espiras || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, espiras: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.espiras || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Nº Fios</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.fios || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, fios: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.fios || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Ligação</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.ligacao || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, ligacao: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.ligacao || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">RPM</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.rpm || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, rpm: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.rpm || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Tipo</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.tipo || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, tipo: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.tipo || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Diâm. Externo</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.diametro_externo || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, diametro_externo: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.diametro_externo || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Comp. Externo</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.comprimento_externo || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, comprimento_externo: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{budget.motor?.comprimento_externo || '-'}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground uppercase mb-1">Original</Label>
              {isEditingMotor ? (
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    checked={motorData.original || false}
                    onCheckedChange={(checked) => setMotorData(prev => ({ ...prev, original: checked === true }))}
                  />
                  <span className="text-sm">Sim</span>
                </div>
              ) : (
                <p className="font-medium">{budget.motor?.original ? 'Sim' : 'Não'}</p>
              )}
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Peças e Serviços</h3>
            {isEditing && !isAddingItem && !editingItemId && (
              <Button variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Peça
              </Button>
            )}
          </div>
          
          {(isAddingItem || editingItemId) && (
            <div className="mb-4 p-4 rounded-lg bg-muted/50 border-2 border-dashed">
              <h4 className="font-semibold mb-3">{editingItemId ? 'Editar Peça' : 'Nova Peça'}</h4>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label>Peça</Label>
                  <Popover open={partComboboxOpen} onOpenChange={setPartComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={partComboboxOpen}
                        className="w-full justify-between font-normal"
                        disabled={!!editingItemId}
                      >
                        {newItem.part_id
                          ? parts.find(p => p.id === newItem.part_id)?.nome
                          : "Selecione uma peça"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar peça..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma peça encontrada.</CommandEmpty>
                          <CommandGroup>
                            {parts.map(part => (
                              <CommandItem
                                key={part.id}
                                value={part.nome}
                                onSelect={() => {
                                  setNewItem(prev => ({
                                    ...prev,
                                    part_id: part.id,
                                    valor_unitario: part.valor || 0,
                                  }));
                                  setPartComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${newItem.part_id === part.id ? "opacity-100" : "opacity-0"}`}
                                />
                                {part.nome} - R$ {part.valor.toFixed(2)}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantidade}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label>Valor Unitário</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.valor_unitario}
                    onChange={(e) => setNewItem(prev => ({ ...prev, valor_unitario: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsAddingItem(false);
                      setEditingItemId(null);
                      setNewItem({ part_id: '', quantidade: 1, valor_unitario: 0 });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={editingItemId ? handleUpdateItem : handleSaveItem}
                    className="btn-industrial-accent"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {budget.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table-industrial">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Qtd</th>
                    <th className="text-right">Valor Unit.</th>
                    <th className="text-right">Subtotal</th>
                    {isEditing && <th className="text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {budget.items.map(item => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.part_name}</td>
                      <td className="text-center">{item.quantidade}</td>
                      <td className="text-right font-mono">R$ {item.valor_unitario.toFixed(2)}</td>
                      <td className="text-right font-mono font-semibold">R$ {item.subtotal.toFixed(2)}</td>
                      {isEditing && (
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(item.id)}
                              disabled={isAddingItem || (editingItemId !== null && editingItemId !== item.id)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isAddingItem || editingItemId !== null}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {(descontoPercentual > 0 || (isEditing && hasDescontoEdit)) && (
                    <>
                      <tr>
                        <td colSpan={isEditing ? 4 : 3} className="text-right font-semibold">
                          Subtotal:
                        </td>
                        <td className="text-right font-mono font-semibold">
                          R$ {subtotalValue.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={isEditing ? 4 : 3} className="text-right font-semibold text-destructive">
                          Desconto ({descontoPercentual}%):
                        </td>
                        <td className="text-right font-mono font-semibold text-destructive">
                          - R$ {descontoValue.toFixed(2)}
                        </td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td colSpan={isEditing ? 4 : 3} className="text-right font-semibold text-lg">TOTAL:</td>
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
          
          {/* Desconto Section - Only when editing */}
          {isEditing && budget.items.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Checkbox
                  id="hasDescontoEdit"
                  checked={hasDescontoEdit}
                  onCheckedChange={(checked) => {
                    setHasDescontoEdit(checked === true);
                    if (!checked) {
                      setEditData(prev => ({ ...prev, desconto_percentual: 0 }));
                    }
                  }}
                />
                <Label htmlFor="hasDescontoEdit" className="font-semibold cursor-pointer">
                  Aplicar desconto
                </Label>
              </div>
              
              {hasDescontoEdit && (
                <div className="ml-7 space-y-2">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="descontoPercentualEdit" className="w-32">
                      Desconto (%):
                    </Label>
                    <Input
                      id="descontoPercentualEdit"
                      type="number"
                      min="0"
                      max={isAdmin ? 100 : 7}
                      step="1"
                      value={editData.desconto_percentual > 0 ? editData.desconto_percentual : ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                        if (value > 0) {
                          if (!isAdmin && value > 7) {
                            toast.error('Operadores podem dar no máximo 7% de desconto.');
                            setEditData(prev => ({ ...prev, desconto_percentual: 7 }));
                          } else if (isAdmin && value > 100) {
                            toast.error('O desconto máximo é de 100%.');
                            setEditData(prev => ({ ...prev, desconto_percentual: 100 }));
                          } else {
                            setEditData(prev => ({ ...prev, desconto_percentual: e.target.value === '' ? 0 : value }));
                          }
                        } else {
                          setEditData(prev => ({ ...prev, desconto_percentual: e.target.value === '' ? 0 : value }));
                        }
                      }}
                      className="w-32"
                      placeholder="%"
                    />
                    {!isAdmin && (
                      <span className="text-sm text-muted-foreground">
                        (Máximo: 7%)
                      </span>
                    )}
                    {isAdmin && (
                      <span className="text-sm text-muted-foreground">
                        (Máximo: 100%)
                      </span>
                    )}
                  </div>
                  {hasDescontoEdit && editData.desconto_percentual > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Valor do desconto: R$ {((subtotalValue * editData.desconto_percentual) / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
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

