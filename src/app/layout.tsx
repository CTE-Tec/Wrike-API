import type { Metadata } from 'next';
import '../../src/index.css';
import ToastArea from '../../src/components/Toast';

export const metadata: Metadata = {
  title: 'CTE Faturamento',
  description: 'Painel de faturamento e aprovação para projetos CTE',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <ToastArea />
      </body>
    </html>
  );
}
