import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import type { Client } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  FileText, 
  Download, 
  History,
  Phone,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { exportClientToPDF } from '@/lib/pdfExport';

export default function OperatorDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const { searchClients, getBudgetsByClient } = useData();
  const navigate = useNavigate();
  
  const filteredClients = searchQuery.trim() ? searchClients(searchQuery) : [];
  const showResults = searchQuery.trim().length > 0;

  const handleNewClient = () => {
    navigate('/operador/clientes/novo');
  };

  const handleNewBudget = (clientId: string) => {
    navigate(`/operador/orcamento/novo/${clientId}`);
  };

  const handleViewClient = (clientId: string) => {
    navigate(`/operador/clientes/${clientId}`);
  };

  const handleExportClient = (client: Client) => {
    const budgets = getBudgetsByClient(client.id);
    exportClientToPDF(client, budgets);
  };

  return (
    <DashboardLayout 
      title="Área do Operador" 
      subtitle="Busque clientes ou cadastre novos orçamentos"
    >
      {/* Search Section */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="card-industrial">
          <h2 className="text-lg font-semibold mb-4">Buscar Cliente</h2>
          <div className="search-industrial">
            <Search className="w-5 h-5" />
            <input
              type="text"
              placeholder="Digite o nome, telefone ou celular do cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-base"
            />
          </div>
          
          {/* Quick Action */}
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={handleNewClient}
              className="btn-industrial-accent btn-industrial-large"
            >
              <Plus className="w-5 h-5" />
              Novo Cliente
            </Button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">
            {filteredClients.length > 0 
              ? `${filteredClients.length} cliente(s) encontrado(s)`
              : 'Nenhum cliente encontrado'
            }
          </h3>
          
          {filteredClients.length === 0 ? (
            <div className="card-industrial text-center py-12">
              <p className="text-muted-foreground mb-4">
                Não encontramos nenhum cliente com esses dados.
              </p>
              <Button 
                onClick={handleNewClient}
                className="btn-industrial-accent"
              >
                <Plus className="w-5 h-5" />
                Cadastrar Novo Cliente
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => {
                const budgets = getBudgetsByClient(client.id);
                return (
                  <div key={client.id} className="card-industrial">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-foreground">
                          {client.nome}
                        </h4>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{client.endereco || '-'}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{client.telefone || client.celular || '-'}</span>
                            </div>
                            {client.celular && client.telefone && (
                              <span>{client.celular}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Budget Count */}
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <History className="w-4 h-4 text-primary" />
                          <span className="text-primary font-medium">
                            {budgets.length} orçamento(s) registrado(s)
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          onClick={() => handleNewBudget(client.id)}
                          className="btn-industrial-accent"
                        >
                          <FileText className="w-4 h-4" />
                          Novo Orçamento
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleViewClient(client.id)}
                        >
                          Ver Detalhes
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost"
                          className="btn-pdf"
                          onClick={() => handleExportClient(client)}
                        >
                          <Download className="w-4 h-4" />
                          Exportar PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!showResults && (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="card-industrial text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Buscar Cliente</h3>
            <p className="text-muted-foreground text-sm">
              Use a busca acima para encontrar clientes existentes e criar novos orçamentos
            </p>
          </div>
          
          <div className="card-industrial text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <Plus className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Novo Cliente</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Cadastre um novo cliente para começar a criar orçamentos
            </p>
            <Button 
              onClick={handleNewClient}
              variant="outline"
            >
              Cadastrar Cliente
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
