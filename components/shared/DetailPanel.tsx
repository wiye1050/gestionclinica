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
  variant?: 'modal' | 'drawer';
  headerTextClassName?: string;
  headerSubtitleClassName?: string;
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
  headerColor = 'from-blue-600 to-blue-700',
  variant = 'modal',
  headerTextClassName = 'text-white',
  headerSubtitleClassName = 'text-blue-100',
}: DetailPanelProps) {
  if (!isOpen) return null;

  const isDrawer = variant === 'drawer';

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-black/50 ${
        isDrawer ? 'justify-end items-stretch' : 'items-center justify-center p-4'
      }`}
    >
      <div
        className={`bg-white shadow-2xl flex flex-col ${
          isDrawer
            ? 'h-full w-full max-w-xl rounded-none rounded-l-3xl'
            : 'rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden'
        }`}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${headerColor} ${headerTextClassName} p-6 flex items-start justify-between`}>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{title}</h2>
            {subtitle && (
              <p className={`${headerSubtitleClassName} mt-1`}>{subtitle}</p>
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
