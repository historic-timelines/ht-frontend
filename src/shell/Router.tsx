import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import App from "../App";
import { createTimelineRepo, type TimelineSummary } from "../timelineEdition";
import { WelcomeScreen } from "./WelcomeScreen";

// TODO: agregar campo `slug` en el backend. Si un nodo no tiene slug,
// generarlo con IA en el idioma principal del sitio (actualmente: español).
// Por ahora se usa el id como slug de URL.
const timelineRepo = createTimelineRepo();

function WelcomeRoute() {
  const navigate = useNavigate();
  const [timelines, setTimelines] = useState<TimelineSummary[] | null>(null);

  useEffect(() => {
    timelineRepo.list().then(setTimelines).catch(() => setTimelines([]));
  }, []);

  return (
    <WelcomeScreen
      timelines={timelines}
      onSelectTimeline={(id) => navigate(`/${id}`)}
    />
  );
}

const routerBasename =
  import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export function AppRouter() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route path="/" element={<WelcomeRoute />} />
        <Route path="/:timelineSlug" element={<App />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
