import React, { useState } from 'react';
import { MessageTemplate, DEFAULT_TEMPLATES } from '../utils/leads.ts';
import { Plus, Trash2, Edit3, Check, RotateCcw, MessageSquare, Sparkles } from 'lucide-react';

interface TemplateManagerModalProps {
  templates: MessageTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<MessageTemplate[]>>;
  userName: string;
  setUserName: (name: string) => void;
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  templates,
  setTemplates,
  userName,
  setUserName
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editContent, setEditContent] = useState('');

  // New template state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Comercial');
  const [newContent, setNewContent] = useState('');

  const handleStartEdit = (tpl: MessageTemplate) => {
    setEditingId(tpl.id);
    setEditTitle(tpl.title);
    setEditCategory(tpl.category);
    setEditContent(tpl.content);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    setTemplates(prev =>
      prev.map(t =>
        t.id === editingId
          ? { ...t, title: editTitle, category: editCategory, content: editContent }
          : t
      )
    );
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const newTpl: MessageTemplate = {
      id: `tpl-custom-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      content: newContent
    };
    setTemplates(prev => [...prev, newTpl]);
    setIsCreating(false);
    setNewTitle('');
    setNewContent('');
  };

  const handleResetDefaults = () => {
    setTemplates(DEFAULT_TEMPLATES);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Gerenciador Administrativo de Templates de WhatsApp</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Personalize os scripts de abordagem comercial para envio rápido a pequenos empreendimentos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Template</span>
          </button>
        </div>
      </div>

      {/* Sender Profile Settings Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Identificação do Remetente</h3>
          <p className="text-xs text-gray-500">
            Seu nome ou nome da sua agência preenche a tag <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600">{'{meu_nome}'}</code> nas mensagens.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Ex: Carlos (Agência Alfa)"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* New Template Form */}
      {isCreating && (
        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 shadow-sm mb-6 animate-in fade-in">
          <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Criar Novo Modelo de Mensagem</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Título do Script</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Proposta Especial para Salões de Beleza"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Categoria</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
              >
                <option value="Comercial">Comercial</option>
                <option value="Marketing">Marketing / Tráfego</option>
                <option value="Vendas">Vendas Diretas</option>
                <option value="Follow-up">Follow-up</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Corpo da Mensagem</label>
            <textarea
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Digite o modelo... Utilize {nome}, {bairro}, {cidade}, {categoria}, {meu_nome}."
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200/50 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Salvar Template
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(tpl => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              {editingId === tpl.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2 text-xs font-bold border border-gray-200 rounded-lg"
                  />
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg"
                  >
                    <option value="Comercial">Comercial</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Vendas">Vendas</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                  <textarea
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg font-sans"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-md"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-md flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {tpl.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(tpl)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar template"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">{tpl.title}</h4>
                  <p className="text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100 leading-relaxed font-sans">
                    {tpl.content}
                  </p>
                </>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>Tags suportadas: {'{nome}'}, {'{bairro}'}, {'{cidade}'}</span>
              <span>ID: {tpl.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
