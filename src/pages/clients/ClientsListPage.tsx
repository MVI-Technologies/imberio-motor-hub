import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Download, 
  ChevronRight,
  Phone,
  MapPin,
  History
} from 'lucide-react';
import { exportClientToPDF } from '@/lib/pdfExport';

export default function ClientsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { clients, getBudgetsByClient } = useData();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/operador';
  
  const filteredClients = searchQuery.trim()
    ? clients.filter(c => 
        c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.telefone?.includes(searchQuery) ||
        c.celular?.includes(searchQuery)
      )
    : clients;

  return (
    <DashboardLayout 
      title="Clientes" 
      subtitle={`${clients.length} clientes cadastrados`}
    >
      {/* Search */}
      <div className="max-w-md mb-8">
        <div className="search-industrial">
          <Search className="w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const budgets = getBudgetsByClient(client.id);
          return (
            <div key={client.id} className="card-industrial">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground">
                  {client.nome}
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="btn-pdf"
                  onClick={() => exportClientToPDF(client, budgets)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{client.endereco || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{client.telefone || client.celular || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 flex-shrink-0 text-primary" />
                  <span className="text-primary font-medium">
                    {budgets.length} orçamento(s)
                  </span>
                </div>
              </div>
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate(`${basePath}/clientes/${client.id}`)}
              >
                Ver Detalhes
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="card-industrial text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
