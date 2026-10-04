"use client";

import { usePersonalData } from "@/components/personal-data-provider";

export function PersonalDataStatus() {
  const { user, syncError, syncNotice, importAvailable, syncing, importLocalData, retryCloudLoad } = usePersonalData();
  if (!user || (!syncError && !syncNotice && !importAvailable)) return null;

  return (
    <section className={"personal-sync-banner" + (syncError ? " has-error" : "")} role={syncError ? "alert" : "status"}>
      <div className="personal-sync-copy">
        <strong>{syncError ? "Cloud sync needs attention" : importAvailable ? "Local data is available" : "Personal data sync"}</strong>
        <span>
          {syncError ?? syncNotice ?? "Import your existing Watchlist, Portfolio, Investment Memory, and Investment Notes into this empty Supabase account. Nothing will be overwritten, and your local copy will stay on this device."}
        </span>
      </div>
      {importAvailable ? (
        <button type="button" className="primary-button" onClick={() => void importLocalData()} disabled={syncing}>
          {syncing ? "Importing…" : "Import local data"}
        </button>
      ) : syncError ? (
        <button type="button" className="text-action" onClick={() => void retryCloudLoad()} disabled={syncing}>
          {syncing ? "Refreshing…" : "Refresh cloud data"}
        </button>
      ) : null}
    </section>
  );
}
