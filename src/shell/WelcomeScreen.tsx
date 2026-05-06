import { useState } from "react";
import type { TimelineSummary } from "../timelineEdition";
import { SITE_INSTAGRAM_URL } from "./siteLinks";
import "./WelcomeScreen.css";

type WelcomeScreenProps = {
  timelines: TimelineSummary[] | null;
  onSelectTimeline: (id: string) => void;
  onCreateTimeline: (title: string) => Promise<void>;
};

export function WelcomeScreen({ timelines, onSelectTimeline, onCreateTimeline }: WelcomeScreenProps) {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setCreatePending(true);
    setCreateError(null);
    try {
      await onCreateTimeline(title);
    } catch {
      setCreateError("No se pudo crear la línea de tiempo. Intentá de nuevo.");
      setCreatePending(false);
    }
  }

  function handleCancel() {
    setShowForm(false);
    setNewTitle("");
    setCreateError(null);
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-screen-inner">
        <h1 className="welcome-title">Historia Argentina en el tiempo</h1>
        <p className="welcome-lead">
          Este proyecto es un visor interactivo de la historia argentina: períodos
          como franjas en una línea temporal y eventos puntuales enlazados al
          eje. Podés explorar por toque o teclado, ampliar el eje y leer el
          detalle de cada período o evento.
        </p>
        <p className="welcome-note">
          Pensado para usarse en escritorio y en tablet: el visor ocupa toda la
          pantalla y adapta el espacio cuando elegís un elemento.
        </p>
        <p className="welcome-instagram">
          <a
            href={SITE_INSTAGRAM_URL}
            className="welcome-instagram-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram: @hisctorictimelines
          </a>
        </p>

        {timelines === null ? (
          <p className="welcome-timelines-loading">Cargando líneas de tiempo…</p>
        ) : timelines.length === 0 ? (
          <p className="welcome-timelines-empty">No hay líneas de tiempo disponibles.</p>
        ) : (
          <ul className="welcome-timeline-list">
            {timelines.map((item) => (
              <li key={item.id} className="welcome-timeline-card">
                <div className="welcome-timeline-card-body">
                  <span className="welcome-timeline-card-title">{item.title}</span>
                  {item.description && (
                    <span className="welcome-timeline-card-desc">{item.description}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="welcome-timeline-card-btn"
                  onClick={() => onSelectTimeline(item.id)}
                >
                  Ver
                </button>
              </li>
            ))}
          </ul>
        )}

        {timelines !== null && (
          <div className="welcome-create-section">
            {showForm ? (
              <form className="welcome-create-form" onSubmit={handleCreate}>
                <input
                  type="text"
                  className="welcome-create-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Título de la línea de tiempo"
                  autoFocus
                  disabled={createPending}
                />
                {createError && <p className="welcome-create-error">{createError}</p>}
                <div className="welcome-create-actions">
                  <button
                    type="submit"
                    className="welcome-timeline-card-btn"
                    disabled={createPending || !newTitle.trim()}
                  >
                    {createPending ? "Creando…" : "Crear"}
                  </button>
                  <button
                    type="button"
                    className="welcome-create-cancel"
                    onClick={handleCancel}
                    disabled={createPending}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="welcome-cta--add"
                onClick={() => setShowForm(true)}
              >
                + Nueva línea de tiempo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
