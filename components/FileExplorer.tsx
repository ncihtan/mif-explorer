import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { useFilters } from '../hooks/useFilters';
import { useDebounce } from '../hooks/useDebounce';
import { filterFiles } from '../services/searchService';
import { dataService } from '../services/dataService';

export const FileExplorer: React.FC = () => {
  const { isLoading, filterOptions } = useData();
  const { filters, updateFilter, toggleArrayFilter, resetFilters } = useFilters();
  
  // Debounce the entire filter state to prevent high-frequency filtering calculations
  // This waits 300ms after the last user interaction before running the heavy filter logic
  const debouncedFilters = useDebounce(filters, 300);

  // Memoized Filtering using the optimized service
  const filteredFiles = useMemo(() => {
    return filterFiles(debouncedFilters);
  }, [debouncedFilters]);

  // Virtualization / Pagination state
  const [visibleCount, setVisibleCount] = useState(50);
  const handleLoadMore = () => setVisibleCount(p => p + 50);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(50);
  }, [debouncedFilters]);

  if (isLoading) return <div className="p-10 text-center">Loading Data...</div>;

  return (
    <div className="flex h-full">
      {/* Filters Pane */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700">Filters</h3>
          <div className="flex gap-2">
            {filters.panelIds.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Panel Active
                </span>
            )}
            <button onClick={resetFilters} className="text-xs text-blue-500 hover:underline">Reset All</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search</label>
            <input 
              type="text" 
              placeholder="Search ID, diagnosis..." 
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
            />
          </div>

          {filters.panelIds.length > 0 && (
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-blue-800">Filtered by Panel</span>
                    <button onClick={() => updateFilter('panelIds', [])} className="text-xs text-blue-500 hover:text-blue-700">Clear</button>
                </div>
                <div className="text-xs text-blue-600 font-mono truncate">
                    {filters.panelIds[0]}
                </div>
             </div>
          )}

          <FilterGroup title="Diagnosis" items={filterOptions.diagnoses} selected={filters.diagnoses} onToggle={(v) => toggleArrayFilter('diagnoses', v)} />
          <FilterGroup title="Research Center" items={filterOptions.centers} selected={filters.centers} onToggle={(v) => toggleArrayFilter('centers', v)} />
          <FilterGroup title="Antibodies" items={filterOptions.antibodies} selected={filters.antibodies} onToggle={(v) => toggleArrayFilter('antibodies', v)} limit={10} />
        </div>
      </div>

      {/* Results Pane */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
        <div className="p-4 bg-white border-b border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">File Manifest</h2>
            <p className="text-sm text-slate-500">
              {filters !== debouncedFilters ? 'Updating...' : `Showing ${filteredFiles.length} results`}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredFiles.slice(0, visibleCount).map((file) => (
              <FileCard key={file.file_id} file={file} />
            ))}
            {filteredFiles.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400">
                    No files match current filters.
                </div>
            )}
          </div>
          
          {visibleCount < filteredFiles.length && (
            <div className="mt-6 text-center">
              <button 
                onClick={handleLoadMore}
                className="px-6 py-2 bg-white border border-slate-300 text-slate-600 rounded-full shadow-sm hover:bg-slate-50 font-medium transition-colors"
              >
                Load More ({filteredFiles.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FileCard: React.FC<{ file: any }> = React.memo(({ file }) => {
  const antibodies = useMemo(() => dataService.getAntibodiesForFile(file.file_id), [file.file_id]);
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-mono text-sm font-bold text-blue-600">{file.file_id}</h4>
          <span className="text-xs text-slate-400">{file.center}</span>
        </div>
        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium">{file.assay_type}</span>
      </div>
      
      <div className="mb-3">
        <p className="text-sm text-slate-800 font-medium">{file.diagnosis || 'Diagnosis Not Reported'}</p>
        <p className="text-xs text-slate-500">Participant: {file.participant_id}</p>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400 mb-2 uppercase font-bold tracking-wider">Targeted Antibodies ({antibodies.length})</p>
        <div className="flex flex-wrap gap-1">
          {antibodies.slice(0, 8).map(ab => (
            <span key={ab} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-100">
              {ab}
            </span>
          ))}
          {antibodies.length > 8 && (
            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[10px] rounded border border-slate-100">
              +{antibodies.length - 8} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

const FilterGroup: React.FC<{ title: string, items: string[], selected: string[], onToggle: (v: string) => void, limit?: number }> = React.memo(({ title, items, selected, onToggle, limit }) => {
  const [expanded, setExpanded] = useState(false);
  const displayItems = limit && !expanded ? items.slice(0, limit) : items;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
        {title}
        {selected.length > 0 && <span className="text-blue-500">{selected.length}</span>}
      </h4>
      <div className="space-y-1">
        {displayItems.map(item => (
          <label key={item} className="flex items-center space-x-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={selected.includes(item)}
              onChange={() => onToggle(item)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
            />
            <span className={`text-sm truncate transition-colors ${selected.includes(item) ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-blue-600'}`}>
              {item || 'Unknown'}
            </span>
          </label>
        ))}
        {limit && items.length > limit && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-500 hover:text-blue-700 mt-1 font-medium"
          >
            {expanded ? 'Show Less' : `Show ${items.length - limit} More`}
          </button>
        )}
      </div>
    </div>
  );
});