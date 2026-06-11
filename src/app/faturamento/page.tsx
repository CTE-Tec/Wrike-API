import { Suspense } from 'react';
import Faturamento from '../../../src/views/Faturamento';

export default function FaturamentoPage() {
  return (
    <Suspense fallback={<div className="p-8">Carregando...</div>}>
      <Faturamento />
    </Suspense>
  );
}
