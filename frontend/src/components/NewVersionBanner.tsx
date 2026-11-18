import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// The built app is one script file with the version in its name, e.g.
// /assets/index-AbC123.js. index.html always names the CURRENT one, so if the
// name in a fresh copy of index.html differs from the one this page loaded,
// a new version has been deployed.
const SCRIPT_PATTERN = /\/assets\/index-[\w-]+\.js/;
const CHECK_EVERY_MS = 5 * 60 * 1000;

const loadedScript = (): string | null => {
  for (const script of Array.from(document.scripts)) {
    const match = script.src.match(SCRIPT_PATTERN);
    if (match) return match[0];
  }
  return null; // dev server: no versioned file, nothing to compare
};

const NewVersionBanner = () => {
  const [newVersion, setNewVersion] = useState(false);

  useEffect(() => {
    const current = loadedScript();
    if (!current) return;

    const check = async () => {
      try {
        const response = await fetch("/", { cache: "no-store" });
        if (!response.ok) return;
        const latest = (await response.text()).match(SCRIPT_PATTERN)?.[0];
        if (latest && latest !== current) setNewVersion(true);
      } catch {
        // offline or server restarting: try again at the next check
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    const timer = window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, []);

  if (!newVersion) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-4 rounded-xl border-2 border-blue-500 bg-background px-5 py-3 shadow-lg"
    >
      <span className="text-sm font-medium">A new version is available.</span>
      <Button size="sm" onClick={() => window.location.reload()}>
        Click to reload
      </Button>
    </div>
  );
};

export default NewVersionBanner;
