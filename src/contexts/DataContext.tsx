import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface Client {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  celular: string;
  observacoes: string;
  created_at: string;
}

export interface Motor {
  id: string;
  tipo: string;
  modelo: string;
  cv: string;
  tensao: string;
  rpm: string;
  fios: string;
  espiras: string;
  ligacao: string;
  diametro_externo: string;
  comprimento_externo: string;
  numero_serie: string;
  marca: string;
  original: boolean;
}

export interface Part {
  id: string;
  nome: string;
  tipo: string;
  valor: number;
  unidade: string;
  observacoes: string;
}

export interface BudgetItem {
  id: string;
  part_id: string;
  part_name: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
}

export interface Budget {
  id: string;
  client_id: string;
  client_name: string;
  operador_id: string;
  operador_name: string;
  motor: Motor;
  items: BudgetItem[];
  data: string;
  valor_total: number;
  laudo_tecnico: string;
  observacoes: string;
  status: 'pendente' | 'aprovado' | 'concluido';
}

interface DataContextType {
  clients: Client[];
  parts: Part[];
  budgets: Budget[];
  addClient: (client: Omit<Client, 'id' | 'created_at'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  addPart: (part: Omit<Part, 'id'>) => Part;
  updatePart: (id: string, part: Partial<Part>) => void;
  deletePart: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => Budget;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  getBudgetsByClient: (clientId: string) => Budget[];
  getBudget: (id: string) => Budget | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial mock data
const INITIAL_PARTS: Part[] = [
  { id: '1', nome: 'Rolamento 6205', tipo: 'Rolamento', valor: 45.00, unidade: 'un', observacoes: '' },
  { id: '2', nome: 'Rolamento 6206', tipo: 'Rolamento', valor: 52.00, unidade: 'un', observacoes: '' },
  { id: '3', nome: 'Rolamento 6207', tipo: 'Rolamento', valor: 68.00, unidade: 'un', observacoes: '' },
  { id: '4', nome: 'Selo Mecânico 1"', tipo: 'Selo', valor: 85.00, unidade: 'un', observacoes: '' },
  { id: '5', nome: 'Selo Mecânico 1.1/4"', tipo: 'Selo', valor: 95.00, unidade: 'un', observacoes: '' },
  { id: '6', nome: 'Capacitor 10uF', tipo: 'Capacitor', valor: 35.00, unidade: 'un', observacoes: '' },
  { id: '7', nome: 'Capacitor 20uF', tipo: 'Capacitor', valor: 42.00, unidade: 'un', observacoes: '' },
  { id: '8', nome: 'Capacitor 30uF', tipo: 'Capacitor', valor: 48.00, unidade: 'un', observacoes: '' },
  { id: '9', nome: 'Ventoinha 140mm', tipo: 'Ventoinha', valor: 55.00, unidade: 'un', observacoes: '' },
  { id: '10', nome: 'Ventoinha 160mm', tipo: 'Ventoinha', valor: 65.00, unidade: 'un', observacoes: '' },
  { id: '11', nome: 'Tampa Traseira', tipo: 'Tampa', valor: 120.00, unidade: 'un', observacoes: '' },
  { id: '12', nome: 'Tampa Dianteira', tipo: 'Tampa', valor: 130.00, unidade: 'un', observacoes: '' },
  { id: '13', nome: 'Vedação Oring', tipo: 'Vedação', valor: 12.00, unidade: 'un', observacoes: '' },
  { id: '14', nome: 'Flange', tipo: 'Flange', valor: 180.00, unidade: 'un', observacoes: '' },
  { id: '15', nome: 'Rotor', tipo: 'Rotor', valor: 350.00, unidade: 'un', observacoes: '' },
  { id: '16', nome: 'Centrífugo', tipo: 'Centrífugo', valor: 95.00, unidade: 'un', observacoes: '' },
  { id: '17', nome: 'Caixa de Ligação', tipo: 'Caixa', valor: 75.00, unidade: 'un', observacoes: '' },
  { id: '18', nome: 'Mão de Obra - Simples', tipo: 'Serviço', valor: 150.00, unidade: 'serv', observacoes: '' },
  { id: '19', nome: 'Mão de Obra - Complexa', tipo: 'Serviço', valor: 280.00, unidade: 'serv', observacoes: '' },
  { id: '20', nome: 'Torno', tipo: 'Serviço', valor: 200.00, unidade: 'serv', observacoes: '' },
  { id: '21', nome: 'Reforma Completa', tipo: 'Serviço', valor: 500.00, unidade: 'serv', observacoes: '' },
  { id: '22', nome: 'Rebobinagem', tipo: 'Serviço', valor: 400.00, unidade: 'serv', observacoes: '' },
];

const INITIAL_CLIENTS: Client[] = [
  { id: '1', nome: 'Indústria ABC Ltda', endereco: 'Rua Industrial, 500 - Distrito Industrial', telefone: '(11) 3333-4444', celular: '(11) 99999-8888', observacoes: 'Cliente desde 2020', created_at: '2024-01-15' },
  { id: '2', nome: 'Fazenda São João', endereco: 'Estrada Rural, Km 15', telefone: '(11) 3333-5555', celular: '(11) 99999-7777', observacoes: 'Bombas de irrigação', created_at: '2024-02-20' },
  { id: '3', nome: 'Metalúrgica Progresso', endereco: 'Av. das Indústrias, 1200', telefone: '(11) 3333-6666', celular: '(11) 99999-6666', observacoes: '', created_at: '2024-03-10' },
];

const INITIAL_BUDGETS: Budget[] = [
  {
    id: '1',
    client_id: '1',
    client_name: 'Indústria ABC Ltda',
    operador_id: '2',
    operador_name: 'Operador João',
    motor: {
      id: 'm1',
      tipo: 'Trifásico',
      modelo: 'WEG W22',
      cv: '5',
      tensao: '220/380V',
      rpm: '1750',
      fios: '6',
      espiras: '45',
      ligacao: 'Estrela',
      diametro_externo: '120mm',
      comprimento_externo: '280mm',
      numero_serie: 'WEG-2024-001',
      marca: 'WEG',
      original: true,
    },
    items: [
      { id: 'i1', part_id: '1', part_name: 'Rolamento 6205', quantidade: 2, valor_unitario: 45.00, subtotal: 90.00 },
      { id: 'i2', part_id: '18', part_name: 'Mão de Obra - Simples', quantidade: 1, valor_unitario: 150.00, subtotal: 150.00 },
    ],
    data: '2024-12-10',
    valor_total: 240.00,
    laudo_tecnico: 'Motor apresentou aquecimento excessivo. Rolamentos desgastados.',
    observacoes: '',
    status: 'concluido',
  },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [parts, setParts] = useState<Part[]>(INITIAL_PARTS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addClient = (clientData: Omit<Client, 'id' | 'created_at'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: generateId(),
      created_at: new Date().toISOString().split('T')[0],
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...clientData } : c));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const getClient = (id: string) => clients.find(c => c.id === id);

  const searchClients = (query: string) => {
    if (!query.trim()) return clients;
    const lowerQuery = query.toLowerCase();
    return clients.filter(c => 
      c.nome.toLowerCase().includes(lowerQuery) ||
      c.telefone.includes(query) ||
      c.celular.includes(query)
    );
  };

  const addPart = (partData: Omit<Part, 'id'>): Part => {
    const newPart: Part = { ...partData, id: generateId() };
    setParts(prev => [...prev, newPart]);
    return newPart;
  };

  const updatePart = (id: string, partData: Partial<Part>) => {
    setParts(prev => prev.map(p => p.id === id ? { ...p, ...partData } : p));
  };

  const deletePart = (id: string) => {
    setParts(prev => prev.filter(p => p.id !== id));
  };

  const addBudget = (budgetData: Omit<Budget, 'id'>): Budget => {
    const newBudget: Budget = { ...budgetData, id: generateId() };
    setBudgets(prev => [...prev, newBudget]);
    return newBudget;
  };

  const updateBudget = (id: string, budgetData: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...budgetData } : b));
  };

  const getBudgetsByClient = (clientId: string) => budgets.filter(b => b.client_id === clientId);

  const getBudget = (id: string) => budgets.find(b => b.id === id);

  return (
    <DataContext.Provider value={{
      clients,
      parts,
      budgets,
      addClient,
      updateClient,
      deleteClient,
      getClient,
      searchClients,
      addPart,
      updatePart,
      deletePart,
      addBudget,
      updateBudget,
      getBudgetsByClient,
      getBudget,
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
