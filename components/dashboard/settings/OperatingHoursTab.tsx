"use client"

import React from 'react';
import { HoursEditor } from './HoursEditor';

interface OperatingHoursTabProps {
  businessId: string;
}

export function OperatingHoursTab({ businessId }: OperatingHoursTabProps) {
  return <HoursEditor businessId={businessId} />;
}