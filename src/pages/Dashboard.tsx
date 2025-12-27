import "./Dashboard.css";
import { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { ProgressBar } from "primereact/progressbar";
import { Divider } from "primereact/divider";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { useAuth } from "../context/AuthContext";

interface FinanceCard {
    title: string;
    value: string;
    detail: string;
    progress: number;
    icon: string;
}

interface TaskItem {
    title: string;
    due: string;
    status: "success" | "warning" | "danger";
}

interface DashboardSummary {
    account: {
        id: number;
        username: string;
        displayName?: string;
        monthlyBudget: number;
        annualSavingsGoal: number;
    };
    metrics: {
        balance: number;
        weeklySpend: number;
        monthlySpend: number;
        monthlyBudgetUsedPercent: number;
        annualSavings: number;
        annualGoal: number;
    };
    lines: {
        appAccountLineId: number;
        lineName: string;
        balance: number;
    }[];
    latestMovements: {
        id: number;
        movementDate: string;
        amount: number;
        isNegative: boolean;
        isTransfer: boolean;
        note?: string;
        lineName: string;
    }[];
}

interface CategoryDto {
    id: number;
    name: string;
    kind: string;
    subCategories: {
        id: number;
        name: string;
        description?: string;
    }[];
}

export default function Dashboard() {
    const { user, token, logout } = useAuth();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5044";

    useEffect(() => {
        reloadSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBaseUrl, token]);

    useEffect(() => {
        loadCategories();
    }, [apiBaseUrl]);

    const formatCurrency = (value: number) =>
        value.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

    const financeSummary: FinanceCard[] = useMemo(() => {
        if (!summary) {
            return [
                { title: "Budget mensile", value: "—", detail: "Caricamento...", progress: 0, icon: "pi-wallet" },
                { title: "Spese settimana", value: "—", detail: "Caricamento...", progress: 0, icon: "pi-chart-pie" },
                { title: "Risparmi annuali", value: "—", detail: "Caricamento...", progress: 0, icon: "pi-bullseye" },
            ];
        }

        const budgetPercent = Math.min(100, summary.metrics.monthlyBudgetUsedPercent ?? 0);
        const savingsProgress = summary.account.annualSavingsGoal > 0
            ? Math.min(100, Math.max(0, (summary.metrics.annualSavings / summary.account.annualSavingsGoal) * 100))
            : 0;

        return [
            {
                title: "Budget mensile",
                value: formatCurrency(summary.account.monthlyBudget),
                detail: `${budgetPercent.toFixed(0)}% già allocato`,
                progress: budgetPercent,
                icon: "pi-wallet"
            },
            {
                title: "Spese settimana",
                value: formatCurrency(summary.metrics.weeklySpend),
                detail: `${summary.metrics.monthlySpend.toFixed(0)}€ spesi questo mese`,
                progress: Math.min(100, (summary.metrics.weeklySpend / Math.max(1, summary.account.monthlyBudget)) * 100),
                icon: "pi-chart-pie"
            },
            {
                title: "Risparmi annuali",
                value: formatCurrency(summary.metrics.annualSavings),
                detail: `Obiettivo ${formatCurrency(summary.account.annualSavingsGoal)}`,
                progress: savingsProgress,
                icon: "pi-bullseye"
            }
        ];
    }, [summary]);

    const tasks: TaskItem[] = [
        { title: "Paga bolletta luce", due: "Domani", status: "warning" },
        { title: "Spesa settimanale", due: "Sabato", status: "success" },
        { title: "Rinnovo assicurazione auto", due: "Tra 10 giorni", status: "danger" },
    ];

    const reminders = [
        { title: "Invita nonna a cena", when: "Venerdì sera" },
        { title: "Controlla saldo carta", when: "Oggi" },
        { title: "Rivedi budget vacanze", when: "Fine mese" },
    ];

    const [dialogOpen, setDialogOpen] = useState(false);
    const [formAmount, setFormAmount] = useState<number | null>(null);
    const [formType, setFormType] = useState<"income" | "expense" | "transfer">("expense");
    const [formDate, setFormDate] = useState<Date | null>(new Date());
    const [formLineId, setFormLineId] = useState<number | null>(null);
    const [formFromLineId, setFormFromLineId] = useState<number | null>(null);
    const [formToLineId, setFormToLineId] = useState<number | null>(null);
    const [formNote, setFormNote] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null);

    const submitNewMovement = async () => {
        if (!token) {
            setError("Token mancante, effettua di nuovo il login.");
            return;
        }
        const isTransfer = formType === "transfer";
        const hasMinFields = !!formAmount && !!formDate && (isTransfer ? formFromLineId && formToLineId : formLineId);
        if (!hasMinFields) {
            setError("Compila importo, data e conto.");
            return;
        }
        if (isTransfer && formFromLineId === formToLineId) {
            setError("I conti di origine e destinazione devono essere diversi.");
            return;
        }
        if (!isTransfer && (!selectedCategoryId || !selectedSubCategoryId)) {
            setError("Seleziona categoria e sottocategoria.");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                amount: Math.abs(formAmount ?? 0),
                isNegative: formType === "expense",
                isTransfer,
                movementDate: formDate!.toISOString().split("T")[0],
                appAccountLineId: isTransfer ? formFromLineId : formLineId,
                targetAppAccountLineId: isTransfer ? formToLineId : null,
                subCategoryId: !isTransfer ? selectedSubCategoryId : null,
                note: formNote || null
            };

            const res = await fetch(`${apiBaseUrl}/api/dashboard/movements`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Errore nel salvataggio");

            await reloadSummary();
            setDialogOpen(false);
            setFormAmount(null);
            setFormNote("");
            setFormLineId(null);
            setFormFromLineId(null);
            setFormToLineId(null);
            setSelectedCategoryId(null);
            setSelectedSubCategoryId(null);
        } catch (e) {
            console.error(e);
            setError("Errore nel salvataggio del movimento");
        } finally {
            setSaving(false);
        }
    };

    const reloadSummary = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await fetch(`${apiBaseUrl}/api/dashboard/summary`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) {
                throw new Error("Impossibile caricare i dati di dashboard");
            }
            const data: DashboardSummary = await res.json();
            setSummary(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Errore nel recupero dei dati della dashboard");
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/catalog/categories`);
            if (!res.ok) throw new Error("Errore caricamento categorie");
            const data: CategoryDto[] = await res.json();
            setCategories(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="dashboard surface-ground min-h-screen">
            <div className="dashboard__shell fade-in-up">
                <header className="dashboard__header shadow-7 border-round-3xl">
                    <div className="flex align-items-center gap-3">
                        <div className="dashboard__avatar border-circle shadow-2">
                            <i className="pi pi-user" />
                        </div>
                        <div>
                            <p className="m-0 text-sm text-color-secondary">Bentornato</p>
                            <h2 className="m-0 text-2xl font-semibold">Ciao {user?.username ?? "ospite"}!</h2>
                            {error && <small className="text-red-400"> {error} </small>}
                        </div>
                    </div>
                    <div className="flex align-items-center gap-2">
                        <Button label="Nuova spesa" icon="pi pi-plus" severity="warning" onClick={() => {
                            setDialogOpen(true);
                            setFormType("expense");
                            setSelectedCategoryId(null);
                            setSelectedSubCategoryId(null);
                        }} />
                        <Button label="Logout" icon="pi pi-sign-out" outlined onClick={logout} />
                    </div>
                </header>

                <section className="dashboard__hero shadow-7 border-round-3xl">
                    <div>
                        <p className="m-0 text-sm text-color-secondary">Snapshot familiare</p>
                        <h3 className="m-0 text-3xl font-semibold">Tieni tutto sotto controllo</h3>
                        <p className="m-0 text-sm mt-2 text-color-secondary">Budget, scadenze e appunti in un colpo d&apos;occhio.</p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                            <Button label="Aggiungi voce" icon="pi pi-plus-circle" rounded />
                            <Button label="Vedi report" icon="pi pi-chart-line" rounded outlined />
                        </div>
                    </div>
                    <div className="dashboard__hero-pill">
                        <span className="text-sm text-color-secondary">Saldo attuale</span>
                        <h4 className="m-0 text-2xl font-semibold">
                            {summary ? formatCurrency(summary.metrics.balance) : (loading ? "Caricamento..." : "—")}
                        </h4>
                        {summary && (
                            <Tag value={`${summary.metrics.weeklySpend.toFixed(0)}€ spesi questa settimana`} severity="warning" />
                        )}
                    </div>
                </section>

                <section className="grid dashboard__stats">
                    {financeSummary.map((item) => (
                        <div key={item.title} className="col-12 md:col-4">
                            <Card className="dashboard__card shadow-7 border-round-2xl">
                                <div className="flex align-items-center justify-content-between mb-3">
                                    <div>
                                        <p className="m-0 text-sm text-color-secondary">{item.title}</p>
                                        <h4 className="m-0 text-2xl font-semibold">{item.value}</h4>
                                    </div>
                                    <span className="dashboard__icon surface-100 border-circle">
                                        <i className={`pi ${item.icon}`} />
                                    </span>
                                </div>
                                <p className="m-0 text-xs text-color-secondary">{item.detail}</p>
                                <ProgressBar value={item.progress} showValue={false} />
                            </Card>
                        </div>
                    ))}
                </section>

                <section className="grid dashboard__panels">
                    <div className="col-12 lg:col-7">
                        <Card title="Attività da fare" className="shadow-7 border-round-2xl">
                            <div className="flex flex-column gap-3">
                                {tasks.map((task) => (
                                    <div key={task.title} className="dashboard__task border-round p-3 flex align-items-center justify-content-between">
                                        <div>
                                            <p className="m-0 text-sm">{task.title}</p>
                                            <span className="text-xs text-color-secondary">{task.due}</span>
                                        </div>
                                        <Tag value={task.status === "success" ? "OK" : task.status === "warning" ? "Presto" : "Urgente"} severity={task.status} />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                    <div className="col-12 lg:col-5">
                        <Card title="Promemoria rapidi" className="shadow-7 border-round-2xl">
                            <ul className="dashboard__reminders">
                                {reminders.map((reminder) => (
                                    <li key={reminder.title} className="flex align-items-center justify-content-between">
                                        <span>{reminder.title}</span>
                                        <Tag value={reminder.when} severity="info" />
                                    </li>
                                ))}
                            </ul>
                            <Divider />
                            <div className="flex gap-2 flex-wrap">
                                <Button label="Nuovo promemoria" icon="pi pi-bell" size="small" />
                                <Button label="Mostra tutto" icon="pi pi-angle-right" size="small" outlined />
                            </div>
                        </Card>
                    </div>
                </section>

                <Dialog header="Nuovo movimento" visible={dialogOpen} onHide={() => setDialogOpen(false)} style={{ width: "32rem" }}>
                    <div className="flex flex-column gap-3">
                        <div className="field">
                            <label className="block text-sm mb-2">Importo</label>
                            <InputNumber
                                value={formAmount}
                                onValueChange={(e) => setFormAmount(e.value ?? null)}
                                mode="currency"
                                currency="EUR"
                                locale="it-IT"
                                className="w-full"
                            />
                        </div>
                        <div className="field">
                            <label className="block text-sm mb-2">Tipologia</label>
                            <Dropdown
                                value={formType}
                                onChange={(e) => {
                                    const val = e.value as "income" | "expense" | "transfer";
                                    setFormType(val);
                                }}
                                options={[
                                    { label: "Entrata", value: "income" },
                                    { label: "Spesa", value: "expense" },
                                    { label: "Giroconto", value: "transfer", disabled: (summary?.lines?.length ?? 0) < 2 }
                                ]}
                                className="w-full"
                            />
                        </div>
                        <div className="field">
                            <label className="block text-sm mb-2">Data movimento</label>
                            <Calendar
                                value={formDate}
                                onChange={(e) => setFormDate(e.value as Date | null)}
                                dateFormat="dd/mm/yy"
                                className="w-full"
                            />
                        </div>
                        {formType === "transfer" ? (
                            <>
                                <div className="field">
                                    <label className="block text-sm mb-2">Da conto</label>
                                    <Dropdown
                                        value={formFromLineId}
                                        onChange={(e) => setFormFromLineId(e.value)}
                                        options={(summary?.lines || []).map((l) => ({ label: l.lineName, value: l.appAccountLineId }))}
                                        placeholder="Seleziona conto di origine"
                                        className="w-full"
                                    />
                                </div>
                                <div className="field">
                                    <label className="block text-sm mb-2">A conto</label>
                                    <Dropdown
                                        value={formToLineId}
                                        onChange={(e) => setFormToLineId(e.value)}
                                        options={(summary?.lines || []).map((l) => ({ label: l.lineName, value: l.appAccountLineId }))}
                                        placeholder="Seleziona conto di destinazione"
                                        className="w-full"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="field">
                                <label className="block text-sm mb-2">Conto</label>
                                <Dropdown
                                    value={formLineId}
                                    onChange={(e) => setFormLineId(e.value)}
                                    options={(summary?.lines || []).map((l) => ({ label: l.lineName, value: l.appAccountLineId }))}
                                    placeholder="Seleziona conto"
                                    className="w-full"
                                />
                            </div>
                        )}
                        {formType !== "transfer" && (
                            <>
                                <div className="field">
                                    <label className="block text-sm mb-2">Categoria</label>
                                    <Dropdown
                                        value={selectedCategoryId}
                                        onChange={(e) => {
                                            setSelectedCategoryId(e.value);
                                            setSelectedSubCategoryId(null);
                                        }}
                                        options={categories.map((c) => ({ label: c.name, value: c.id }))}
                                        placeholder="Seleziona categoria"
                                        className="w-full"
                                    />
                                </div>
                                <div className="field">
                                    <label className="block text-sm mb-2">Sottocategoria</label>
                                    <Dropdown
                                        value={selectedSubCategoryId}
                                        onChange={(e) => setSelectedSubCategoryId(e.value)}
                                        options={(categories.find((c) => c.id === selectedCategoryId)?.subCategories || []).map((sc) => ({ label: sc.name, value: sc.id }))}
                                        placeholder="Seleziona sottocategoria"
                                        className="w-full"
                                        disabled={!selectedCategoryId}
                                    />
                                </div>
                            </>
                        )}
                        <div className="field">
                            <label className="block text-sm mb-2">Note</label>
                            <InputTextarea value={formNote} onChange={(e) => setFormNote(e.target.value)} rows={3} className="w-full" />
                        </div>
                        <div className="flex justify-content-end gap-2 mt-2">
                            <Button label="Annulla" text onClick={() => setDialogOpen(false)} />
                            <Button label="Salva" icon="pi pi-check" onClick={submitNewMovement} loading={saving} />
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    );
}
