import React, { useState, useEffect } from 'react';
import { Lead, MessageTemplate, interpolateTemplate, buildWhatsAppLink } from '../utils/leads.ts';
import { X, Send, Copy, Check, MessageSquare, Sparkles, Building2, Phone, ExternalLink } from 'lucide-react';

interface WhatsAppModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  templates: MessageTemplate[];
  userName: string;
  onMarkAsContacted: (leadId: string) => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  lead,
  isOpen,
  onClose,
  templates,
  userName,
  onMarkAsContacted
}) => {
  if (!isOpen || !lead) return null;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // When lead or template changes, interpolate message
  useEffect(() => {
    const tpl = templates.find(t => t.id === selectedTemplateId) || templates[0];
    if (tpl) {
      setCustomMessage(interpolateTemplate(tpl.content, lead, userName));
    }
  }, [selectedTemplateId, lead, userName, templates]);

  const handleInsertTag = (tag: string) => {
    setCustomMessage(prev => `${prev} ${tag}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const url = buildWhatsAppLink(lead.rawPhone, customMessage);
    window.open(url, '_blank');
    onMarkAsContacted(lead.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Enviar Mensagem WhatsApp</h3>
              <p className="text-xs text-emerald-100 flex items-center gap-1">
                <span>{lead.name}</span>
                <span>•</span>
                <span>{lead.phone}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Target Business Summary */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <div>
                <span className="font-bold text-gray-800">{lead.name}</span>
                <span className="text-gray-500 ml-1">({lead.neighborhood})</span>
              </div>
            </div>
            <div className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <Phone className="w-3 h-3" />
              <span>{lead.phone}</span>
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>Selecione um Modelo de Mensagem:</span>
              <span className="text-[11px] font-normal text-gray-500">Modelo salvo personalizável</span>
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {templates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  [{tpl.category}] {tpl.title}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Message Textarea */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>Mensagem Personalizada:</span>
              <span className="text-[11px] text-gray-400">{customMessage.length} caracteres</span>
            </label>
            <textarea
              rows={5}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 text-xs bg-gray-50/70 focus:bg-white border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
              placeholder="Digite sua mensagem ou use os botões abaixo..."
            />
          </div>

          {/* Quick variable tags */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-gray-500 mr-1 flex items-center gap-0.5">
              <Sparkles className="w-3 h-3 text-amber-500" /> Inserir tag:
            </span>
            {['{nome}', '{bairro}', '{cidade}', '{categoria}', '{meu_nome}'].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleInsertTag(tag)}
                className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 border border-gray-200 transition-colors font-mono cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200/60 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Abrir no WhatsApp</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
