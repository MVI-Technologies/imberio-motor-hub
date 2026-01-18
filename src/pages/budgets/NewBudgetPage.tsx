import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import type { MotorInsert } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle,
  Cog
} from 'lucide-react';
import { toast } from 'sonner';

const MOTOR_TYPES = ['Monofásico', 'Trifásico', 'Bifásico'];
const LIGACAO_TYPES = ['Estrela', 'Triângulo', 'Mista'];

export default function NewBudgetPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { user } = useAuth();
  const { getClient, parts, addBudget } = useData();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/operador';
  
  const client = getClient(clientId || '');
  
  const [motorData, setMotorData] = useState<Omit<MotorInsert, 'id' | 'created_at'>>({
    equipamento: '',
    tipo: '',
    modelo: '',
    cv: '',
    tensao: '',
    rpm: '',
    passe: '',
    fios: '',
    espiras: '',
    ligacao: '',
    diametro_externo: '',
    comprimento_externo: '',
    numero_serie: '',
    marca: '',
    original: true,
  });
  
  const [laudoTecnico, setLaudoTecnico] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  interface LocalBudgetItem {
    id: string;
    part_id: string;
    part_name: string;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
  }
  
  const [selectedItems, setSelectedItems] = useState<LocalBudgetItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleMotorChange = (field: keyof Omit<MotorInsert, 'id' | 'created_at'>, value: string | boolean | null) => {
    setMotorData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddItem = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;
    
    const existingItem = selectedItems.find(item => item.part_id === partId);
    if (existingItem) {
      setSelectedItems(prev => prev.map(item => 
        item.part_id === partId 
          ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.valor_unitario }
          : item
      ));
    } else {
      const newItem: LocalBudgetItem = {
        id: Math.random().toString(36).substr(2, 9),
        part_id: part.id,
        part_name: part.nome,
        quantidade: 1,
        valor_unitario: Number(part.valor),
        subtotal: Number(part.valor),
      };
      setSelectedItems(prev => [...prev, newItem]);
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setSelectedItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, quantidade: quantity, subtotal: quantity * item.valor_unitario }
        : item
    ));
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const totalValue = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      toast.error('Adicione pelo menos uma peça ou serviço ao orçamento.');
      return;
    }
    
    setIsSubmitting(true);
    
    const newBudget = await addBudget({
      client_id: client.id,
      operador_id: user?.id || '',
      motor: motorData,
      items: selectedItems.map(item => ({
        part_id: item.part_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
      })),
      valor_total: totalValue,
      laudo_tecnico: laudoTecnico,
      observacoes,
      status: 'pendente',
    });
    
    if (newBudget) {
      toast.success('Orçamento criado com sucesso!', {
        description: `Valor total: R$ ${totalValue.toFixed(2)}`,
        icon: <CheckCircle className="w-5 h-5 text-success" />,
      });
      navigate(`${basePath}/clientes/${client.id}`);
    } else {
      toast.error('Erro ao criar orçamento', {
        description: 'Tente novamente.',
      });
    }
    
    setIsSubmitting(false);
  };

  // Group parts by type
  const partsByType = parts.reduce((acc, part) => {
    const tipo = part.tipo || 'Sem categoria';
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(part);
    return acc;
  }, {} as Record<string, typeof parts>);

  return (
    <DashboardLayout 
      title="Novo Orçamento"
      subtitle={`Cliente: ${client.nome}`}
      actions={
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Motor Technical Data */}
        <div className="card-industrial">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cog className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Dados Técnicos do Motor</h3>
              <p className="text-sm text-muted-foreground">Preencha as especificações do motor</p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Equipamento</Label>
              <Input
                value={motorData.equipamento}
                onChange={(e) => handleMotorChange('equipamento', e.target.value)}
                placeholder="Ex: Bomba, Compressor..."
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input
                value={motorData.marca}
                onChange={(e) => handleMotorChange('marca', e.target.value)}
                placeholder="Ex: WEG"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input
                value={motorData.modelo}
                onChange={(e) => handleMotorChange('modelo', e.target.value)}
                placeholder="Ex: W22"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Nº de Série</Label>
              <Input
                value={motorData.numero_serie}
                onChange={(e) => handleMotorChange('numero_serie', e.target.value)}
                placeholder="Número de série"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>CV</Label>
              <Input
                value={motorData.cv}
                onChange={(e) => handleMotorChange('cv', e.target.value)}
                placeholder="Ex: 5"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tensão</Label>
              <Input
                value={motorData.tensao}
                onChange={(e) => handleMotorChange('tensao', e.target.value)}
                placeholder="Ex: 220/380V"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Passe</Label>
              <Input
                value={motorData.passe}
                onChange={(e) => handleMotorChange('passe', e.target.value)}
                placeholder="Ex: 1-8"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Espiras</Label>
              <Input
                value={motorData.espiras}
                onChange={(e) => handleMotorChange('espiras', e.target.value)}
                placeholder="Ex: 45"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Nº de Fios</Label>
              <Input
                value={motorData.fios}
                onChange={(e) => handleMotorChange('fios', e.target.value)}
                placeholder="Ex: 6"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Ligação</Label>
              <Select value={motorData.ligacao} onValueChange={(v) => handleMotorChange('ligacao', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {LIGACAO_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>RPM</Label>
              <Input
                value={motorData.rpm}
                onChange={(e) => handleMotorChange('rpm', e.target.value)}
                placeholder="Ex: 1750"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo do Motor</Label>
              <Select value={motorData.tipo} onValueChange={(v) => handleMotorChange('tipo', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MOTOR_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Diâmetro Externo</Label>
              <Input
                value={motorData.diametro_externo}
                onChange={(e) => handleMotorChange('diametro_externo', e.target.value)}
                placeholder="Ex: 120mm"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Comprimento Externo</Label>
              <Input
                value={motorData.comprimento_externo}
                onChange={(e) => handleMotorChange('comprimento_externo', e.target.value)}
                placeholder="Ex: 280mm"
                className="h-11"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-3">
            <Switch
              id="original"
              checked={motorData.original}
              onCheckedChange={(checked) => handleMotorChange('original', checked)}
            />
            <Label htmlFor="original">Motor Original</Label>
          </div>
        </div>

        {/* Laudo Técnico */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Laudo Técnico</h3>
          <Textarea
            value={laudoTecnico}
            onChange={(e) => setLaudoTecnico(e.target.value)}
            placeholder="Descreva o problema encontrado, diagnóstico e serviços necessários..."
            rows={4}
          />
        </div>

        {/* Parts and Services */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Peças e Serviços</h3>
          
          {/* Part Selector */}
          <div className="mb-6">
            <Label className="mb-2 block">Adicionar Item</Label>
            <Select onValueChange={handleAddItem}>
              <SelectTrigger className="h-11 w-full max-w-md">
                <SelectValue placeholder="Selecione uma peça ou serviço" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(partsByType).map(([tipo, items]) => (
                  <React.Fragment key={tipo}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      {tipo}
                    </div>
                    {items.map(part => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.nome} - R$ {part.valor.toFixed(2)}
                      </SelectItem>
                    ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Selected Items */}
          {selectedItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table-industrial">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Qtd</th>
                    <th className="text-right">Valor Unit.</th>
                    <th className="text-right">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map(item => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.part_name}</td>
                      <td className="text-center">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 h-9 text-center mx-auto"
                        />
                      </td>
                      <td className="text-right font-mono">
                        R$ {item.valor_unitario.toFixed(2)}
                      </td>
                      <td className="text-right font-mono font-semibold">
                        R$ {item.subtotal.toFixed(2)}
                      </td>
                      <td className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right font-semibold text-lg">
                      TOTAL:
                    </td>
                    <td className="text-right font-mono font-bold text-xl text-primary">
                      R$ {totalValue.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum item adicionado ainda.</p>
              <p className="text-sm">Use o seletor acima para adicionar peças e serviços.</p>
            </div>
          )}
        </div>

        {/* Observations */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Observações</h3>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações adicionais sobre o orçamento..."
            rows={3}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between p-6 rounded-xl bg-muted/50 border border-border">
          <div>
            <p className="text-sm text-muted-foreground">Valor Total do Orçamento</p>
            <p className="text-3xl font-bold text-primary">
              R$ {totalValue.toFixed(2)}
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || selectedItems.length === 0}
              className="btn-industrial-accent btn-industrial-large"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" />
                  Salvando...
                </span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Orçamento
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
