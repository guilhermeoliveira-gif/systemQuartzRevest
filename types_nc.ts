export interface NaoConformidade {
    id: string;
    titulo: string;
    descricao: string;
    tipo: 'PROCESSO' | 'PRODUTO' | 'SEGURANCA' | 'AMBIENTAL' | 'OUTROS';
    origem: string;
    data_ocorrencia: string;
    status: 'EM_ANALISE' | 'ACAO_DEFINIDA' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'CANCELADO';
    severidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    responsavel_id: string;
    created_at: string;

    // Ação Imediata / Contenção
    acao_contencao?: string;

    // Evidências (URLs ou nomes de arquivos)
    evidencias?: string[];

    // Metodologia 5 Porquês
    analise_causa?: {
        pq1: string;
        pq2?: string;
        pq3?: string;
        pq4?: string;
        pq5?: string;
        causa_raiz: string;
    };

    // Plano de Ação (5W2H)
    plano_acao?: {
        what: string;  // O que fazer (Ação)
        why: string;   // Por que fazer (Motivo)
        where: string; // Onde fazer (Local)
        when: string;  // Quando fazer (Prazo)
        who: string;   // Quem fará (Responsável)
        how: string;   // Como fazer (Método)
        how_much?: string; // Quanto custa (Custo)
        status_acao: 'PEDENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'VERIFICADA';
    };

    // Verificação de Eficácia
    verificacao?: {
        eficaz: boolean;
        data_verificacao: string;
        observacoes: string;
        verificador_id: string;
    };
}
