"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LiveBarChart } from "@/components/charts/LiveBarChart";
import { PresenterJoinPanel } from "@/components/presenter/PresenterJoinPanel";
import { PresenterControls } from "@/components/presenter/PresenterControls";
import { useHostSession } from "@/hooks/useHostSession";
import { usePollResults } from "@/hooks/usePollResults";
import type { HostPollProps, HostSessionProps } from "@/lib/serialize-host-data";

interface PresenterViewProps {
  sessionId: string;
  initialSession: HostSessionProps;
  initialPolls: HostPollProps[];
}

export function PresenterView({
  sessionId,
  initialSession,
  initialPolls,
}: PresenterViewProps) {
  const { session, polls, activePoll } = useHostSession({
    sessionId,
    initialSession,
    initialPolls,
  });
  const chartData = usePollResults(activePoll);
  const [showJoinCode, setShowJoinCode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "f" || e.key === "F") {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
          return;
        }
        e.preventDefault();
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen]);

  const isLive = !!activePoll && session.isActive;
  const isEnded = !session.isActive;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-slate-100 overflow-hidden"
      role="presentation"
    >
      <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-slate-800 shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-semibold truncate">{session.name}</h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {isLive && (
            <>
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wide"
                aria-live="polite"
              >
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                Live
              </span>
              <span className="text-sm text-slate-400 tabular-nums" aria-live="polite">
                {chartData.totalVotes} vote{chartData.totalVotes !== 1 ? "s" : ""}
              </span>
            </>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:inline text-sm text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800"
            title="Fullscreen (F)"
          >
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
          <Link
            href={`/session/${sessionId}`}
            className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            Exit
          </Link>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-auto">
        {isEnded ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
            <p className="text-2xl font-semibold text-slate-300">Session ended</p>
            <p className="text-slate-500">Final join code</p>
            <p className="text-5xl font-mono font-bold tracking-widest text-white">
              {session.code}
            </p>
            <Link
              href={`/session/${sessionId}`}
              className="text-sm text-primary hover:underline mt-4"
            >
              Back to control panel
            </Link>
          </div>
        ) : isLive ? (
          <div className="h-full flex flex-col lg:flex-row min-h-0">
            <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 lg:p-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 lg:mb-6 leading-tight">
                {activePoll!.question}
              </h2>
              <div className="flex-1 min-h-0">
                <LiveBarChart
                  data={chartData}
                  size="presenter"
                  hideVoteLine
                />
              </div>
            </div>
            {showJoinCode && (
              <aside className="lg:w-80 xl:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 lg:p-6">
                <PresenterJoinPanel
                  sessionId={session.id}
                  code={session.code}
                  sessionName={session.name}
                  compact
                />
              </aside>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center px-4 py-8 gap-6">
            <p className="text-xl sm:text-2xl text-slate-300 text-center">{session.name}</p>
            <p className="text-slate-500 text-sm text-center max-w-md">
              Launch a poll below or from the control panel
            </p>
            {showJoinCode && (
              <PresenterJoinPanel
                sessionId={session.id}
                code={session.code}
                sessionName={session.name}
              />
            )}
          </div>
        )}
      </main>

      {session.isActive && (
        <footer className="shrink-0 border-t border-slate-800 px-4 sm:px-6 py-3 bg-slate-900/90">
          <PresenterControls
            sessionId={sessionId}
            polls={polls}
            activePoll={activePoll}
            sessionOpen={session.isActive}
            showJoinCode={showJoinCode}
            onToggleJoinCode={() => setShowJoinCode((v) => !v)}
          />
        </footer>
      )}
    </div>
  );
}
