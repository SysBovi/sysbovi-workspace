'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth-context';

// ─── Tipos do frontend ────────────────────────────────────────────────────────

export interface Bovino {
  id: string;
  brinco: string;
  raca: string;
  sexo: 'Macho' | 'Fêmea';
  dataNascimento: string;
  dataEntrada: string;
  pesoAtual: number;
  pesoEntrada: number;
  statusSaude: 'Saudável' | 'Em Tratamento' | 'Observação';
  lote: string;
  pastoAtual: string;
  pastoAtualNome?: string;
  ultimaPesagem: string | null;
  idadeEmMeses: number;
  custoAcumulado: number;
  loteId?: string | null;
}

export interface Pasto {
  id: string;
  nome: string;
  area: number;
  capacidade: number;
  ocupacaoAtual: number;
  diasDescanso: number;
  status: 'Normal' | 'Superlotado' | 'Disponível';
  ultimoRodizio: string | null;
}

export interface Insumo {
  id: string;
  nome: string;
  tipo: string;
  quantidadeAtual: number;
  nivelMinimo: number;
  unidade: string;
  status: 'Normal' | 'Baixo' | 'Crítico';
  validade: string | null;
}

export interface Especialista {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  avatar?: string;
  telefone?: string;
}

export interface CreateInsumoData {
  nome: string;
  tipo: 'VACINA' | 'SUPLEMENTO' | 'MEDICAMENTO' | 'MINERAL';
  unidade: string;
  quantidadeAtual: number;
  custoUnitario: number;
  nivelMinimo: number;
  validade?: string;
}

export interface UpdateInsumoData {
  nome?: string;
  tipo?: 'VACINA' | 'SUPLEMENTO' | 'MEDICAMENTO' | 'MINERAL';
  unidade?: string;
  custoUnitario?: number;
  nivelMinimo?: number;
  validade?: string | null;
}

export interface UsarInsumoData {
  loteId: string;
  quantidadeUtilizada: number;
}

export interface HistoricoUsoItem {
  id: string;
  dataUso: string;
  loteNome: string;
  quantidadeUtilizada: number;
  valorUnitario: number;
  custoTotal: number;
}

interface DataContextValue {
  bovinos: Bovino[];
  pastos: Pasto[];
  insumos: Insumo[];
  especialistasVinculados: Especialista[];
  especialistasDisponiveis: Especialista[];
  isLoading: boolean;
  recarregarBovinos: () => Promise<void>;
  recarregarPastos: () => Promise<void>;
  recarregarInsumos: () => Promise<void>;
  addBovino: (data: CreateBovinoData) => Promise<void>;
  updateBovino: (id: string, data: UpdateBovinoData) => Promise<void>;
  addPasto: (data: CreatePastoData) => Promise<void>;
  updatePasto: (id: string, data: UpdatePastoData) => Promise<void>;
  removePasto: (id: string) => Promise<void>;
  criarInsumo: (data: CreateInsumoData) => Promise<void>;
  editarInsumo: (id: string, data: UpdateInsumoData) => Promise<void>;
  removerInsumo: (id: string) => Promise<void>;
  adicionarEstoqueInsumo: (id: string, quantidade: number) => Promise<void>;
  usarInsumo: (id: string, data: UsarInsumoData) => Promise<void>;
  getHistoricoInsumo: (id: string) => Promise<HistoricoUsoItem[]>;
  vincularEspecialista: (id: string) => void;
  desvincularEspecialista: (id: string) => void;
}

export interface CreateBovinoData {
  brinco: string;
  raca: string;
  sexo: 'M' | 'F';
  dataNascimento: string;
  pesoEntrada: number;
  loteId?: string;
}

export interface UpdateBovinoData {
  brinco?: string;
  raca?: string;
  statusSaude?: 'SAUDAVEL' | 'EM_TRATAMENTO' | 'OBSERVACAO';
  loteId?: string | null;
}

export interface CreatePastoData {
  nome: string;
  capacidade: number;
  areaHectares?: number;
  diasDescanso?: number;
}

