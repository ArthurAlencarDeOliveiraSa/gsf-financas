import React from "react";

const navItems = [
  { id: "painel", label: "Painel" },
  { id: "transacoes", label: "Transações" },
  { id: "orcamento", label: "Orçamento" },
  { id: "metas", label: "Metas" },
  { id: "investimentos", label: "Investimentos" },
  { id: "relatorios", label: "Relatórios" },
  { id: "ia", label: "IA Financeira" },
  { id: "configuracoes", label: "Configurações" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ isOpen, onClose, activeTab, setActiveTab }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-64 shrink-0 bg-ink text-paper flex flex-col h-screen fixed top-0 left-0 z-50">
      <div className="px-6 py-8 flex justify-between items-center">
      <h1 className="font-sans font-bold text-2xl tracking-wider text-paper">
            GSF
      </h1>
        {/* Botão de fechar (X) dentro da sidebar no mobile/desktop */}
        <button onClick={onClose} className="text-paper text-xl font-bold hover:text-muted">
          ✕
        </button>
      </div>

      <nav className="flex-1 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left block px-4 py-2.5 text-sm border-l-2 transition-colors mb-1 ${
                isActive
                  ? "border-gold text-paper bg-ink-light font-bold"
                  : "border-transparent text-muted hover:text-paper hover:border-muted"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-6 py-6 border-t border-ink-light">
        <p className="text-xs text-muted">Arthur Souza</p>
      </div>
    </aside>
  );
}