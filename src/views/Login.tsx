'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/Toast';
import { LogIn, Key, Mail, ShieldAlert } from 'lucide-react';

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      showToast('⚠️', 'Erro de Configuração', 'Supabase não está configurado. Verifique o arquivo .env.', 'tr');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showToast('❌', 'Falha na Autenticação', error.message || 'E-mail ou senha incorretos.', 'tr');
      } else {
        showToast('🔑', 'Acesso Concedido', 'Bem-vindo ao CTE Fluxo Financeiro!', 'tg');
        onLoginSuccess();
      }
    } catch (err) {
      console.error(err);
      showToast('❌', 'Erro', 'Ocorreu um erro ao processar o login.', 'tr');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001725] relative overflow-hidden font-sans">
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="w-full max-w-[420px] p-8 mx-4 bg-[#002639]/70 backdrop-blur-xl border border-slate-700/40 rounded-2xl shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-sky-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/20">
            <LogIn size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">CTE Fluxo Financeiro</h1>
          <p className="text-xs text-slate-400 mt-1">Insira suas credenciais para acessar o painel</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              E-mail Corporativo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@cte.com.br"
                className="w-full bg-[#001725]/80 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Key size={14} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#001725]/80 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-bold text-xs py-3 rounded-lg transition-all duration-200 shadow-md shadow-sky-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>

        {/* Security Alert Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex items-start gap-2.5 text-[10px] text-slate-400">
          <ShieldAlert size={16} className="text-amber-500/80 shrink-0 mt-0.5" />
          <span>
            Acesso restrito para colaboradores autorizados do grupo CTE. Todas as ações nesta plataforma são monitoradas.
          </span>
        </div>
      </div>
    </div>
  );
}
