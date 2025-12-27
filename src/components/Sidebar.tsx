import { useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";

const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Romanegro";

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = useMemo(() => [
        { label: "Dashboard", icon: "pi pi-home", path: "/dashboard" },
        {
            label: "Spese",
            icon: "pi pi-wallet",
            children: [
                { label: "Per Categoria", path: "/expenses/categories" },
            ]
        }
    ], []);

    return (
        <aside className="app-sidebar">
            <div className="app-sidebar__header" onClick={() => navigate("/dashboard")}>
                <div className="app-avatar">
                    <i className="pi pi-bolt" />
                </div>
                <div>
                    <div className="app-name">{APP_NAME}</div>
                    <small className="text-color-secondary">Gestionale familiare</small>
                </div>
            </div>
            <nav className="app-sidebar__nav">
                {menuItems.map((item) => (
                    <div key={item.label} className="app-sidebar__section">
                        <NavLink to={item.path ?? "#"} className={({ isActive }) => "app-nav-item" + (isActive ? " active" : "")}>
                            <i className={item.icon} />
                            <span>{item.label}</span>
                        </NavLink>
                        {item.children && (
                            <div className="app-nav-children">
                                {item.children.map((child) => (
                                    <NavLink
                                        key={child.path}
                                        to={child.path}
                                        className={({ isActive }) =>
                                            "app-nav-subitem" + (isActive || location.pathname === child.path ? " active" : "")
                                        }
                                    >
                                        <span>{child.label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>
            <div className="app-sidebar__footer">
                <Button text label="Logout" icon="pi pi-sign-out" className="w-full" onClick={() => navigate("/login")} />
            </div>
        </aside>
    );
}
