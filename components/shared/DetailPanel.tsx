'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  tabs?: Array<{
    id: string;
    label: string;
    content: ReactNode;
  }>;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  children?: ReactNode;
  actions?: ReactNode;
  headerColor?: string;
}

export default function DetailPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  tabs,
  currentTab,
  onTabChange,
  children,
  actions,
  headerColor = 'from-blue-600 to-blue-700'
}: DetailPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-r ${headerColor} text-white p-6 flex items-start justify-between`}>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{title}</h2>
            {subtitle && (
              <p className="text-blue-100 mt-1">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {actions}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`py-3 border-b-2 font-medium transition-colors text-sm ${
                    currentTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tabs && currentTab ? (
            tabs.find(t => t.id === currentTab)?.content
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