export interface UpdatePastoData {
  nome?: string;
  capacidade?: number;
  areaHectares?: number;
  diasDescanso?: number;
}

// ─── Mapeamentos API → Frontend ───────────────────────────────────────────────

function mapSexo(sexo: string): 'Macho' | 'Fêmea' {
  return sexo === 'M' ? 'Macho' : 'Fêmea';
}

function mapStatusSaude(s: string): 'Saudável' | 'Em Tratamento' | 'Observação' {
  const map: Record<string, 'Saudável' | 'Em Tratamento' | 'Observação'> = {
    SAUDAVEL: 'Saudável',
    EM_TRATAMENTO: 'Em Tratamento',
    OBSERVACAO: 'Observação',
  };
  return map[s] ?? 'Saudável';
}

function mapStatusOcupacao(s: string, ocupacao: number, capacidade: number): 'Normal' | 'Superlotado' | 'Disponível' {
  if (s === 'SUPERLOTADO') return 'Superlotado';
  if (ocupacao / capacidade < 0.8) return 'Disponível';
  return 'Normal';
}

function mapStatusInsumo(s: string): 'Normal' | 'Baixo' | 'Crítico' {
  const map: Record<string, 'Normal' | 'Baixo' | 'Crítico'> = {
    NORMAL: 'Normal',
    BAIXO: 'Baixo',
    CRITICO: 'Crítico',
  };
  return map[s] ?? 'Normal';
}

function mapBovino(raw: any): Bovino {
  return {
    id: raw.id,
    brinco: raw.brinco,
    raca: raw.raca,
    sexo: mapSexo(raw.sexo),
    dataNascimento: raw.dataNascimento,
    dataEntrada: raw.dataEntrada,
    pesoAtual: raw.pesoAtual ?? raw.pesoEntrada ?? 0,
    pesoEntrada: raw.pesoEntrada ?? 0,
    statusSaude: mapStatusSaude(raw.statusSaude),
    lote: raw.lote?.nome ?? '',
    pastoAtual: raw.lote?.nome ?? 'Sem pasto',
    pastoAtualNome: raw.lote?.nome,
    ultimaPesagem: raw.ultimaPesagem ?? null,
    idadeEmMeses: raw.idadeMeses ?? raw.idadeEmMeses ?? 0,
    custoAcumulado: raw.custoAcumulado ?? 0,
    loteId: raw.loteId ?? null,
  };
}

function mapPasto(raw: any): Pasto {
  return {
    id: raw.id,
    nome: raw.nome,
    area: raw.areaHectares ?? 0,
    capacidade: raw.capacidade,
    ocupacaoAtual: raw.ocupacaoAtual ?? 0,
    diasDescanso: raw.diasDescanso ?? 30,
    status: mapStatusOcupacao(raw.statusOcupacao ?? raw.status ?? 'NORMAL', raw.ocupacaoAtual ?? 0, raw.capacidade),
    ultimoRodizio: raw.ultimoRodizio ?? null,
  };
}

const TIPO_INSUMO_LABEL: Record<string, string> = {
  VACINA: 'Vacina',
  SUPLEMENTO: 'Suplemento',
  MEDICAMENTO: 'Medicamento',
  MINERAL: 'Mineral',
};

