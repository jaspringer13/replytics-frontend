"use client"

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SETTINGS_TABS } from './settingsTabConfig';
import { useSettingsTab } from '@/contexts/SettingsContext';

export function SettingsTabNavigation() {
  const { activeTab, setActiveTab } = useSettingsTab();

  return (
    <TabsList className="grid grid-cols-3 lg:grid-cols-7 gap-2 bg-gray-800/50 p-1">
      {SETTINGS_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2"
          >
            <Icon className="w-4 h-4" />
            <span className="hidden lg:inline">{tab.label}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}