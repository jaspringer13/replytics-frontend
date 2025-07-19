"use client"

import React from 'react';
import { ServiceEditor } from './ServiceEditor';

interface ServicesManagementTabProps {
  businessId: string;
}

export function ServicesManagementTab({ businessId }: ServicesManagementTabProps) {
  return <ServiceEditor businessId={businessId} />;
}