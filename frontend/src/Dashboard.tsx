import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  PieChart as PieChartIcon,
  Target,
  Bot,
  Settings,
  LogOut,
  PlusCircle,
  PiggyBank,
  AlertTriangle,
  Download,
  User,
  Bell,
  ShieldCheck,
  Trash2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const API_URL = "https://gsf-financas.onrender.com";
const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#6366F1", "#8B5CF6", "#EC4899"];

export default function Dashboard() {

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const [token, setToken] = useState<string | null>(localStorage.getItem("@GSF:token"));
  const [activeTab, setActiveTab] = useState("dashboard");

  // Auth State
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // User Profile
  const [user, setUser] = useState<{ name?: string; email?: string }>({});

  // Data States
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");

  // Form States - Transações
  const [tDesc, setTDesc] = useState("");
  const [tAmount, setTAmount] = useState("");
  const [tType, setTType] = useState("outcome");
  const [tCategory, setTCategory] = useState("Alimentação");

  // Form States - Orçamentos
  const [bCategory, setBCategory] = useState("Alimentação");
  const [bLimit, setBLimit] = useState("");

  // Form States - Metas
  const [gTitle, setGTitle] = useState("");
  const [gTarget, setGTarget] = useState("");
  const [depositAmounts, setDepositAmounts] = useState<{ [key: string]: string }>({});

  // Form States - Investimentos
  const [invTitle, setInvTitle] = useState("");
  const [invCategory, setInvCategory] = useState("Renda Fixa");
  const [invAmount, setInvAmount] = useState("");

  // CARREGAR TODOS OS DADOS DA API
  const fetchAllData = async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [resT, resG, resB, resI] = await Promise.all([
        fetch(`${API_URL}/transactions`, { headers }),
        fetch(`${API_URL}/goals`, { headers }),
        fetch(`${API_URL}/budgets`, { headers }),
        fetch(`${API_URL}/investments`, { headers })
      ]);

      if (resT.ok) setTransactions(await resT.json());
      if (resG.ok) setGoals(await resG.json());
      if (resB.ok) setBudgets(await resB.json());
      if (resI.ok) setInvestments(await resI.json());
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
  };

  const fetchAiInsight = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/ai/insights`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data.insight);
      }
    } catch (err) {
      console.error("Erro na IA:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "ai") {
      fetchAiInsight();
    }
  }, [activeTab]);

  // LOGIN / CADASTRO
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? "/login" : "/register";
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        if (data.user) setUser(data.user);
      } else {
        alert(data.error || "Erro de autenticação");
      }
    } catch (err) {
      alert("Servidor indisponível. Verifique o backend!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  // TRANSAÇÕES
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tDesc || !tAmount) return;

    const res = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        description: tDesc,
        amount: parseFloat(tAmount),
        type: tType,
        category: tCategory
      })
    });

    if (res.ok) {
      setTDesc("");
      setTAmount("");
      fetchAllData();
    }
  };

  // ORÇAMENTOS
 const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bLimit) return;

    const res = await fetch(`${API_URL}/budgets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        category: bCategory,
        limit: parseFloat(bLimit)
      })
    });

    if (res.ok) {
      setBLimit("");
      fetchAllData();
    }
  };

  // Excluir Orçamento
  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Deseja realmente apagar este orçamento?")) return;

    try {
      const res = await fetch(`${API_URL}/budgets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setBudgets((prev) => prev.filter((b) => (b.id || b._id) !== id));
      }
    } catch (err) {
      console.error("Erro ao deletar orçamento:", err);
    }
  };

  // METAS
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gTitle || !gTarget) return;

    const res = await fetch(`${API_URL}/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: gTitle,
        targetAmount: parseFloat(gTarget)
      })
    });

    if (res.ok) {
      setGTitle("");
      setGTarget("");
      fetchAllData();
    }
  };

  const handleDepositGoal = async (goalId: string) => {
    const val = depositAmounts[goalId];
    if (!val || parseFloat(val) <= 0) return;

    const res = await fetch(`${API_URL}/goals/${goalId}/deposit`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount: parseFloat(val) })
    });

    if (res.ok) {
      setDepositAmounts({ ...depositAmounts, [goalId]: "" });
      fetchAllData();
    }
  };

  // Excluir Meta
  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Deseja realmente apagar esta meta?")) return;

    try {
      const res = await fetch(`${API_URL}/goals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        // Remove da lista local na hora sem depender só do fetchAllData
        setGoals((prev) => prev.filter((g) => (g.id || g._id) !== id));
      }
    } catch (err) {
      console.error("Erro ao deletar meta:", err);
    }
  };

  // INVESTIMENTOS
  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invTitle || !invAmount) return;

    const res = await fetch(`${API_URL}/investments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: invTitle,
        category: invCategory,
        amountInvested: parseFloat(invAmount),
        currentValue: parseFloat(invAmount)
      })
    });

    if (res.ok) {
      setInvTitle("");
      setInvAmount("");
      fetchAllData();
    }
  };

  // Excluir Investimento
  const handleDeleteInvestment = async (id: string) => {
    if (!confirm("Deseja realmente apagar este investimento?")) return;

    try {
      const res = await fetch(`${API_URL}/investments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        // Remove da lista local na hora
        setInvestments((prev) => prev.filter((i) => (i.id || i._id) !== id));
      }
    } catch (err) {
      console.error("Erro ao deletar investimento:", err);
    }
  };

  // EXPORTAR BACKUP
  const handleExportData = () => {
    const data = { transactions, goals, budgets, investments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-financeiro-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  // CÁLCULOS KPI
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "outcome")
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const totalInvested = investments.reduce((acc, i) => acc + i.currentValue, 0);

  // DADOS DOS GRÁFICOS
  const summaryChartData = [
    { name: "Entradas", valor: totalIncome },
    { name: "Saídas", valor: totalExpense }
  ];

  const categoriesMap: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === "outcome")
    .forEach((t) => {
      categoriesMap[t.category] = (categoriesMap[t.category] || 0) + t.amount;
    });

  const categoryChartData = Object.keys(categoriesMap).map((cat) => ({
    name: cat,
    value: categoriesMap[cat]
  }));

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/user/change-password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
    });

    const data = await res.json();
    if (res.ok) {
      alert("Senha alterada com sucesso!");
      setCurrentPass("");
      setNewPass("");
    } else {
      alert(data.error || "Erro ao alterar a senha.");
    }
  };

  function renderFormattedText(text: string) {
    return text.split("\n\n").map((paragraph, i) => (
      <p key={i} className="text-slate-200 leading-relaxed text-lg mb-3 last:mb-0">
        {paragraph.split(/(\*\*.*?\*\*)/g).map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="text-emerald-400 font-semibold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            part
          )
        )}
      </p>
    ));
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Wallet className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-wider">SISTEMA GSF</h1>
          </div>

          <h2 className="text-xl font-semibold mb-4 text-center">
            {isLogin ? "Acessar Conta" : "Criar Nova Conta"}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white outline-none focus:border-emerald-400"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-1">E-mail</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white outline-none focus:border-emerald-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 transition text-slate-900 font-bold py-2 rounded mt-2"
            >
              {isLogin ? "Entrar" : "Cadastrar"}
            </button>
          </form>

          <p
            onClick={() => setIsLogin(!isLogin)}
            className="text-center text-sm text-emerald-400 mt-4 cursor-pointer hover:underline"
          >
            {isLogin ? "Não tem uma conta? Cadastre-se" : "Já possui conta? Faça Login"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-8 px-2">
            <Wallet className="w-8 h-8 text-emerald-400" />
            <span className="font-bold text-xl text-emerald-400">GSF Finance</span>
          </div>

          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "Painel Geral", icon: PieChartIcon },
              { id: "transactions", label: "Transações", icon: TrendingUp },
              { id: "budgets", label: "Orçamentos", icon: AlertTriangle },
              { id: "goals", label: "Metas de Economia", icon: Target },
              { id: "investments", label: "Investimentos", icon: PiggyBank },
              { id: "ai", label: "IA Financeira", icon: Bot },
              { id: "settings", label: "Configurações", icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    activeTab === item.id
                      ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-rose-400 hover:text-rose-300 w-full px-3 py-2 rounded text-sm transition"
          >
            <LogOut className="w-5 h-5" />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* ABA: PAINEL GERAL (COM GRÁFICOS) */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Painel Geral</h2>

            {/* CARDS KPI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <span className="text-slate-400 text-sm">Entradas Totais</span>
                <p className="text-2xl font-bold text-emerald-400 mt-2">
                  R$ {totalIncome.toFixed(2)}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <span className="text-slate-400 text-sm">Saídas Totais</span>
                <p className="text-2xl font-bold text-rose-400 mt-2">
                  R$ {totalExpense.toFixed(2)}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <span className="text-slate-400 text-sm">Saldo Atual</span>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    balance >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  R$ {balance.toFixed(2)}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <span className="text-slate-400 text-sm">Total Investido</span>
                <p className="text-2xl font-bold text-indigo-400 mt-2">
                  R$ {totalInvested.toFixed(2)}
                </p>
              </div>
            </div>

            {/* SEÇÃO DE GRÁFICOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <h3 className="font-semibold text-lg mb-4 text-emerald-400">
                  Entradas vs Saídas
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryChartData}>
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155"
                        }}
                      />
                      <Bar dataKey="valor" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <h3 className="font-semibold text-lg mb-4 text-emerald-400">
                  Gastos por Categoria
                </h3>
                <div className="h-64 w-full">
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {categoryChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155"
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      Nenhuma saída registrada para gerar gráfico.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: TRANSAÇÕES */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Transações / Livro Caixa</h2>

            <form
              onSubmit={handleAddTransaction}
              className="bg-slate-900 border border-slate-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-3"
            >
              <input
                type="text"
                placeholder="Descrição"
                value={tDesc}
                onChange={(e) => setTDesc(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded p-2 text-white"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Valor (R$)"
                value={tAmount}
                onChange={(e) => setTAmount(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded p-2 text-white"
                required
              />
              <select
                value={tType}
                onChange={(e) => setTType(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded p-2 text-white"
              >
                <option value="income">Entrada (+)</option>
                <option value="outcome">Saída (-)</option>
              </select>
              <select
                value={tCategory}
                onChange={(e) => setTCategory(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded p-2 text-white"
              >
                <option value="Alimentação">Alimentação</option>
                <option value="Moradia">Moradia</option>
                <option value="Transporte">Transporte</option>
                <option value="Lazer">Lazer</option>
                <option value="Geral">Geral</option>
              </select>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded p-2 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5" /> Adicionar
              </button>
            </form>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-800 text-slate-400 text-sm">
                  <tr>
                    <th className="p-4">Descrição</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/50">
                      <td className="p-4">{t.description}</td>
                      <td className="p-4 text-slate-400">{t.category}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            t.type === "income"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {t.type === "income" ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td
                        className={`p-4 font-semibold ${
                          t.type === "income" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        R$ {t.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA: ORÇAMENTOS */}
        {activeTab === "budgets" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Teto de Gastos (Orçamentos)</h2>

            <form
              onSubmit={handleAddBudget}
              className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex gap-3"
            >
              <select
                value={bCategory}
                onChange={(e) => setBCategory(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded p-2 text-white flex-1"
              >
                <option value="Alimentação">Alimentação</option>
                <option value="Moradia">Moradia</option>
                <option value="Transporte">Transporte</option>
                <option value="Lazer">Lazer</option>
                <option value="Geral">Geral</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Limite Máximo R$"
                value={bLimit}
                onChange={(e) => setBLimit(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded p-2 text-white flex-1"
                required
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold px-6 py-2 rounded"
              >
                Definir Limite
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map((b) => {
                const spent = transactions
                  .filter((t) => t.type === "outcome" && t.category === b.category)
                  .reduce((acc, t) => acc + t.amount, 0);

                const percent = Math.min(100, Math.round((spent / b.limit) * 100));
                const isOver = spent > b.limit;

                return (
                  <div
                    key={b.id}
                    className={`bg-slate-900 border p-5 rounded-xl ${
                      isOver ? "border-rose-500/50" : "border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                     <span className="font-bold text-lg">{b.category}</span>
                     <div className="flex items-center gap-2">
                      {isOver && (
                        <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Limite Ultrapassado!
                          </span>
                        )}
                        <button
                            onClick={() => handleDeleteBudget(b.id)}
                            className="text-slate-500 hover:text-red-400 transition"
                            title="Excluir orçamento"
                           >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Gasto: R$ {spent.toFixed(2)} / Limite: R$ {b.limit.toFixed(2)}
                    </p>

                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isOver ? "bg-rose-500" : "bg-emerald-400"
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA: METAS DE ECONOMIA */}
        {activeTab === "goals" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Metas de Economia</h2>

            <form
              onSubmit={handleAddGoal}
              className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex gap-3"
            >
              <input
                type="text"
                placeholder="Título da Meta (ex: Reserva de Emergência)"
                value={gTitle}
                onChange={(e) => setGTitle(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded p-2 text-white flex-1"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Valor Alvo (R$)"
                value={gTarget}
                onChange={(e) => setGTarget(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded p-2 text-white flex-1"
                required
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold px-6 py-2 rounded"
              >
                Nova Meta
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((g) => {
                const percent = Math.min(
                  100,
                  Math.round((g.currentAmount / g.targetAmount) * 100)
                );

                return (
                  <div key={g.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-lg">{g.title}</h3>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="text-slate-500 hover:text-red-400 transition"
                        title="Excluir meta"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <p className="text-sm text-slate-400 mb-3">
                      Acumulado: R$ {g.currentAmount.toFixed(2)} / Alvo: R${" "}
                      {g.targetAmount.toFixed(2)} ({percent}%)
                    </p>

                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-4">
                      <div
                        className="bg-amber-400 h-full transition-all"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Valor para guardar (R$)"
                        value={depositAmounts[g.id] || ""}
                        onChange={(e) =>
                          setDepositAmounts({
                            ...depositAmounts,
                            [g.id]: e.target.value
                          })
                        }
                        className="bg-slate-800 border border-slate-700 rounded p-1.5 text-sm text-white flex-1"
                      />
                      <button
                        onClick={() => handleDepositGoal(g.id)}
                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold text-xs px-4 py-1.5 rounded"
                      >
                        Depositar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA: INVESTIMENTOS */}
        {activeTab === "investments" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Carteira de Investimentos</h2>

            {/* Guia Educativo de Categorias */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-emerald-400 text-sm">💡 O que significa cada tipo de investimento?</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <li><strong className="text-white">Renda Fixa (CDB, Tesouro):</strong> Empréstimo do seu dinheiro ao governo ou banco em troca de juros previsíveis e baixo risco.</li>
                <li><strong className="text-white">Ações:</strong> Comprar pequenas "fatias" de empresas reais. Risco maior, mas pode render dividendos e valorização.</li>
                <li><strong className="text-white">FIIs (Fundos Imobiliários):</strong> Investir em imóveis (shoppings, galpões) sem comprar um imóvel inteiro, recebendo "aluguéis" mensais.</li>
                <li><strong className="text-white">Criptomoedas:</strong> Ativos digitais descentralizados (ex: Bitcoin). Alta volatilidade e alto risco.</li>
              </ul>
            </div>

            <form
              onSubmit={handleAddInvestment}
              className="bg-slate-900 border border-slate-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3"
            >
              <input
                type="text"
                placeholder="Ativo (ex: Tesouro Selic, PETR4)"
                value={invTitle}
                onChange={(e) => setInvTitle(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded p-2 text-white"
                required
              />
              <select
                value={invCategory}
                onChange={(e) => setInvCategory(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded p-2 text-white"
              >
                <option value="Renda Fixa">Renda Fixa</option>
                <option value="Ações">Ações</option>
                <option value="FIIs">FIIs (Imobiliários)</option>
                <option value="Cripto">Criptomoedas</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Valor Aportado (R$)"
                value={invAmount}
                onChange={(e) => setInvAmount(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded p-2 text-white"
                required
              />
              <button
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded p-2"
              >
                Registrar Aporte
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {investments.map((inv) => {
                const id = inv.id || inv._id;
                return (
                  <div key={id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded font-semibold">
                        {inv.category}
                      </span>
                      <button
                        onClick={() => handleDeleteInvestment(id)}
                        className="text-slate-500 hover:text-red-400 transition"
                        title="Excluir investimento"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <h3 className="font-bold text-lg mt-2">{inv.title}</h3>
                    <p className="text-2xl font-bold text-slate-100 mt-2">
                      R$ {inv.currentValue?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA: IA FINANCEIRA */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="w-7 h-7 text-emerald-400" /> Diagnóstico e Recomendações
            </h2>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <div>
                {renderFormattedText(aiInsight || "Buscando dados para gerar o relatório...")}
                </div>

              <button
                onClick={fetchAiInsight}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded text-sm transition"
              >
                Gerar Nova Análise
              </button>
            </div>
          </div>
        )}

        {/* ABA: CONFIGURAÇÕES COMPLETAS */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-4xl">
            <h2 className="text-2xl font-bold">Configurações do Sistema</h2>

            {/* Alterar Senha */}
            <form onSubmit={handleChangePassword} className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <h3 className="text-lg font-semibold text-emerald-400">Alterar Senha de Acesso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Senha Atual</label>
                  <input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded text-sm transition"
              >
                Atualizar Senha
              </button>
            </form>

            {/* Perfil do Usuário */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <User className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-semibold">Perfil do Usuário</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nome</label>
                  <input
                    type="text"
                    disabled
                    value={user.name || "Usuário do Sistema"}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-300 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">E-mail</label>
                  <input
                    type="text"
                    disabled
                    value={user.email || "email@registrado.com"}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-300 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Preferências e Notificações */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <Bell className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-semibold">Preferências do Sistema</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-0"
                  />
                  <span>Alertar quando ultrapassar teto de orçamento</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-0"
                  />
                  <span>Exibir sugestões automatizadas da IA no Painel</span>
                </label>
              </div>
            </div>

            {/* Backup e Exportação */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-semibold">Segurança & Backup</h3>
              </div>
              <p className="text-slate-400 text-sm">
                Baixe o relatório completo de dados salvos para manter um backup seguro do seu banco de dados.
              </p>
              <button
                onClick={handleExportData}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold px-4 py-2 rounded flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-emerald-400" /> Exportar Dados (.json)
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}