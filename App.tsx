import React, { useState } from 'react';
import { DataProvider } from './hooks/useData';
import { FilterProvider } from './hooks/useFilters';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { FileExplorer } from './components/FileExplorer';
import { AntibodyExplorer } from './components/AntibodyExplorer';
import { PanelExplorer } from './components/PanelExplorer';
import { ChatInterface } from './components/ChatInterface';
import { ViewMode } from './types';

function App() {
  const [view, setView] = useState<ViewMode>('dashboard');

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard />;
      case 'files': return <FileExplorer />;
      case 'panels': return <PanelExplorer onNavigate={setView} />;
      case 'antibodies': return <AntibodyExplorer />;
      default: return <Dashboard />;
    }
  };

  return (
    <DataProvider>
      <FilterProvider>
        <Layout 
            currentView={view} 
            onViewChange={setView}
            chatComponent={<ChatInterface />}
        >
          {renderView()}
        </Layout>
      </FilterProvider>
    </DataProvider>
  );
}

export default App;