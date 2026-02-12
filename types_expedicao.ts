import { VendaPedido } from './types_vendas';

export interface Carga {
    id: string;
    numero_carga: number;
    motorista: string;
    veiculo: string;
    data_saida: string;
    status: 'ABERTA' | 'FECHADA' | 'CANCELADA';
    peso_total: number;
    paletes_total: number;
    observacao?: string;
    pedidos?: CargaPedido[]; // Join, se necessário
    created_at?: string;
}

export interface CargaPedido {
    id: string;
    carga_id: string;
    pedido_id: string;
    pedido?: VendaPedido; // Join para exibir dados do pedido
}

// Extensão utilitária para cálculo no frontend
export interface ItemCalculoRomaneio {
    produto: string;
    quantidade: number;
    eh_argamassa: boolean;
    eh_rejunte: boolean;
    peso_total: number; // Qtd * PesoUnitario
    paletes: number;
}