function mapInsumo(raw: any): Insumo {
  return {
    id: raw.id,
    nome: raw.nome,
    tipo: TIPO_INSUMO_LABEL[raw.tipo] ?? raw.tipo,
    quantidadeAtual: raw.quantidadeAtual ?? 0,
    nivelMinimo: raw.nivelMinimo ?? 0,
    unidade: raw.unidade,
    status: mapStatusInsumo(raw.status ?? 'NORMAL'),
    validade: raw.validade ?? null,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [bovinos, setBovinos] = useState<Bovino[]>([]);
  const [pastos, setPastos] = useState<Pasto[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [especialistasVinculados, setEspecialistasVinculados] = useState<Especialista[]>([]);
  const [especialistasDisponiveis, setEspecialistasDisponiveis] = useState<Especialista[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const recarregarBovinos = useCallback(async () => {
    try {
      const data = await api.get<any[]>('/bovinos');
      setBovinos(data.map(mapBovino));
    } catch { /* silencioso — página exibirá estado vazio */ }
  }, []);

  const recarregarPastos = useCallback(async () => {
    try {
      const data = await api.get<any[]>('/pastos');
      setPastos(data.map(mapPasto));
    } catch { }
  }, []);

  const recarregarInsumos = useCallback(async () => {
    try {
      const data = await api.get<any[]>('/insumos');
      setInsumos(data.map(mapInsumo));
    } catch { }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!user.fazenda) return; // admin UA não tem tenant — não busca dados de fazenda
    setIsLoading(true);
    Promise.all([recarregarBovinos(), recarregarPastos(), recarregarInsumos()])
      .finally(() => setIsLoading(false));
  }, [user, recarregarBovinos, recarregarPastos, recarregarInsumos]);

  async function addBovino(data: CreateBovinoData) {
    await api.post('/bovinos', data);
    await Promise.all([recarregarBovinos(), recarregarPastos()]);
  }

  async function updateBovino(id: string, data: UpdateBovinoData) {
    await api.put(`/bovinos/${id}`, data);
    await Promise.all([recarregarBovinos(), recarregarPastos()]);
  }

  async function addPasto(data: CreatePastoData) {
    await api.post('/pastos', data);
    await recarregarPastos();
  }

  async function updatePasto(id: string, data: UpdatePastoData) {
    await api.put(`/pastos/${id}`, data);
    await recarregarPastos();
  }

  async function removePasto(id: string) {
    await api.delete(`/pastos/${id}`);
    await recarregarPastos();
  }

  async function criarInsumo(data: CreateInsumoData) {
    await api.post('/insumos', data);
    await recarregarInsumos();
  }

  async function editarInsumo(id: string, data: UpdateInsumoData) {
    await api.put(`/insumos/${id}`, data);
    await recarregarInsumos();
  }

  async function removerInsumo(id: string) {
    await api.delete(`/insumos/${id}`);
    await recarregarInsumos();
  }

  async function adicionarEstoqueInsumo(id: string, quantidade: number) {
    await api.patch(`/insumos/${id}/adicionar`, { quantidade });
    await recarregarInsumos();
  }

  async function usarInsumo(id: string, data: UsarInsumoData) {
    await api.post(`/insumos/${id}/usar`, data);
    await Promise.all([recarregarInsumos(), recarregarBovinos()]);
  }

  async function getHistoricoInsumo(id: string): Promise<HistoricoUsoItem[]> {
    return api.get<HistoricoUsoItem[]>(`/insumos/${id}/historico`);
  }

  const vincularEspecialista = useCallback((id: string) => {
    setEspecialistasDisponiveis(prev => {
      const esp = prev.find(e => e.id === id);
      if (esp) setEspecialistasVinculados(v => [...v, esp]);
      return prev.filter(e => e.id !== id);
    });
  }, []);

  const desvincularEspecialista = useCallback((id: string) => {
    setEspecialistasVinculados(prev => {
      const esp = prev.find(e => e.id === id);
      if (esp) setEspecialistasDisponiveis(d => [...d, esp]);
      return prev.filter(e => e.id !== id);
    });
  }, []);

  return (
    <DataContext.Provider value={{
      bovinos,
      pastos,
      insumos,
      especialistasVinculados,
      especialistasDisponiveis,
      isLoading,
      recarregarBovinos,
      recarregarPastos,
      recarregarInsumos,
      addBovino,
      updateBovino,
      addPasto,
      updatePasto,
      removePasto,
      criarInsumo,
      editarInsumo,
      removerInsumo,
      adicionarEstoqueInsumo,
      usarInsumo,
      getHistoricoInsumo,
      vincularEspecialista,
      desvincularEspecialista,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider');
  return ctx;
}
