import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { dataService } from '../services/dataService';
import type { LibraryEntry } from '../types';

export const AntibodyExplorer: React.FC = () => {
  const { library, isLoading } = useData();
  const [search, setSearch] = useState('');
  const [selectedAntibody, setSelectedAntibody] = useState<string | null>(null);

  if (isLoading) return <div>Loading...</div>;

  const entries = (Object.entries(library) as [string, LibraryEntry][]).filter(([key, val]) => {
    const q = search.toLowerCase();
    return key.toLowerCase().includes(q) || (val.protein_name && val.protein_name.toLowerCase().includes(q));
  });

  return (
    <div className="flex h-full bg-white">
      {/* List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <input
            type="text"
            placeholder="Search targets..."
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {entries.map(([key, data]) => (
            <div
              key={key}
              onClick={() => setSelectedAntibody(key)}
              className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedAntibody === key ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-800">{key}</span>
                {data.uniprot && <span className="text-xs font-mono text-slate-400">{data.uniprot}</span>}
              </div>
              <p className="text-sm text-slate-500 truncate">{data.protein_name || 'No protein name'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="w-2/3 p-8 overflow-y-auto bg-slate-50">
        {selectedAntibody ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">{selectedAntibody}</h2>
                <h3 className="text-lg text-slate-600">{library[selectedAntibody].protein_name}</h3>
              </div>
              {library[selectedAntibody].uniprot ? (
                <a 
                  href={`https://www.uniprot.org/uniprotkb/${library[selectedAntibody].uniprot}/entry`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-transparent transition-colors rounded-full text-slate-600 font-mono text-sm flex items-center gap-1 group"
                >
                  {library[selectedAntibody].uniprot}
                  <svg className="w-3 h-3 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-600 font-mono text-sm">
                  No UniProt
                </span>
              )}
            </div>

            <div className="space-y-8">
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Function</h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {library[selectedAntibody].function || 'No description available.'}
                </p>
              </section>

              <div className="grid grid-cols-2 gap-6">
                <section>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Location</h4>
                  <div className="flex flex-wrap gap-2">
                    {library[selectedAntibody].location.map(l => (
                      <span key={l} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-md text-sm font-medium">
                        {l}
                      </span>
                    ))}
                  </div>
                </section>
                <section>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {library[selectedAntibody].categories.map(c => (
                      <span key={c} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium">
                        {c.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Related Files</h4>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-700 mr-2">
                      {dataService.getFilesWithAntibody(selectedAntibody).length}
                    </span>
                    <span className="text-blue-600">files contain this target</span>
                  </div>
                  <button className="px-4 py-2 bg-white text-blue-600 rounded shadow-sm text-sm font-medium hover:bg-blue-50 border border-blue-200 transition-colors">
                    View in File Explorer
                  </button>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <p>Select a target to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};