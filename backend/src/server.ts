import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "sua_chave_secreta_super_segura_gsf";

// 1. CONEXÃO E CRIAÇÃO DO BANCO DE DADOS
let db: any;

async function initDb() {
  db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database
  });

  // Tabela de Usuários
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    );
  `);

  // Tabela de Transações
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      description TEXT,
      amount REAL,
      type TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tabela de Orçamentos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      category TEXT,
      limit_amount REAL
    );
  `);

  // Tabela de Metas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      target_amount REAL,
      current_amount REAL DEFAULT 0
    );
  `);

  // Tabela de Investimentos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      category TEXT,
      amount_invested REAL,
      current_value REAL
    );
  `);

  console.log("-> Banco de dados SQLite pronto e tabelas verificadas.");
}

initDb();

// 2. MIDDLEWARE DE AUTENTICAÇÃO (JWT)
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
};

// --- ROTAS DE AUTENTICAÇÃO ---

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  }

  try {
    const userExists = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (userExists) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const id = Date.now().toString();

    await db.run(
      "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)",
      [id, name || "Usuário", email, hashedPassword]
    );

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token, user: { id, name, email } });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao registrar usuário." });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(400).json({ error: "Usuário não encontrado." });
    }

    const checkPass = await bcrypt.compare(password, user.password);
    if (!checkPass) {
      return res.status(400).json({ error: "Senha incorreta." });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro no login." });
  }
});

// --- ROTAS DE TRANSAÇÕES ---

app.get("/transactions", authMiddleware, async (req: any, res) => {
  const transactions = await db.all(
    "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC",
    [req.userId]
  );
  res.json(transactions);
});

app.post("/transactions", authMiddleware, async (req: any, res) => {
  const { description, amount, type, category } = req.body;
  const id = Date.now().toString();

  await db.run(
    "INSERT INTO transactions (id, user_id, description, amount, type, category) VALUES (?, ?, ?, ?, ?, ?)",
    [id, req.userId, description, amount, type, category]
  );

  res.status(201).json({ id, description, amount, type, category });
});

// --- ROTAS DE ORÇAMENTOS (TETO DE GASTOS) ---

app.get("/budgets", authMiddleware, async (req: any, res) => {
  const budgets = await db.all("SELECT * FROM budgets WHERE user_id = ?", [req.userId]);
  // Mapeando limit_amount do SQL para limit pro Frontend
  const formatted = budgets.map((b: any) => ({
    id: b.id,
    category: b.category,
    limit: b.limit_amount
  }));
  res.json(formatted);
});

app.post("/budgets", authMiddleware, async (req: any, res) => {
  const { category, limit } = req.body;
  const id = Date.now().toString();

  // Remove orçamento antigo da mesma categoria se existir
  await db.run("DELETE FROM budgets WHERE user_id = ? AND category = ?", [req.userId, category]);

  await db.run(
    "INSERT INTO budgets (id, user_id, category, limit_amount) VALUES (?, ?, ?, ?)",
    [id, req.userId, category, limit]
  );

  res.status(201).json({ id, category, limit });
});

app.delete("/budgets/:id", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  await db.run("DELETE FROM budgets WHERE id = ? AND user_id = ?", [id, req.userId]);
  res.json({ message: "Orçamento removido com sucesso!" });
});

// --- ROTAS DE METAS DE ECONOMIA ---

app.get("/goals", authMiddleware, async (req: any, res) => {
  const goals = await db.all("SELECT * FROM goals WHERE user_id = ?", [req.userId]);
  const formatted = goals.map((g: any) => ({
    id: g.id,
    title: g.title,
    targetAmount: g.target_amount,
    currentAmount: g.current_amount
  }));
  res.json(formatted);
});

app.post("/goals", authMiddleware, async (req: any, res) => {
  const { title, targetAmount } = req.body;
  const id = Date.now().toString();

  await db.run(
    "INSERT INTO goals (id, user_id, title, target_amount, current_amount) VALUES (?, ?, ?, ?, 0)",
    [id, req.userId, title, targetAmount]
  );

  res.status(201).json({ id, title, targetAmount, currentAmount: 0 });
});

app.patch("/goals/:id/deposit", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  const goal = await db.get("SELECT * FROM goals WHERE id = ? AND user_id = ?", [id, req.userId]);
  if (!goal) {
    return res.status(404).json({ error: "Meta não encontrada." });
  }

  const newAmount = (goal.current_amount || 0) + parseFloat(amount);
  await db.run("UPDATE goals SET current_amount = ? WHERE id = ?", [newAmount, id]);

  res.json({ message: "Depósito realizado!", newAmount });
});

