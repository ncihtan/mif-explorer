import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { useFilters } from '../hooks/useFilters';
import { dataService } from '../services/dataService';
import { PanelConfig, ViewMode } from '../types';

interface PanelExplorerProps {
  onNavigate?: (view: ViewMode) => void;
}

export const PanelExplorer: React.FC<PanelExplorerProps> = ({ onNavigate }) => {
  const { panels, isLoading } = useData();
  const { updateFilter, resetFilters } = useFilters();
  const [search, setSearch] = useState('');
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  if (isLoading) return <div>Loading...</div>;

  const panelEntries = (Object.entries(panels) as [string, PanelConfig][]).filter(([id, config]) => {
    const q = search.toLowerCase();
    return id.toLowerCase().includes(q) || (config.center && config.center.toLowerCase().includes(q));
  });

  const selectedPanel = selectedPanelId ? (panels[selectedPanelId] as PanelConfig) : null;
  const relatedFiles = selectedPanelId ? dataService.getFilesForPanel(selectedPanelId) : [];

  const handleViewInBrowser = (panelId: string) => {
    if (onNavigate) {
      resetFilters();
      updateFilter('panelIds', [panelId]);
      onNavigate('files');
    }
  };

  const handleViewSpecificFile = (panelId: string, fileId: string) => {
    if (onNavigate) {
      resetFilters();
      updateFilter('panelIds', [panelId]);
      updateFilter('searchQuery', fileId);
      onNavigate('files');
    }
  }

  return (
    <div className="flex h-full bg-white">
      {/* List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <input
            type="text"
            placeholder="Search panels (ID or Center)..."
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {panelEntries.map(([id, config]) => (
            <div
              key={id}
              onClick={() => setSelectedPanelId(id)}
              className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedPanelId === id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-800 font-mono text-sm">{id}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{config.targets.length} targets</span>
              </div>
              <p className="text-sm text-slate-500 truncate">{config.center || 'Unknown Center'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="w-2/3 p-8 overflow-y-auto bg-slate-50">
        {selectedPanel && selectedPanelId ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-slate-900 font-mono">{selectedPanelId}</h2>
                  <a 
                    href={`https://www.synapse.org/Synapse:${selectedPanelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    title="View on Synapse"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <h3 className="text-lg text-slate-600">{selectedPanel.center}</h3>
              </div>
              <div className="flex flex-col items-end">
                 <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                    {selectedPanel.assay_type || 'MxIF'}
                 </span>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Panel Usage</h4>
                 <div className="flex gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex-1">
                       <span className="block text-2xl font-bold text-slate-800">
                          {relatedFiles.length}
                       </span>
                       <span className="text-xs text-slate-500 uppercase font-semibold">Related Files</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex-1">
                       <span className="block text-2xl font-bold text-slate-800">
                          {selectedPanel.targets.length}
                       </span>
                       <span className="text-xs text-slate-500 uppercase font-semibold">Biomarkers</span>
                    </div>
                 </div>
              </section>

              <section>
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Associated Files</h4>
                    <button 
                        onClick={() => handleViewInBrowser(selectedPanelId)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                    >
                        View All in File Browser &rarr;
                    </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    {relatedFiles.length > 0 ? (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">File ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Participant</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Diagnosis</th>
                                    <th className="px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {relatedFiles.map(file => (
                                    <tr key={file.file_id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 text-xs font-mono text-slate-700">{file.file_id}</td>
                                        <td className="px-4 py-2 text-xs text-slate-600">{file.participant_id}</td>
                                        <td className="px-4 py-2 text-xs text-slate-600">{file.diagnosis || '-'}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button 
                                                onClick={() => handleViewSpecificFile(selectedPanelId, file.file_id)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="View file details"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-4 text-center text-sm text-slate-500">No files associated with this panel.</div>
                    )}
                </div>
              </section>

              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Channel Configuration</h4>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Biomarker</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Channel / Fluorophore</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {selectedPanel.targets.map((target) => (
                        <tr key={target} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{target}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                             {selectedPanel.channels[target] || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <p>Select a panel to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};