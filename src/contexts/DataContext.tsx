import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { 
  Client, 
  Part, 
  Motor, 
  Budget, 
  BudgetItem,
  ClientInsert,
  ClientUpdate,
  PartInsert,
  PartUpdate,
  MotorInsert,
  BudgetInsert,
  BudgetItemInsert,
  BudgetWithRelations,
  Profile
} from '@/lib/database.types';

// Re-exportar tipos para compatibilidade
export type { Client, Part, Motor, Budget, BudgetItem };

// Tipo expandido de Budget para uso na UI
export interface BudgetExpanded {
  id: string;
  client_id: string;
  client_name: string;
  operador_id: string;
  operador_name: string;
  motor: Motor;
  items: {
    id: string;
    part_id: string;
    part_name: string;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
  }[];
  data: string;
  valor_total: number;
  laudo_tecnico: string;
  observacoes: string;
  status: 'pendente' | 'aprovado' | 'concluido';
}

interface DataContextType {
  // Estado
  clients: Client[];
  parts: Part[];
  budgets: BudgetExpanded[];
  isLoading: boolean;
  
  // Clientes
  addClient: (client: Omit<ClientInsert, 'id' | 'created_at'>) => Promise<Client | null>;
  updateClient: (id: string, client: ClientUpdate) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  refreshClients: () => Promise<void>;
  
  // Peças
  addPart: (part: Omit<PartInsert, 'id' | 'created_at'>) => Promise<Part | null>;
  updatePart: (id: string, part: PartUpdate) => Promise<void>;
  deletePart: (id: string) => Promise<void>;
  refreshParts: () => Promise<void>;
  
  // Orçamentos
  addBudget: (budget: {
    client_id: string;
    operador_id: string;
    motor: Omit<MotorInsert, 'id' | 'created_at'>;
    items: { part_id: string; quantidade: number; valor_unitario: number }[];
    valor_total: number;
    laudo_tecnico?: string;
    observacoes?: string;
    status?: 'pendente' | 'aprovado' | 'concluido';
  }) => Promise<BudgetExpanded | null>;
  updateBudget: (id: string, budget: Partial<BudgetExpanded>) => Promise<void>;
  getBudgetsByClient: (clientId: string) => BudgetExpanded[];
  getBudget: (id: string) => BudgetExpanded | undefined;
  refreshBudgets: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [budgets, setBudgets] = useState<BudgetExpanded[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ========== FETCH FUNCTIONS ==========
  
  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return;
    }
    
