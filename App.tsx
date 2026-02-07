
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppState, CalcMode } from './types';
import { calculateResults, formatBRL, formatPercent } from './services/calculatorService';

const STORAGE_KEY = 'fabiano_repasse_v1';

const INITIAL_STATE: AppState = {
  mode: CalcMode.SALE_TO_PROFIT,
  carModel: '',
  carYear: '',
  carColor: '',
  carOrigin: '',
  carPrice: 0,
  purchaseDate: new Date().toISOString().split('T')[0],
  saleDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  opportunityRateMonthly: 1.0,
  freight: 0,
  taxRate: 15.0,
  targetSalePrice: 0,
  targetNetProfit: 0,
  quality: 3
};

interface MoneyInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  className?: string;
  highlight?: boolean;
}

const MoneyInput: React.FC<MoneyInputProps> = ({ 
  label, value, onChange, prefix, suffix, className, highlight 
}) => {
  const [displayValue, setDisplayValue] = useState("");
  const isFocused = useRef(false);

  const formatValue = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    if (!isFocused.current) setDisplayValue(value === 0 ? "" : formatValue(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const validChars = raw.replace(/[^0-9.,-]/g, '');
    setDisplayValue(validChars);
    const normalized = parseFloat(validChars.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(normalized)) onChange(normalized);
    else if (validChars === "") onChange(0);
  };

  const handleFocus = () => {
    isFocused.current = true;
    if (value !== 0) setDisplayValue(value.toString().replace('.', ','));
  };

  const handleBlur = () => {
    isFocused.current = false;
    const numeric = parseFloat(displayValue.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(numeric)) {
      setDisplayValue(formatValue(numeric));
      onChange(numeric);
    } else {
      setDisplayValue("");
      onChange(0);
    }
  };

  return (
    <div className={className}>
      <label className="text-[9px] font-black uppercase tracking-widest block mb-1 text-slate-400">
        {label}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 text-[11px] font-black pointer-events-none">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0,00"
          className={`w-full border rounded-lg py-2 pr-2 outline-none transition-all font-bold text-[13px] ${prefix ? 'pl-8' : 'pl-3'} ${
            highlight 
              ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200' 
              : 'bg-slate-800/40 border-slate-700/60 text-slate-100 focus:border-cyan-500'
          } ${suffix ? 'pr-6' : ''}`}
        />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-500 text-[10px] font-black pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) try { return JSON.parse(saved); } catch (e) { return INITIAL_STATE; }
    return INITIAL_STATE;
  });

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), [state]);

  const results = useMemo(() => calculateResults(state), [state]);
  const handleFieldChange = (field: keyof AppState, value: any) => setState(prev => ({ ...prev, [field]: value }));

  const getQualityColor = (val: number) => {
    const hues = [0, 25, 45, 80, 130];
    return `hsl(${hues[val - 1]}, 85%, 50%)`;
  };

  const qualityColor = useMemo(() => getQualityColor(state.quality), [state.quality]);

  const copyFullReport = useCallback(() => {
    const text = `
💎 *FABIANO AUTO REPASSE*
---------------------------
🚗 *VEÍCULO:* ${state.carModel || 'NÃO INFORMADO'}
📅 *ANO:* ${state.carYear || '-'}
🎨 *COR:* ${state.carColor || '-'}
📍 *ORIGEM:* ${state.carOrigin || '-'}
⭐ *NOTA QUALIDADE:* ${state.quality}/5
---------------------------
💰 *VALOR COMPRA:* ${formatBRL(state.carPrice)}
📦 *GASTOS/FRETE:* ${formatBRL(state.freight)}
📈 *TAXA CAPITAL:* ${state.opportunityRateMonthly}% a.m.
💸 *IMP. SOBRE LUCRO:* ${state.taxRate}%
📅 *TEMPO DE PÁTIO:* ${results.days} Dias
---------------------------
🏷️ *VENDA SUGERIDA:* ${formatBRL(results.salePrice)}
💰 *LUCRO LÍQUIDO:* ${formatBRL(results.netProfit)}
🚀 *RETORNO (ROI):* ${formatPercent(results.roi)}
---------------------------
_Gerado por Fabiano Auto Repasse_
    `.trim();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => alert('Relatório copiado com sucesso!'));
    }
  }, [state, results]);

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-honeycomb overflow-hidden">
      {/* HEADER EQUILIBRADO */}
      <header className="pt-4 pb-3 px-4 text-center shrink-0 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 blur-[80px] pointer-events-none"></div>
        <p className="text-[8px] font-black tracking-[0.5em] text-white/50 mb-1">FABIANO</p>
        <h1 className="text-xl font-black italic font-auto text-cyan-gradient tracking-tight leading-none mb-3">
          AUTO REPASSE
        </h1>
        
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3 backdrop-blur-lg space-y-2.5 shadow-xl">
          <input 
            type="text" placeholder="MODELO DO VEÍCULO" value={state.carModel}
            onChange={(e) => handleFieldChange('carModel', e.target.value)}
            className="w-full bg-transparent border-b border-slate-700 text-cyan-50 placeholder:text-slate-600 text-[11px] font-black outline-none pb-1 text-center"
          />
          <div className="grid grid-cols-3 gap-2.5">
            <input type="text" placeholder="Ano" value={state.carYear} onChange={(e) => handleFieldChange('carYear', e.target.value)} className="bg-slate-800/40 rounded-lg py-1 text-[10px] text-white text-center border border-slate-700/50 outline-none focus:border-cyan-500" />
            <input type="text" placeholder="Cor" value={state.carColor} onChange={(e) => handleFieldChange('carColor', e.target.value)} className="bg-slate-800/40 rounded-lg py-1 text-[10px] text-white text-center border border-slate-700/50 outline-none focus:border-cyan-500" />
            <input type="text" placeholder="Origem" value={state.carOrigin} onChange={(e) => handleFieldChange('carOrigin', e.target.value)} className="bg-slate-800/40 rounded-lg py-1 text-[10px] text-white text-center border border-slate-700/50 outline-none focus:border-cyan-500" />
          </div>
          
          <div className="flex items-center gap-3 px-1 pt-1">
            <input 
              type="range" min="1" max="5" value={state.quality} 
              onChange={(e) => handleFieldChange('quality', parseInt(e.target.value))} 
              className="flex-1 h-1 bg-slate-700 rounded-full appearance-none transition-all cursor-pointer"
              style={{ accentColor: qualityColor }}
            />
            <span 
              className="text-[9px] font-black text-white px-2.5 py-1 rounded-md shadow-lg transition-colors min-w-[55px] text-center"
              style={{ backgroundColor: qualityColor, boxShadow: `0 4px 10px ${qualityColor}30` }}
            >
              NOTA {state.quality}
            </span>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-3 shrink-0 overflow-hidden">
        {/* SELETOR DE MODO MAIS VISÍVEL */}
        <div className="bg-slate-900/80 p-1 rounded-xl flex border border-slate-800/60 shadow-lg">
          <button 
            onClick={() => handleFieldChange('mode', CalcMode.SALE_TO_PROFIT)} 
            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${state.mode === CalcMode.SALE_TO_PROFIT ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500'}`}
          >
            Modo Venda
          </button>
          <button 
            onClick={() => handleFieldChange('mode', CalcMode.PROFIT_TO_SALE)} 
            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${state.mode === CalcMode.PROFIT_TO_SALE ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500'}`}
          >
            Modo Lucro
          </button>
        </div>

        {/* ÁREA FINANCEIRA COM MELHOR ESPAÇAMENTO */}
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3 shadow-inner">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <MoneyInput label="Valor Compra" prefix="R$" value={state.carPrice} onChange={(val) => handleFieldChange('carPrice', val)} />
            <MoneyInput label="Gastos Extras" prefix="R$" value={state.freight} onChange={(val) => handleFieldChange('freight', val)} />
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">📅 Início</label>
                <input type="date" value={state.purchaseDate} onChange={(e) => handleFieldChange('purchaseDate', e.target.value)} className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg p-1.5 text-[10px] font-bold text-slate-100 outline-none" />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">🏁 Fim</label>
                <input type="date" value={state.saleDate} onChange={(e) => handleFieldChange('saleDate', e.target.value)} className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg p-1.5 text-[10px] font-bold text-slate-100 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MoneyInput label="Cap. (% a.m.)" suffix="%" value={state.opportunityRateMonthly} onChange={(val) => handleFieldChange('opportunityRateMonthly', val)} />
              <MoneyInput label="Imp. Lucro" suffix="%" value={state.taxRate} onChange={(val) => handleFieldChange('taxRate', val)} />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60">
            {state.mode === CalcMode.SALE_TO_PROFIT ? (
              <MoneyInput label="Preço de Venda Pretendido" prefix="R$" highlight value={state.targetSalePrice} onChange={(val) => handleFieldChange('targetSalePrice', val)} />
            ) : (
              <MoneyInput label="Lucro Líquido Almejado" prefix="R$" highlight value={state.targetNetProfit} onChange={(val) => handleFieldChange('targetNetProfit', val)} />
            )}
          </div>
        </div>

        {/* RESULTADO COM DESTAQUE MODERADO */}
        {!results.error ? (
          <div className="bg-slate-900 rounded-[1.5rem] p-5 border-2 border-cyan-500/20 shadow-2xl relative overflow-hidden">
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-cyan-500/5 blur-[40px]"></div>
            
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.15em] mb-1">Lucro Estimado</p>
                  <h2 className="text-3xl font-black text-white leading-none tracking-tighter">{formatBRL(results.netProfit)}</h2>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">ROI</p>
                  <p className={`text-2xl font-black leading-none ${results.roi >= 10 ? 'text-emerald-400' : 'text-cyan-400'}`}>{formatPercent(results.roi)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80">
                <div className="bg-slate-800/40 p-2 rounded-xl text-center border border-slate-700/30">
                  <p className="text-[7px] font-bold text-slate-500 uppercase mb-0.5">Investido</p>
                  <p className="text-[11px] text-slate-300 font-black">{formatBRL(results.totalCost)}</p>
                </div>
                <div className="bg-cyan-900/20 p-2 rounded-xl text-center border border-cyan-500/10">
                  <p className="text-[7px] font-bold text-cyan-500 uppercase mb-0.5">Sugestão</p>
                  <p className="text-[11px] text-white font-black">{formatBRL(results.salePrice)}</p>
                </div>
                <div className="bg-slate-800/40 p-2 rounded-xl text-center border border-slate-700/30">
                  <p className="text-[7px] font-bold text-slate-500 uppercase mb-0.5">Pátio</p>
                  <p className="text-[11px] text-slate-300 font-black">{results.days} dias</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-center text-[10px] font-black border border-red-500/20 uppercase tracking-wide">⚠️ {results.error}</div>
        )}
      </main>

      {/* RODAPÉ E AÇÃO PRINCIPAL */}
      <footer className="mt-auto p-4 shrink-0">
        <div className="max-w-md mx-auto">
          <button 
            onClick={copyFullReport} 
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[11px] uppercase tracking-[0.2em] py-4 rounded-2xl shadow-cyan-600/30 shadow-xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
          >
             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
             </svg>
             COPIAR RELATÓRIO COMPLETO
          </button>
        </div>
        <div className="flex justify-center items-center mt-3 gap-2">
          <div className="h-px w-8 bg-slate-800"></div>
          <p className="text-[8px] text-slate-600 font-black tracking-[0.3em] uppercase">Fabiano Auto Repasse</p>
          <div className="h-px w-8 bg-slate-800"></div>
        </div>
      </footer>
    </div>
  );
};

export default App;
