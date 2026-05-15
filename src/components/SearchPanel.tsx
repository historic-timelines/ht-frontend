import { useEffect, useState } from "react";
import "./SearchPanel.css";

export const SearchPanel = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "f") {
                e.preventDefault();
                setVisible(v => !v);
                return;
            }
            if (e.key === "Escape" && visible) {
                e.preventDefault();
                setVisible(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [visible]);

    if (!visible) {
        return null;
    }

    return (
        <div className="root">
            <input type="text" autoFocus placeholder="Buscar periodo o evento..." className=" --border input" />
        </div>
    );
};