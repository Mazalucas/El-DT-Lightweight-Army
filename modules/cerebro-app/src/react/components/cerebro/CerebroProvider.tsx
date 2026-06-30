import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { UiCue, MomentCardBlock, CerebroContextResponse, CerebroNavigationContext } from '@shared/cerebro-chat.js';
import { api } from '../../../lib/api.js';
import { buildCerebroClientContext } from '../../../lib/cerebro-context.js';
import {
  loadDismissedMoments,
  markMomentDelivered,
  resolveMomentKey,
  shouldSurfaceProactiveMoment,
} from '../../../lib/cerebro-context.js';
import { meetingPrepChipPrompt, primaryEvidenceRef } from '../../../lib/meeting-prep-cerebro.js';
import { useAuth } from '../../auth.js';
import { useSettings } from '../../hooks.js';
import { useEntityLifecycleStore } from '../../lib/entity-action/entity-lifecycle-store.js';
import type { EntityRef } from '@shared/cerebro-elements.js';
import type { MeetingPrepFactChip, MeetingPrepInsight } from '@shared/types.js';

interface CerebroUiState {
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  expandedRoute: boolean;
  openExpanded: () => void;
  activeCue: UiCue | null;
  applyCue: (cue: UiCue) => void;
  clearCue: () => void;
  contextData: CerebroContextResponse | null;
  refreshContext: () => Promise<void>;
  insertMoment: (moment: MomentCardBlock) => void;
  pendingMoment: MomentCardBlock | null;
  clearPendingMoment: () => void;
  pendingPrompt: string | null;
  clearPendingPrompt: () => void;
  askAboutEntity: (opts: { ref: EntityRef; prompt: string }) => void;
  askAboutMeetingPrepChip: (opts: { insight: MeetingPrepInsight; chip: MeetingPrepFactChip }) => void;
  meetingPrepFocus: CerebroNavigationContext['meetingPrepFocus'];
  clearMeetingPrepFocus: () => void;
}

const CerebroUiContext = createContext<CerebroUiState | null>(null);

export function CerebroProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeCue, setActiveCue] = useState<UiCue | null>(null);
  const [contextData, setContextData] = useState<CerebroContextResponse | null>(null);
  const [pendingMoment, setPendingMoment] = useState<MomentCardBlock | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [meetingPrepFocus, setMeetingPrepFocus] = useState<CerebroNavigationContext['meetingPrepFocus']>();
  const focusedEntity = useEntityLifecycleStore((s) => s.focusedEntity);
  const visibleEntities = useEntityLifecycleStore((s) => s.visibleEntities);
  const setFocusedEntity = useEntityLifecycleStore((s) => s.setFocusedEntity);

  const clientContext = useMemo(
    () =>
      buildCerebroClientContext({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        user,
        viewport: window.innerWidth < 768 ? 'mobile' : 'desktop',
        preferences: settings?.cerebro
          ? {
              proactiveLevel: settings.cerebro.proactiveLevel,
              meetingReminderMinutes: settings.cerebro.meetingReminderMinutes,
              chipMeetingMinutesMax: settings.cerebro.chipMeetingMinutesMax,
              liveElements: settings.cerebro.liveElements,
            }
          : undefined,
        settings: settings ?? null,
        focusedEntity,
        visibleEntities: visibleEntities.length ? visibleEntities : undefined,
        meetingPrepFocus,
      }),
    [location.pathname, location.search, location.hash, user, settings, focusedEntity, visibleEntities, meetingPrepFocus],
  );

  const refreshContext = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.cerebroContext(clientContext, loadDismissedMoments());
      setContextData(data);
      if (data.proactiveMoment && panelOpen && shouldSurfaceProactiveMoment(data.proactiveMoment)) {
        markMomentDelivered(resolveMomentKey(data.proactiveMoment));
        setPendingMoment(data.proactiveMoment);
      }
    } catch {
      /* heartbeat optional */
    }
  }, [user, clientContext, panelOpen]);

  useEffect(() => {
    if (!panelOpen || !user) return;
    void refreshContext();
    const id = window.setInterval(() => void refreshContext(), 60_000);
    return () => window.clearInterval(id);
  }, [panelOpen, user, refreshContext]);

  const applyCue = useCallback(
    (cue: UiCue) => {
      if (cue.action === 'clear') {
        setActiveCue(null);
        return;
      }
      if (cue.navigateTo) {
        const path = cue.navigateTo.replace(/^#/, '');
        if (cue.settingsSection) {
          navigate(`${path}?section=${cue.settingsSection}`);
        } else {
          navigate(path || '/');
        }
      }
      if (cue.action === 'navigate') {
        setActiveCue(null);
        return;
      }
      setActiveCue(cue);
      window.setTimeout(() => setActiveCue(null), 12_000);
    },
    [navigate],
  );

  const clearCue = useCallback(() => setActiveCue(null), []);

  const insertMoment = useCallback((moment: MomentCardBlock) => {
    setPendingMoment(moment);
  }, []);

  const clearPendingMoment = useCallback(() => setPendingMoment(null), []);

  const clearPendingPrompt = useCallback(() => setPendingPrompt(null), []);

  const askAboutEntity = useCallback(({ ref, prompt }: { ref: EntityRef; prompt: string }) => {
    setMeetingPrepFocus(undefined);
    setFocusedEntity(ref);
    setPendingPrompt(prompt);
    setPanelOpen(true);
  }, [setFocusedEntity]);

  const clearMeetingPrepFocus = useCallback(() => setMeetingPrepFocus(undefined), []);

  const askAboutMeetingPrepChip = useCallback(
    ({ insight, chip }: { insight: MeetingPrepInsight; chip: MeetingPrepFactChip }) => {
      const ref = primaryEvidenceRef(chip.evidence);
      if (ref) setFocusedEntity(ref);
      setMeetingPrepFocus({
        calendarEventId: insight.calendarEventId,
        eventTitle: insight.eventTitle,
        factKind: chip.kind,
        chipLabel: chip.label,
      });
      setPendingPrompt(meetingPrepChipPrompt(insight, chip));
      setPanelOpen(true);
    },
    [setFocusedEntity],
  );

  const value: CerebroUiState = {
    panelOpen,
    setPanelOpen,
    expandedRoute: location.pathname === '/cerebro' || location.pathname === '/asistente',
    openExpanded: () => navigate('/cerebro'),
    activeCue,
    applyCue,
    clearCue,
    contextData,
    refreshContext,
    insertMoment,
    pendingMoment,
    clearPendingMoment,
    pendingPrompt,
    clearPendingPrompt,
    askAboutEntity,
    askAboutMeetingPrepChip,
    meetingPrepFocus,
    clearMeetingPrepFocus,
  };

  return <CerebroUiContext.Provider value={value}>{children}</CerebroUiContext.Provider>;
}

export function useCerebroUi(): CerebroUiState {
  const ctx = useContext(CerebroUiContext);
  if (!ctx) throw new Error('useCerebroUi requires CerebroProvider');
  return ctx;
}
