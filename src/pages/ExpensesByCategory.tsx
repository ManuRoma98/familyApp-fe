import { useEffect, useMemo, useState } from "react";
import { Card } from "primereact/card";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import "./Dashboard.css";
import { useAuth } from "../context/AuthContext";

interface CategorySummaryItem {
    categoryId: number | null;
    categoryName: string;
    total: number;
    percent: number;
}

interface CategorySummaryResponse {
    total: number;
    items: CategorySummaryItem[];
}

interface CategoryDetailResponse {
    category: { id: number; name: string; kind: string };
    subTotals: { subCategoryId: number; subCategoryName: string; total: number }[];
    movements: {
        id: number;
        movementDate: string;
        amount: number;
        subCategoryId?: number;
        subCategoryName?: string;
        lineName: string;
        note?: string;
    }[];
    trend: {
        currentMonth: { day: number; total: number }[];
        previousMonth: { day: number; total: number }[];
    };
}

export default function ExpensesByCategory() {
    const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5044";
    const { token } = useAuth();
    const [summary, setSummary] = useState<CategorySummaryResponse | null>(null);
    const [detail, setDetail] = useState<CategoryDetailResponse | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    useEffect(() => {
        loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate]);

    useEffect(() => {
        if (selectedCategoryId != null) {
            loadDetail(selectedCategoryId);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategoryId, startDate, endDate]);

    const queryParams = () => {
        const params = new URLSearchParams();
        if (startDate) params.append("start", startDate.toISOString().split("T")[0]);
        if (endDate) params.append("end", endDate.toISOString().split("T")[0]);
        const qs = params.toString();
        return qs ? `?${qs}` : "";
    };

    const loadSummary = async () => {
        if (!token) return;
        const res = await fetch(`${apiBaseUrl}/api/analytics/expenses/by-category${queryParams()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data: CategorySummaryResponse = await res.json();
        setSummary(data);
        if (!selectedCategoryId) {
            const firstCat = data.items.find((i) => i.categoryId !== null);
            if (firstCat?.categoryId) setSelectedCategoryId(firstCat.categoryId);
        }
    };

    const loadDetail = async (categoryId: number) => {
        if (!token) return;
        const res = await fetch(`${apiBaseUrl}/api/analytics/category-detail/${categoryId}${queryParams()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data: CategoryDetailResponse = await res.json();
        setDetail(data);
    };

    const donutStyle = useMemo(() => {
        if (!summary || summary.items.length === 0) return { background: "conic-gradient(#3b82f6 0deg 360deg)" };
        const colors = ["#f59e0b", "#6366f1", "#10b981", "#ef4444", "#8b5cf6", "#14b8a6", "#eab308"];
        let acc = 0;
        const segments = summary.items.map((item, idx) => {
            const start = acc;
            acc += (item.percent / 100) * 360;
            return `${colors[idx % colors.length]} ${start}deg ${acc}deg`;
        });
        return { background: `conic-gradient(${segments.join(",")})` };
    }, [summary]);

    const trendPoints = (series: { day: number; total: number }[]) => {
        const max = Math.max(...series.map((p) => p.total), 1);
        return series.map((p) => ({
            day: p.day,
            value: p.total,
            height: `${(p.total / max) * 100}%`
        }));
    };

    const currentTrend = trendPoints(detail?.trend.currentMonth ?? []);
    const prevTrend = trendPoints(detail?.trend.previousMonth ?? []);

    return (
        <div className="fade-in-up">
            <header className="flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="m-0">Spese per categoria</h2>
                    <small className="text-color-secondary">Analizza dove vanno i soldi e come cambiano nel tempo.</small>
                </div>
                <div className="flex gap-3">
                    <Calendar value={startDate} onChange={(e) => setStartDate(e.value as Date | null)} placeholder="Da" dateFormat="dd/mm/yy" />
                    <Calendar value={endDate} onChange={(e) => setEndDate(e.value as Date | null)} placeholder="A" dateFormat="dd/mm/yy" />
                    <Button label="Pulisci filtri" text onClick={() => { setStartDate(null); setEndDate(null); }} />
                </div>
            </header>

            <div className="grid">
                <div className="col-12 md:col-5">
                    <Card className="shadow-7 border-round-2xl">
                        <div className="flex gap-3 align-items-center">
                            <div className="donut" style={donutStyle}>
                                <div className="donut__center">
                                    <span className="text-sm text-color-secondary">Totale</span>
                                    <strong>{summary ? `€ ${summary.total.toFixed(0)}` : "—"}</strong>
                                </div>
                            </div>
                            <div className="flex flex-column gap-2 w-full">
                                {(summary?.items ?? []).map((item) => (
                                    <Button
                                        key={item.categoryName}
                                        text
                                        className={`flex justify-content-between ${selectedCategoryId === item.categoryId ? "text-primary" : ""}`}
                                        onClick={() => item.categoryId != null && setSelectedCategoryId(item.categoryId)}
                                    >
                                        <span>{item.categoryName}</span>
                                        <span>{item.percent}% · €{item.total.toFixed(0)}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="col-12 md:col-7">
                    <Card className="shadow-7 border-round-2xl" title={detail?.category.name ?? "Dettaglio categoria"}>
                        <div className="flex flex-column gap-3">
                            <div className="grid">
                                {(detail?.subTotals ?? []).map((st) => (
                                    <div className="col-6" key={st.subCategoryId}>
                                        <div className="flex justify-content-between">
                                            <span>{st.subCategoryName}</span>
                                            <strong>€ {st.total.toFixed(0)}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h4 className="m-0 mb-2">Trend (mese corrente vs precedente)</h4>
                                <div className="trend-chart">
                                    <div className="trend-series">
                                        {currentTrend.map((p) => (
                                            <div key={`c-${p.day}`} className="trend-bar current" style={{ height: p.height }} />
                                        ))}
                                    </div>
                                    <div className="trend-series">
                                        {prevTrend.map((p) => (
                                            <div key={`p-${p.day}`} className="trend-bar prev" style={{ height: p.height }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <Card className="shadow-7 border-round-2xl mt-4" title="Movimenti">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Importo</th>
                                <th>Sottocategoria</th>
                                <th>Conto</th>
                                <th>Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(detail?.movements ?? []).map((m) => (
                                <tr key={m.id}>
                                    <td>{m.movementDate}</td>
                                    <td>-€ {m.amount.toFixed(2)}</td>
                                    <td>{m.subCategoryName ?? "-"}</td>
                                    <td>{m.lineName}</td>
                                    <td>{m.note ?? "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
