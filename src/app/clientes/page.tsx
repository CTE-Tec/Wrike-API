import { Suspense } from 'react';
import Clientes from '../../views/Clientes';

export default function ClientesPage() {
  return (
    <Suspense fallback={<div className="p-8">Carregando...</div>}>
      <Clientes />
    </Suspense>
  );
}
