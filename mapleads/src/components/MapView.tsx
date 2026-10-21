import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Lead, buildWhatsAppLink } from '../utils/leads.ts';
import { MapPin, Phone, Globe, Star, MessageCircle, ExternalLink } from 'lucide-react';

interface MapViewProps {
  apiKey: string;
  leads: Lead[];
  center: { lat: number; lng: number };
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onOpenWhatsAppModal: (lead: Lead) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  apiKey,
  leads,
  center,
  selectedLead,
  onSelectLead,
  onOpenWhatsAppModal
}) => {
  const [activeMarkerLead, setActiveMarkerLead] = useState<Lead | null>(selectedLead);

  // If no API key or map error, render a clean styled visual map fallback with coordinates
  if (!apiKey) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs h-[380px] sm:h-[440px] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
          <MapPin className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-gray-900">Visualização de Mapa Local</h4>
        <p className="text-sm text-gray-500 max-w-md mt-1">
          {leads.length} estabelecimentos encontrados na região de {center.lat.toFixed(4)}, {center.lng.toFixed(4)}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-lg">
          {leads.slice(0, 6).map((lead) => (
            <button
              key={lead.id}
              onClick={() => onSelectLead(lead)}
              className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 text-xs font-medium text-gray-700 flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>{lead.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs relative min-h-[380px] h-[380px] sm:h-[460px] w-full">
      <APIProvider apiKey={apiKey} libraries={['places', 'marker']}>
        <Map
          defaultCenter={center}
          center={center}
          defaultZoom={13}
          zoom={13}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full min-h-[380px]"
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {leads.map((lead) => (
            <AdvancedMarker
              key={lead.id}
              position={{ lat: lead.lat, lng: lead.lng }}
              onClick={() => {
                setActiveMarkerLead(lead);
                onSelectLead(lead);
              }}
              title={lead.name}
            >
              <Pin
                background={lead.hasWhatsApp ? '#1a73e8' : '#ea4335'}
                glyphColor="#ffffff"
                borderColor="#ffffff"
              />
            </AdvancedMarker>
          ))}

          {activeMarkerLead && (
            <InfoWindow
              position={{ lat: activeMarkerLead.lat, lng: activeMarkerLead.lng }}
              onCloseClick={() => setActiveMarkerLead(null)}
            >
              <div className="p-1 min-w-[220px] max-w-[280px] text-left">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase">
                    {activeMarkerLead.category}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{activeMarkerLead.rating.toFixed(1)}</span>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-gray-900 leading-snug">{activeMarkerLead.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{activeMarkerLead.neighborhood} • {activeMarkerLead.address}</p>

                <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-700">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{activeMarkerLead.phone}</span>
                  </div>
                  {activeMarkerLead.hasWebsite && activeMarkerLead.websiteUrl && (
                    <a
                      href={activeMarkerLead.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-0.5"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Site</span>
                    </a>
                  )}
                </div>

                <div className="mt-2.5">
                  <button
                    onClick={() => onOpenWhatsAppModal(activeMarkerLead)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Abrir no WhatsApp</span>
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs p-2 rounded-xl shadow-md border border-gray-200 text-[11px] font-medium text-gray-700 flex flex-col gap-1 z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span>WhatsApp Disponível</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Telefone Fixo / Sem Whats</span>
        </div>
      </div>
    </div>
  );
};
