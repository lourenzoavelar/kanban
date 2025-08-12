import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Plus, MessageSquare, User, Calendar, Clock, Shield, AlertTriangle } from 'lucide-react';
import { 
  validateChatwootData, 
  validateOrigin, 
  validateAndSanitizeInput,
  SecureLogger,
  RateLimiter
} from './utils/security.js';
import './App.css';

function App() {
  const [chatwootData, setChatwootData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [securityStatus, setSecurityStatus] = useState({ isSecure: true, warnings: [] });
  const [rateLimiter] = useState(new RateLimiter(50, 60000)); // 50 requests per minute

  // Listener para receber dados do Chatwoot com validações de segurança
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        // Validar origem da mensagem
        if (!validateOrigin(event.origin)) {
          SecureLogger.warn('Origem não autorizada detectada', { origin: event.origin });
          setSecurityStatus(prev => ({
            ...prev,
            warnings: [...prev.warnings, `Origem não autorizada: ${event.origin}`]
          }));
          return;
        }

        // Rate limiting
        if (!rateLimiter.isAllowed(event.origin)) {
          SecureLogger.warn('Rate limit excedido', { origin: event.origin });
          return;
        }

        // Validar se é JSON válido
        if (!isJSONValid(event.data)) {
          return;
        }

        const eventData = JSON.parse(event.data);
        
        // Validar estrutura dos dados do Chatwoot
        if (!validateChatwootData(eventData)) {
          SecureLogger.warn('Dados inválidos recebidos do Chatwoot', { eventData });
          return;
        }

        // Sanitizar dados de entrada
        const sanitizedData = validateAndSanitizeInput(eventData);
        
        if (sanitizedData.event === 'appContext') {
          setChatwootData(sanitizedData.data);
          generateTasksFromChatwootData(sanitizedData.data);
          setIsLoading(false);
          
          SecureLogger.info('Dados do Chatwoot processados com sucesso', {
            conversationId: sanitizedData.data.conversation?.id,
            contactId: sanitizedData.data.contact?.id
          });
        }
      } catch (error) {
        SecureLogger.error('Erro ao processar dados do Chatwoot', { error: error.message });
        setSecurityStatus(prev => ({
          ...prev,
          warnings: [...prev.warnings, 'Erro ao processar dados recebidos']
        }));
      }
    };

    window.addEventListener('message', handleMessage);

    // Solicitar dados iniciais do Chatwoot
    requestChatwootData();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [rateLimiter]);

  const isJSONValid = (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const requestChatwootData = () => {
    if (window.parent) {
      window.parent.postMessage('chatwoot-dashboard-app:fetch-info', '*');
    }
  };

  const generateTasksFromChatwootData = (data) => {
    if (!data || !data.conversation) return;

    const { conversation, contact, currentAgent } = data;
    const newTasks = [];

    // Criar tarefa baseada na conversa
    if (conversation.status === 'open') {
      newTasks.push({
        id: `conv-${conversation.id}`,
        title: `Conversa com ${contact?.name || 'Cliente'}`,
        description: `Conversa ativa desde ${new Date(conversation.timestamp * 1000).toLocaleString()}`,
        status: 'em-andamento',
        priority: conversation.unread_count > 0 ? 'alta' : 'media',
        assignee: currentAgent?.name || 'Não atribuído',
        contact: contact,
        conversation: conversation,
        type: 'conversation'
      });
    }

    // Criar tarefas baseadas nas mensagens não lidas
    if (conversation.unread_count > 0) {
      newTasks.push({
        id: `unread-${conversation.id}`,
        title: `${conversation.unread_count} mensagem(ns) não lida(s)`,
        description: `Responder mensagens pendentes de ${contact?.name || 'Cliente'}`,
        status: 'pendente',
        priority: 'alta',
        assignee: currentAgent?.name || 'Não atribuído',
        contact: contact,
        conversation: conversation,
        type: 'unread'
      });
    }

    // Criar tarefa de follow-up se necessário
    if (conversation.status === 'resolved') {
      newTasks.push({
        id: `followup-${conversation.id}`,
        title: `Follow-up com ${contact?.name || 'Cliente'}`,
        description: 'Verificar satisfação do cliente após resolução',
        status: 'pendente',
        priority: 'baixa',
        assignee: currentAgent?.name || 'Não atribuído',
        contact: contact,
        conversation: conversation,
        type: 'followup'
      });
    }

    setTasks(newTasks);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta': return 'bg-red-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente': return 'bg-orange-100 text-orange-800';
      case 'em-andamento': return 'bg-blue-100 text-blue-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const addCustomTask = () => {
    const newTask = {
      id: `custom-${Date.now()}`,
      title: 'Nova Tarefa',
      description: 'Descrição da tarefa',
      status: 'pendente',
      priority: 'media',
      assignee: chatwootData?.currentAgent?.name || 'Não atribuído',
      type: 'custom'
    };
    setTasks([...tasks, newTask]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Carregando dados do Chatwoot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Kanban Dashboard - Chatwoot
            </h1>
            
            {/* Indicador de Segurança */}
            <div className="flex items-center space-x-2">
              {securityStatus.isSecure ? (
                <div className="flex items-center text-green-600">
                  <Shield className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium">Seguro</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <AlertTriangle className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium">Avisos de Segurança</span>
                </div>
              )}
            </div>
          </div>
          
          {chatwootData?.contact && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {chatwootData.contact.name || 'Cliente'}
              </div>
              <div className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-1" />
                Conversa #{chatwootData.conversation?.id}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {chatwootData.conversation?.status}
              </div>
            </div>
          )}
          
          {/* Avisos de Segurança */}
          {securityStatus.warnings.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-800">Avisos de Segurança</span>
              </div>
              <ul className="text-xs text-yellow-700 space-y-1">
                {securityStatus.warnings.slice(-3).map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Tabs para diferentes visualizações */}
        <Tabs defaultValue="kanban" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="list">Lista de Tarefas</TabsTrigger>
            <TabsTrigger value="info">Informações do Cliente</TabsTrigger>
          </TabsList>

          {/* Kanban Board */}
          <TabsContent value="kanban" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Coluna Pendente */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Pendente</h3>
                  <Badge variant="secondary">
                    {tasks.filter(t => t.status === 'pendente').length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {tasks.filter(task => task.status === 'pendente').map(task => (
                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{task.assignee}</span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateTaskStatus(task.id, 'em-andamento')}
                          >
                            Iniciar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button 
                    variant="dashed" 
                    className="w-full"
                    onClick={addCustomTask}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Tarefa
                  </Button>
                </div>
              </div>

              {/* Coluna Em Andamento */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Em Andamento</h3>
                  <Badge variant="secondary">
                    {tasks.filter(t => t.status === 'em-andamento').length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {tasks.filter(task => task.status === 'em-andamento').map(task => (
                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{task.assignee}</span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateTaskStatus(task.id, 'concluido')}
                          >
                            Concluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Coluna Concluído */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Concluído</h3>
                  <Badge variant="secondary">
                    {tasks.filter(t => t.status === 'concluido').length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {tasks.filter(task => task.status === 'concluido').map(task => (
                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{task.assignee}</span>
                          <Badge className="bg-green-100 text-green-800">
                            Concluído
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Lista de Tarefas */}
          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Tarefas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Informações do Cliente */}
          <TabsContent value="info" className="mt-6">
            {chatwootData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Contato</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nome</label>
                        <p className="text-sm">{chatwootData.contact?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm">{chatwootData.contact?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Telefone</label>
                        <p className="text-sm">{chatwootData.contact?.phone_number || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Última Atividade</label>
                        <p className="text-sm">
                          {chatwootData.contact?.last_activity_at 
                            ? new Date(chatwootData.contact.last_activity_at * 1000).toLocaleString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Informações da Conversa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">ID da Conversa</label>
                        <p className="text-sm">{chatwootData.conversation?.id || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <p className="text-sm">{chatwootData.conversation?.status || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Mensagens não lidas</label>
                        <p className="text-sm">{chatwootData.conversation?.unread_count || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Agente Atual</label>
                        <p className="text-sm">{chatwootData.currentAgent?.name || 'Não atribuído'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;