    setClients(data || []);
  }, []);

  const fetchParts = useCallback(async () => {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('Erro ao buscar peças:', error);
      return;
    }
    
    setParts(data || []);
  }, []);

  const fetchBudgets = useCallback(async () => {
    // Buscar orçamentos com relacionamentos
    const { data: budgetsData, error: budgetsError } = await supabase
      .from('budgets')
      .select(`
        *,
        client:clients(*),
        operador:profiles(*),
        motor:motors(*)
      `)
      .order('data', { ascending: false });

    if (budgetsError) {
      console.error('Erro ao buscar orçamentos:', budgetsError);
      return;
    }

    // Buscar itens de cada orçamento
    const expandedBudgets: BudgetExpanded[] = [];
    
    for (const budget of budgetsData || []) {
      const { data: itemsData } = await supabase
        .from('budget_items')
        .select(`
          *,
          part:parts(*)
        `)
        .eq('budget_id', budget.id);

      const items = (itemsData || []).map(item => ({
        id: item.id,
        part_id: item.part_id || '',
        part_name: item.part?.nome || 'Peça não encontrada',
        quantidade: item.quantidade,
        valor_unitario: Number(item.valor_unitario),
        subtotal: Number(item.subtotal),
      }));

      expandedBudgets.push({
        id: budget.id,
        client_id: budget.client_id || '',
        client_name: budget.client?.nome || 'Cliente não encontrado',
        operador_id: budget.operador_id || '',
        operador_name: budget.operador?.name || 'Operador não encontrado',
        motor: budget.motor || {
          id: '',
          tipo: null,
          modelo: null,
          cv: null,
          tensao: null,
          rpm: null,
          espiras: null,
          fios: null,
          ligacao: null,
          diametro_externo: null,
          comprimento_externo: null,
          numero_serie: null,
          marca: null,
          original: null,
          created_at: '',
        },
        items,
        data: budget.data,
        valor_total: Number(budget.valor_total) || 0,
        laudo_tecnico: budget.laudo_tecnico || '',
        observacoes: budget.observacoes || '',
        status: budget.status || 'pendente',
      });
    }

    setBudgets(expandedBudgets);
  }, []);

  // Carrega dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchClients(), fetchParts(), fetchBudgets()]);
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchClients, fetchParts, fetchBudgets]);

  // ========== CLIENTS ==========

  const addClient = async (clientData: Omit<ClientInsert, 'id' | 'created_at'>): Promise<Client | null> => {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar cliente:', error);
      return null;
    }

    setClients(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  };

  const updateClient = async (id: string, clientData: ClientUpdate) => {
    const { error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      return;
    }

    setClients(prev => prev.map(c => c.id === id ? { ...c, ...clientData } : c));
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar cliente:', error);
      return;
    }

    setClients(prev => prev.filter(c => c.id !== id));
  };

  const getClient = (id: string) => clients.find(c => c.id === id);

  const searchClients = (query: string) => {
    if (!query.trim()) return clients;
    const lowerQuery = query.toLowerCase();
    return clients.filter(c => 
      c.nome.toLowerCase().includes(lowerQuery) ||
      c.telefone?.includes(query) ||
      c.celular?.includes(query)
    );
  };

  const refreshClients = async () => {
    await fetchClients();
  };

  // ========== PARTS ==========

  const addPart = async (partData: Omit<PartInsert, 'id' | 'created_at'>): Promise<Part | null> => {
    const { data, error } = await supabase
      .from('parts')
      .insert(partData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar peça:', error);
      return null;
    }

    setParts(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  };

  const updatePart = async (id: string, partData: PartUpdate) => {
    const { error } = await supabase
      .from('parts')
      .update(partData)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar peça:', error);
      return;
    }

    setParts(prev => prev.map(p => p.id === id ? { ...p, ...partData } : p));
  };

  const deletePart = async (id: string) => {
    const { error } = await supabase
      .from('parts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar peça:', error);
      return;
    }

    setParts(prev => prev.filter(p => p.id !== id));
  };

  const refreshParts = async () => {
    await fetchParts();
  };

  // ========== BUDGETS ==========

  const addBudget = async (budgetData: {
    client_id: string;
    operador_id: string;
    motor: Omit<MotorInsert, 'id' | 'created_at'>;
    items: { part_id: string; quantidade: number; valor_unitario: number }[];
    valor_total: number;
    laudo_tecnico?: string;
    observacoes?: string;
    status?: 'pendente' | 'aprovado' | 'concluido';
  }): Promise<BudgetExpanded | null> => {
    // 1. Criar o motor primeiro
    const { data: motorData, error: motorError } = await supabase
      .from('motors')
      .insert(budgetData.motor)
      .select()
      .single();

    if (motorError || !motorData) {
      console.error('Erro ao criar motor:', motorError);
      return null;
    }

    // 2. Criar o orçamento
    const { data: budgetResult, error: budgetError } = await supabase
      .from('budgets')
      .insert({
        client_id: budgetData.client_id,
        operador_id: budgetData.operador_id,
        motor_id: motorData.id,
        valor_total: budgetData.valor_total,
        laudo_tecnico: budgetData.laudo_tecnico,
        observacoes: budgetData.observacoes,
        status: budgetData.status || 'pendente',
      })
      .select()
      .single();

    if (budgetError || !budgetResult) {
      console.error('Erro ao criar orçamento:', budgetError);
      return null;
    }

    // 3. Criar os itens do orçamento
    const itemsToInsert = budgetData.items.map(item => ({
      budget_id: budgetResult.id,
      part_id: item.part_id,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
    }));

    const { data: itemsData, error: itemsError } = await supabase
      .from('budget_items')
      .insert(itemsToInsert)
      .select(`
        *,
        part:parts(*)
      `);

    if (itemsError) {
      console.error('Erro ao criar itens:', itemsError);
    }

    // 4. Buscar dados relacionados para montar o objeto expandido
    const client = clients.find(c => c.id === budgetData.client_id);
    
    const { data: operador } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', budgetData.operador_id)
      .single();

    const expandedBudget: BudgetExpanded = {
      id: budgetResult.id,
      client_id: budgetData.client_id,
      client_name: client?.nome || 'Cliente não encontrado',
      operador_id: budgetData.operador_id,
      operador_name: operador?.name || 'Operador não encontrado',
      motor: motorData,
      items: (itemsData || []).map(item => ({
        id: item.id,
        part_id: item.part_id || '',
        part_name: item.part?.nome || 'Peça não encontrada',
        quantidade: item.quantidade,
        valor_unitario: Number(item.valor_unitario),
        subtotal: Number(item.subtotal),
      })),
      data: budgetResult.data,
      valor_total: budgetData.valor_total,
      laudo_tecnico: budgetData.laudo_tecnico || '',
      observacoes: budgetData.observacoes || '',
      status: budgetData.status || 'pendente',
    };

    setBudgets(prev => [expandedBudget, ...prev]);
    return expandedBudget;
  };

  const updateBudget = async (id: string, budgetData: Partial<BudgetExpanded>) => {
    const updateData: Record<string, unknown> = {};
    
    if (budgetData.valor_total !== undefined) updateData.valor_total = budgetData.valor_total;
    if (budgetData.laudo_tecnico !== undefined) updateData.laudo_tecnico = budgetData.laudo_tecnico;
    if (budgetData.observacoes !== undefined) updateData.observacoes = budgetData.observacoes;
    if (budgetData.status !== undefined) updateData.status = budgetData.status;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar orçamento:', error);
        return;
      }
    }

    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...budgetData } : b));
  };

  const getBudgetsByClient = (clientId: string) => budgets.filter(b => b.client_id === clientId);

  const getBudget = (id: string) => budgets.find(b => b.id === id);

  const refreshBudgets = async () => {
    await fetchBudgets();
  };

  return (
    <DataContext.Provider value={{
      clients,
      parts,
      budgets,
      isLoading,
      addClient,
      updateClient,
      deleteClient,
      getClient,
      searchClients,
      refreshClients,
      addPart,
      updatePart,
      deletePart,
      refreshParts,
      addBudget,
      updateBudget,
      getBudgetsByClient,
      getBudget,
      refreshBudgets,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