// --- ROTAS DE INVESTIMENTOS ---

app.get("/investments", authMiddleware, async (req: any, res) => {
  const investments = await db.all("SELECT * FROM investments WHERE user_id = ?", [req.userId]);
  const formatted = investments.map((i: any) => ({
    id: i.id,
    title: i.title,
    category: i.category,
    amountInvested: i.amount_invested,
    currentValue: i.current_value
  }));
  res.json(formatted);
});

app.post("/investments", authMiddleware, async (req: any, res) => {
  const { title, category, amountInvested, currentValue } = req.body;
  const id = Date.now().toString();

  await db.run(
    "INSERT INTO investments (id, user_id, title, category, amount_invested, current_value) VALUES (?, ?, ?, ?, ?, ?)",
    [id, req.userId, title, category, amountInvested, currentValue]
  );

  res.status(201).json({ id, title, category, amountInvested, currentValue });
});

app.delete("/goals/:id", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  await db.run("DELETE FROM goals WHERE id = ? AND user_id = ?", [id, req.userId]);
  res.json({ message: "Meta removida com sucesso!" });
});

// Deletar Investimento
app.delete("/investments/:id", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  await db.run("DELETE FROM investments WHERE id = ? AND user_id = ?", [id, req.userId]);
  res.json({ message: "Investimento removido com sucesso!" });
});

// --- ROTA DA IA FINANCEIRA ---

app.get("/ai/insights", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;

    const transactions = await db.all("SELECT * FROM transactions WHERE user_id = ?", [userId]);
    const budgets = await db.all("SELECT * FROM budgets WHERE user_id = ?", [userId]);
    const goals = await db.all("SELECT * FROM goals WHERE user_id = ?", [userId]);
    const investments = await db.all("SELECT * FROM investments WHERE user_id = ?", [userId]);

    const totalIncome = transactions.filter((t: any) => t.type === "income").reduce((acc: number, t: any) => acc + t.amount, 0);
    const totalExpense = transactions.filter((t: any) => t.type === "outcome").reduce((acc: number, t: any) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const totalInvested = investments.reduce((acc: number, i: any) => acc + (i.current_value || 0), 0);

    if (transactions.length === 0) {
      return res.json({ insight: "Ainda não há dados suficientes para uma análise completa. Cadastre suas primeiras transações de entrada e saída para receber um diagnóstico detalhado." });
    }

    // Identifica maior categoria de gasto
    const catMap: { [key: string]: number } = {};
    transactions.filter((t: any) => t.type === "outcome").forEach((t: any) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

    let topCategory = "";
    let topAmount = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > topAmount) {
        topAmount = val;
        topCategory = cat;
      }
    });

    const expenseRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 100;

    // Diagnóstico dinâmico
    let insights = [];

    insights.push(`📊 **Diagnóstico Geral:** Você comprometeu **${expenseRatio}%** da sua renda este mês (Entradas: R$ ${totalIncome.toFixed(2)} | Saídas: R$ ${totalExpense.toFixed(2)}).`);

    if (topCategory) {
      insights.push(`⚠️ **Atenção aos Gastos:** A sua maior fonte de despesa é **${topCategory}**, somando R$ ${topAmount.toFixed(2)}. Considere estabelecer um teto de gastos na aba de Orçamentos.`);
    }

    if (totalInvested > 0) {
      insights.push(`📈 **Investimentos:** Você já tem R$ ${totalInvested.toFixed(2)} patrimoniados, o que representa excelente disciplina financeira.`);
    } else {
      insights.push(`💡 **Dica de Ouro:** Você ainda não possui aportes cadastrados. Tente destinar pelo menos 10% do seu saldo sobressalente (R$ ${(balance * 0.1).toFixed(2)}) para a sua carteira.`);
    }

    if (goals.length > 0) {
      insights.push(`🎯 **Metas:** Você possui ${goals.length} meta(s) ativa(s). Mantenha aportes constantes para acelerar o alcance dos seus objetivos.`);
    }

    res.json({ insight: insights.join("\n\n") });
  } catch (err) {
    res.status(500).json({ error: "Erro ao gerar diagnóstico financeiro." });
  }
});

app.patch("/user/change-password", authMiddleware, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Preencha a senha atual e a nova senha." });
  }

  try {
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.userId]);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "A senha atual está incorreta." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 8);
    await db.run("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, req.userId]);

    return res.json({ message: "Senha alterada com sucesso!" });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao alterar a senha." });
  }
});
// INICIAR SERVIDOR
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`-> Backend rodando na porta ${PORT}`);
});
