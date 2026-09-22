import React, { useState } from 'react';
import { ViewMode } from '../types';

interface LayoutProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  children: React.ReactNode;
  chatComponent: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onViewChange, children, chatComponent }) => {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Top Header & Navigation */}
      <header className="bg-slate-900 text-white flex-shrink-0 shadow-lg z-20">
        <div className="flex items-center justify-between px-4 h-14">
          
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-lg font-bold leading-none bg-gradient-to-r from-blue-100 to-teal-100 bg-clip-text text-transparent">
                        mIF Explorer
                    </h1>
                    <span className="text-[10px] text-slate-400 font-mono">v2.1</span>
                </div>
            </div>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-slate-700 mx-2"></div>

            {/* Tabs */}
            <nav className="flex space-x-1">
                <TabItem label="Dashboard" active={currentView === 'dashboard'} onClick={() => onViewChange('dashboard')} />
                <TabItem label="File Browser" active={currentView === 'files'} onClick={() => onViewChange('files')} />
                <TabItem label="Panel Library" active={currentView === 'panels'} onClick={() => onViewChange('panels')} />
                <TabItem label="Targets" active={currentView === 'antibodies'} onClick={() => onViewChange('antibodies')} />
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors border ${isChatOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="text-sm font-medium">AI Assistant</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main View */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-50">
          {children}
        </main>

        {/* AI Sidebar */}
        <aside 
            className={`flex-shrink-0 bg-white border-l border-slate-200 transition-all duration-300 ease-in-out flex flex-col ${isChatOpen ? 'w-96 translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'}`}
        >
            <div className="h-full w-96"> {/* Fixed width container to prevent layout reflow inside sidebar during transition */}
                {chatComponent}
            </div>
        </aside>
      </div>
    </div>
  );
};

const TabItem: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
      active 
        ? 'bg-slate-700 text-white shadow-md' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    {label}
  </button>
);