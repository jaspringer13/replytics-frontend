# Replytics Website File Structure

**Last Updated:** 2025-07-20 at 20:30:31 UTC

## Maintenance & Automation

This file tree documentation requires regular updates as the project evolves. To maintain accuracy:

### Automation Options
1. **Pre-commit Hook**: Automatically reminds developers to update FILETREE.md when new files are added
2. **GitHub Action**: Detects file structure changes and creates PR reminders for documentation updates  
3. **Auto-generation Script**: Generates the basic file structure, allowing developers to add status annotations

### Update Process
- Update this file when adding/removing major components
- Use the status indicators: ✅ IMPLEMENTED, 🚧 PLACEHOLDER, ❌ NOT IMPLEMENTED
- Keep the timestamp current when making changes
- Run `npm run generate-filetree` to regenerate the basic structure

### Status Indicators
- ✅ **IMPLEMENTED**: Feature is complete and working
- 🚧 **PLACEHOLDER**: Basic structure exists, needs implementation  
- ❌ **NOT IMPLEMENTED**: Planned feature, not started yet

---

```text
Replytics Website/
├── app/
│   ├── ai/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts # TypeScript module
│   │   ├── dashboard/
│   │   ├── performance/
│   │   │   └── route.ts # TypeScript module
│   │   └── v2/
│   │       └── ai/
│   ├── auth/
│   │   ├── error/
│   │   │   └── page.tsx # Page component
│   │   ├── forgot-password/
│   │   │   └── page.tsx # Page component
│   │   ├── reset-password/
│   │   │   └── page.tsx # Page component
│   │   └── signin/
│   │       └── page.tsx # Page component
│   ├── businesses/
│   │   ├── barbers/
│   │   │   └── page.tsx # Page component
│   │   ├── beauty-salons/
│   │   │   └── page.tsx # Page component
│   │   ├── massage-wellness/
│   │   │   └── page.tsx # Page component
│   │   ├── nail-salons/
│   │   │   └── page.tsx # Page component
│   │   └── tattoo/
│   │       └── page.tsx # Page component
│   ├── dashboard/
│   │   ├── analytics/
│   │   │   └── page.tsx # Page component
│   │   ├── billing/
│   │   │   └── page.tsx # Page component
│   │   ├── calendar/
│   │   │   └── page.tsx # Page component
│   │   ├── calls/
│   │   │   └── page.tsx # Page component
│   │   ├── clients/
│   │   │   └── page.tsx # Page component
│   │   ├── customers/
│   │   │   └── page.tsx # Page component
│   │   ├── messages/
│   │   │   └── page.tsx # Page component
│   │   ├── phone-numbers/
│   │   │   └── page.tsx # Page component
│   │   ├── settings/
│   │   │   └── page.tsx # Page component
│   │   ├── sms/
│   │   │   └── page.tsx # Page component
│   │   ├── support/
│   │   │   └── page.tsx # Page component
│   │   ├── billing.tsx # React component
│   │   ├── calendar.tsx # React component
│   │   ├── calls.tsx # React component
│   │   ├── layout.tsx # Layout component
│   │   ├── page.tsx # Page component
│   │   ├── settings.tsx # React component
│   │   └── support.tsx # React component
│   ├── models/
│   │   ├── ai.ts # TypeScript module
│   │   ├── dashboard.ts # TypeScript module
│   │   ├── phone-number.ts # TypeScript module
│   │   └── staff.ts # TypeScript module
│   ├── onboarding/
│   │   ├── page.tsx # Page component
│   │   ├── step2.tsx # React component
│   │   └── step3.tsx # React component
│   ├── performance-smoke-test/
│   │   └── page.tsx # Page component
│   ├── pricing/
│   │   └── page.tsx # Page component
│   ├── privacy/
│   │   └── page.tsx # Page component
│   ├── services/
│   │   └── dashboard/
│   │       └── voice_settings_service.ts # TypeScript module
│   ├── sms-opt-in/
│   │   └── page.tsx # Page component
│   ├── terms/
│   │   └── page.tsx # Page component
│   ├── test-settings/
│   ├── websocket/
│   │   └── dashboard_handler.ts # TypeScript module
│   ├── error.tsx # React component
│   ├── layout.tsx # Layout component
│   └── page.tsx # Page component
├── components/
│   ├── businesses/
│   │   └── BusinessPageTemplate.tsx # React component
│   ├── dashboard/
│   │   ├── analytics/
│   │   │   ├── AIInsights.tsx # React component
│   │   │   ├── AnalyticsContent.tsx # React component
│   │   │   ├── AnalyticsHeader.tsx # React component
│   │   │   ├── CustomerSegmentsChart.tsx # React component
│   │   │   ├── KPICard.tsx # React component
│   │   │   ├── NoShowVisualization.tsx # React component
│   │   │   ├── PopularTimesChart.tsx # React component
│   │   │   ├── RevenueTrendChart.tsx # React component
│   │   │   └── ServicePerformanceChart.tsx # React component
│   │   ├── charts/
│   │   │   └── ChartWrapper.tsx # React component
│   │   ├── customers/
│   │   │   ├── CustomerCard.tsx # React component
│   │   │   ├── CustomerDetailsDrawer.tsx # React component
│   │   │   ├── CustomerMemoryTab.tsx # React component
│   │   │   └── SegmentFilter.tsx # React component
│   │   ├── messages/
│   │   │   ├── ConversationList.tsx # React component
│   │   │   ├── MessageTemplates.tsx # React component
│   │   │   └── MessageThread.tsx # React component
│   │   ├── overview/
│   │   │   ├── AIActivityFeed.tsx # React component
│   │   │   ├── InsightCards.tsx # React component
│   │   │   ├── QuickActions.tsx # React component
│   │   │   └── ServicePerformance.tsx # React component
│   │   ├── phone-onboarding/
│   │   │   └── PhoneOnboardingWizard.tsx # React component
│   │   ├── settings/
│   │   │   ├── __tests__/
│   │   │   ├── integrations/
│   │   │   │   ├── EnhancedIntegrationCard.tsx # React component
│   │   │   │   ├── index.ts # TypeScript module
│   │   │   │   ├── useOAuthIntegration.ts # TypeScript module
│   │   │   │   └── useTestConnection.ts # TypeScript module
│   │   │   ├── staff/
│   │   │   │   └── StaffManagementTab.tsx # React component
│   │   │   ├── voice/
│   │   │   │   ├── useVoicePreview.ts # TypeScript module
│   │   │   │   ├── VoiceConfigurationForm.tsx # React component
│   │   │   │   ├── VoicePreviewSection.tsx # React component
│   │   │   │   └── VoiceSettingsControls.tsx # React component
│   │   │   ├── AddPhoneNumberDialog.tsx # React component
│   │   │   ├── BusinessProfileTab.tsx # React component
│   │   │   ├── HoursEditor.tsx # React component
│   │   │   ├── IntegrationsTab.tsx # React component
│   │   │   ├── PhoneNumberSelector.tsx # React component
│   │   │   ├── ServiceEditor.tsx # React component
│   │   │   ├── ServicesManagementTab.tsx # React component
│   │   │   ├── Settings-PhoneScoped.tsx # React component
│   │   │   ├── Settings.tsx # React component
│   │   │   ├── SettingsHeader.tsx # React component
│   │   │   ├── SettingsLoadingWrapper.tsx # React component
│   │   │   ├── settingsTabConfig.ts # TypeScript module
│   │   │   ├── SettingsTabContent.tsx # React component
│   │   │   ├── SettingsTabNavigation.tsx # React component
│   │   │   ├── SMSConfigurationTab.tsx # React component
│   │   │   ├── StaffManagementTab.tsx # React component
│   │   │   └── VoiceConversationTab.tsx # React component
│   │   ├── ActivityTable.tsx # React component
│   │   ├── AIChatWidget.tsx # React component
│   │   ├── ConnectionStatus.tsx # React component
│   │   ├── ConnectionStatusIndicator.tsx # React component
│   │   ├── DashboardError.tsx # React component
│   │   ├── DashboardLayout.tsx # React component
│   │   ├── DashboardOverview.tsx # React component
│   │   ├── LiveCallIndicator.tsx # React component
│   │   ├── RealtimeStats.tsx # React component
│   │   ├── SidebarNav.tsx # React component
│   │   └── StatCard.tsx # React component
│   ├── errors/
│   │   ├── AnalyticsErrorBoundary.tsx # React component
│   │   ├── DashboardErrorBoundary.tsx # React component
│   │   ├── FeatureErrorBoundary.tsx # React component
│   │   ├── index.ts # TypeScript module
│   │   └── SettingsErrorBoundary.tsx # React component
│   ├── marketing/
│   │   ├── CTASection.tsx # React component
│   │   ├── FAQAccordion.tsx # React component
│   │   ├── FeatureGrid.tsx # React component
│   │   ├── HeroSection.tsx # React component
│   │   ├── MemoryInAction.tsx # React component
│   │   ├── PricingTable.tsx # React component
│   │   ├── SocialProof.tsx # React component
│   │   ├── TestimonialCard.tsx # React component
│   │   └── TestimonialSection.tsx # React component
│   ├── providers/
│   │   ├── PerformanceProvider.tsx # React component
│   │   ├── QueryProvider.tsx # React component
│   │   └── SessionProvider.tsx # React component
│   ├── shared/
│   │   ├── Footer.tsx # React component
│   │   ├── Logo.tsx # React component
│   │   └── Navbar.tsx # React component
│   └── ui/
│       ├── alert.tsx # React component
│       ├── AnimatedCounter.tsx # React component
│       ├── Badge.tsx # React component
│       ├── Button.tsx # React component
│       ├── Card.tsx # React component
│       ├── dialog.tsx # React component
│       ├── dropdown-menu.tsx # React component
│       ├── Input.tsx # React component
│       ├── label.tsx # React component
│       ├── radio-group.tsx # React component
│       ├── select.tsx # React component
│       ├── separator.tsx # React component
│       ├── slider.tsx # React component
│       ├── switch.tsx # React component
│       ├── tabs.tsx # React component
│       ├── textarea.tsx # React component
│       └── Toast.tsx # React component
├── contexts/
│   ├── AnalyticsContext.tsx # React component
│   ├── AuthContext.tsx # React component
│   ├── PhoneSettingsContext.tsx # React component
│   └── SettingsContext.tsx # React component
├── hooks/
│   ├── api/
│   │   ├── useAIActivities.ts # TypeScript module
│   │   ├── useBilling.ts # TypeScript module
│   │   ├── useBookings.ts # TypeScript module
│   │   ├── useCalls.ts # TypeScript module
│   │   ├── useSMS.ts # TypeScript module
│   │   └── useStats.ts # TypeScript module
│   ├── domain/
│   │   ├── analytics/
│   │   ├── billing/
│   │   ├── customers/
│   │   └── messaging/
│   ├── useAnalytics.ts # TypeScript module
│   ├── useBackendData.ts # TypeScript module
│   ├── useConnectionStatus.ts # TypeScript module
│   ├── useCustomers.ts # TypeScript module
│   ├── useCustomerSegmentCounts.ts # TypeScript module
│   ├── useDashboardData.ts # TypeScript module
│   ├── usePhoneRealtimeUpdates.ts # TypeScript module
│   ├── useSupabase.ts # TypeScript module
│   ├── useToast.ts # TypeScript module
│   ├── useUserTenant.ts # TypeScript module
│   └── useVoiceAgentStatus.ts # TypeScript module
├── lib/
│   ├── api/
│   │   └── voice-bot.ts # TypeScript module
│   ├── config/
│   │   ├── api.ts # TypeScript module
│   │   ├── environment.ts # TypeScript module
│   │   ├── features.ts # TypeScript module
│   │   ├── index.ts # TypeScript module
│   │   ├── limits.ts # TypeScript module
│   │   ├── types.ts # TypeScript module
│   │   ├── ui.ts # TypeScript module
│   │   └── validation.ts # TypeScript module
│   ├── dashboard/
│   │   └── data-coordinator.ts # TypeScript module
│   ├── errors/
│   │   ├── factory.ts # TypeScript module
│   │   ├── guards.ts # TypeScript module
│   │   └── types.ts # TypeScript module
│   ├── hooks/
│   │   ├── useAnalyticsData.ts # TypeScript module
│   │   ├── usePhoneNumbers.ts # TypeScript module
│   │   ├── usePhoneSettings.ts # TypeScript module
│   │   ├── useRealtimeConfig.ts # TypeScript module
│   │   └── useSettingsData.ts # TypeScript module
│   ├── performance/
│   │   └── metrics.ts # TypeScript module
│   ├── realtime/
│   │   └── phone-channels.ts # TypeScript module
│   ├── storage/
│   │   └── indexed-db.ts # TypeScript module
│   ├── types/
│   │   ├── api/
│   │   │   ├── analytics/
│   │   │   ├── billing/
│   │   │   ├── customers/
│   │   │   └── messaging/
│   │   └── next-auth.d.ts # TypeScript module
│   ├── utils/
│   │   ├── businessHours.ts # TypeScript module
│   │   └── currency.ts # TypeScript module
│   ├── api-client.ts # TypeScript module
│   ├── auth-config.ts # TypeScript module
│   ├── auth-utils.ts # TypeScript module
│   ├── calendar.ts # TypeScript module
│   ├── chart-config.ts # TypeScript module
│   ├── constants.ts # TypeScript module
│   ├── message-validation.ts # TypeScript module
│   ├── react-query.ts # TypeScript module
│   ├── realtime-config.ts # TypeScript module
│   ├── supabase-client.ts # TypeScript module
│   ├── supabase-server.ts # TypeScript module
│   ├── time-utils.ts # TypeScript module
│   ├── twilio.ts # TypeScript module
│   ├── utils.ts # TypeScript module
│   └── voice-synthesis.ts # TypeScript module
├── styles/
│   └── globals.css
├── supabase/
│   └── migrations/
│       └── 20240101_dashboard_v2_schema.sql # Database migration
├── claude.md
├── middleware.ts # TypeScript module
├── next-env.d.ts # TypeScript module
├── next.config.js # Configuration
├── package.json # Project dependencies
├── README.md
├── tsconfig.json # Configuration
```

## Notes

- This file tree was auto-generated on 2025-07-20 at 20:30:31 UTC
- Add status indicators (✅🚧❌) next to components as you work on them
- Keep implementation status updated for better project tracking
- Focus on major components and architectural elements

## Quick Status Update Commands

```bash
# Regenerate the file tree structure
npm run generate-filetree

# Install pre-commit hooks
npm run setup-hooks

# Check what needs documentation updates
git diff --name-only HEAD~1 | grep -E "\.(tsx?|py|sql)$"
```