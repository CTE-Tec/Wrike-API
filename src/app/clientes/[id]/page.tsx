import { Suspense } from 'react';
import ClienteDetalhes from '../../../views/ClienteDetalhes';

export default function ClienteDetalhesPage() {
  return (
    <Suspense fallback={<div className="p-8">Carregando...</div>}>
      <ClienteDetalhes />
    </Suspense>
  );
}
