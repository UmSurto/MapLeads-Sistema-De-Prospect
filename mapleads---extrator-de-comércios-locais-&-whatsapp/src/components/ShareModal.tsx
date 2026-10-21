import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Mail, Twitter, Linkedin, Send, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: string;
  category: string;
  totalLeads: number;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  location,
  category,
  totalLeads
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  // Generate current shareable URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const shareUrl = `${baseUrl}?loc=${encodeURIComponent(location)}&cat=${encodeURIComponent(category)}`;
  const shareText = `Confira a lista de ${totalLeads} comércios locais de ${category} em ${location} extraídos no MapLeads!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank');
  };

  const shareViaEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(`Comércios Locais em ${location}`)}&body=${encodeURIComponent(`${shareText}\n\nAcesse: ${shareUrl}`)}`, '_blank');
  };

  const shareViaTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareViaLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareViaTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            <h3 className="font-bold text-base">Compartilhar Resultados da Busca</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-600">
            Envie esta busca de <strong>{category}</strong> em <strong>{location}</strong> ({totalLeads} comércios) diretamente para sua equipe ou redes sociais.
          </p>

          {/* Social share icons grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <button
              onClick={shareViaWhatsApp}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={shareViaEmail}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 text-red-500" />
              <span>E-mail</span>
            </button>

            <button
              onClick={shareViaTelegram}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4 text-sky-500" />
              <span>Telegram</span>
            </button>

            <button
              onClick={shareViaTwitter}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Twitter className="w-4 h-4" />
              <span>Twitter / X</span>
            </button>

            <button
              onClick={shareViaLinkedIn}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200 transition-colors cursor-pointer sm:col-span-2"
            >
              <Linkedin className="w-4 h-4 text-blue-600" />
              <span>LinkedIn</span>
            </button>
          </div>

          {/* Copy Direct Link */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Link direto:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 font-mono select-all focus:outline-hidden"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
