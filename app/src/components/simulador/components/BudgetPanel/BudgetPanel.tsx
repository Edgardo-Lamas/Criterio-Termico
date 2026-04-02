import React, { useEffect, useState, useMemo } from 'react';
import { useElementsStore } from '../../store/useElementsStore';
import { usePriceStore } from '../../store/usePriceStore';
import { generateBudgetOptions, calculateTotalBudget } from '../../services/budgetService';
import type { BudgetOptions, SelectedBudget, PipeQuantities } from '../../services/budgetService';
import { generateQuotePDF, generateFloorPlanPDF } from '../../utils/pdfGenerator';
import { useCompanyStore } from '../../stores/companyStore';
import { useLeadStore } from '../../store/useLeadStore';
import { loadLogoAsBase64 } from '../../utils/logoHelper';
import './BudgetPanel.css';

interface BudgetPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BudgetPanel: React.FC<BudgetPanelProps> = ({ isOpen, onClose }) => {
    const { radiators, boilers, rooms, pipes, floorPlans, currentFloor } = useElementsStore();
    const { prices } = usePriceStore();
    const { companyDetails, clientDetails, getActivePromotions } = useCompanyStore();
    const { saveLead } = useLeadStore();

    const [options, setOptions] = useState<BudgetOptions | null>(null);
    const [selectedBoilerId, setSelectedBoilerId] = useState<string>('');
    const [selectedRadiatorId, setSelectedRadiatorId] = useState<string>('');
    const [budgetResult, setBudgetResult] = useState<SelectedBudget | null>(null);
    const [preloadedLogo, setPreloadedLogo] = useState<string | null>(null);

    // Total Power Calculation
    const totalPowerKcal = radiators.reduce((sum, r) => sum + r.power, 0);

    // Calculate pipe quantities by diameter (only supply pipes to avoid double counting)
    const pipeQuantities = useMemo<PipeQuantities>(() => {
        const quantities: PipeQuantities = {};
        pipes.filter(p => p.pipeType === 'supply').forEach(pipe => {
            const diameter = pipe.diameter || 16;
            const length = pipe.length || 0;
            quantities[diameter] = (quantities[diameter] || 0) + length;
        });
        // Double the length for return pipes (same length as supply)
        Object.keys(quantities).forEach(d => {
            quantities[parseInt(d)] *= 2; // ida + vuelta
        });
        return quantities;
    }, [pipes]);

    // Pre-load logo when panel opens (so download can stay synchronous)
    useEffect(() => {
        if (isOpen && companyDetails.logo && !companyDetails.logo.startsWith('data:')) {
            loadLogoAsBase64(companyDetails.logo).then(result => {
                setPreloadedLogo(result);
            });
        } else if (isOpen && companyDetails.logo?.startsWith('data:')) {
            setPreloadedLogo(companyDetails.logo);
        }
    }, [isOpen, companyDetails.logo]);

    useEffect(() => {
        if (isOpen) {
            const opts = generateBudgetOptions(totalPowerKcal);
            setOptions(opts);

            // Set defaults if not set
            if (!selectedBoilerId && opts.suggestedBoilers.length > 0) {
                setSelectedBoilerId(opts.suggestedBoilers[0].id);
            }
            if (!selectedRadiatorId && opts.allRadiators.length > 0) {
                setSelectedRadiatorId(opts.allRadiators[0].id);
            }
        }
    }, [isOpen, totalPowerKcal]);

    useEffect(() => {
        if (options && selectedBoilerId && selectedRadiatorId) {
            // Calculate Total Elements needed for this specific radiator model to meet power
            const radModel = options.allRadiators.find(r => r.id === selectedRadiatorId);
            let totalElems = 0;
            if (radModel && radModel.powerKcal > 0) {
                totalElems = Math.ceil(totalPowerKcal / radModel.powerKcal);
            }

            const result = calculateTotalBudget(
                selectedBoilerId,
                selectedRadiatorId,
                totalElems,
                radiators.length,
                prices,
                pipeQuantities
            );
            setBudgetResult(result);
        }
    }, [selectedBoilerId, selectedRadiatorId, totalPowerKcal, radiators.length, options, prices, pipeQuantities]);

    const handleDownloadFloorPlan = () => {
        const plan = floorPlans[currentFloor];
        if (!plan.image || !plan.dimensions) {
            alert('No hay plano cargado para esta planta. Subí una imagen del plano primero.');
            return;
        }
        try {
            generateFloorPlanPDF(
                plan.image,
                plan.dimensions,
                plan.offset,
                radiators,
                pipes,
                boilers,
                rooms,
                companyDetails,
                clientDetails,
                currentFloor
            );
        } catch (error) {
            console.error('Error generando plano PDF:', error);
            alert('Hubo un error al generar el plano. Por favor intenta nuevamente.');
        }
    };

    // 100% SYNCHRONOUS handler — critical for browser download trust
    const handleDownloadPDF = () => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        // --- LEAD CAPTURE ---
        if (budgetResult) {
            saveLead(
                clientDetails,
                budgetResult,
                totalPowerKcal,
                radiators.length
            );
        }
        // --------------------

        try {
            generateQuotePDF(
                canvas,
                rooms,
                radiators,
                companyDetails,
                clientDetails,
                getActivePromotions(),
                budgetResult,
                preloadedLogo
            );
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Hubo un error al generar el PDF. Por favor intenta nuevamente.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`budget-panel ${isOpen ? '' : 'hidden'}`}>
            <div className="budget-header">
                <h3>💰 Presupuesto Profesional</h3>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="budget-content">
                {/* System Summary */}
                <div className="budget-section">
                    <h4>Resumen de Ingeniería</h4>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <span className="summary-label">Potencia Requerida</span>
                            <span className="summary-value">{Math.round(totalPowerKcal).toLocaleString()} Kcal/h</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Radiadores</span>
                            <span className="summary-value">{radiators.length} Unidades</span>
                        </div>
                    </div>
                </div>

                {/* Boiler Selection */}
                <div className="budget-section">
                    <h4>🔥 Selección de Caldera</h4>
                    <div className="product-grid">
                        {options?.suggestedBoilers.map(b => (
                            <div
                                key={b.id}
                                className={`product-card ${selectedBoilerId === b.id ? 'selected' : ''}`}
                                onClick={() => setSelectedBoilerId(b.id)}
                            >
                                <div className="product-icon">🔥</div>
                                <div className="product-info">
                                    <div className="product-name">{b.brand} {b.model}</div>
                                    <div className="product-spec">{b.maxPowerKcal.toLocaleString()} Kcal/h ({b.maxPowerKw} kW)</div>
                                </div>
                                <div className="product-price-col">
                                    <div className="product-price">${(prices.boilers[b.id] || b.cost).toLocaleString()}</div>
                                </div>
                                <div className="check-mark">✔</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Radiator Selection */}
                <div className="budget-section">
                    <h4>🌡️ Selección de Radiadores</h4>
                    <div className="product-grid">
                        {options?.allRadiators.map(r => (
                            <div
                                key={r.id}
                                className={`product-card ${selectedRadiatorId === r.id ? 'selected' : ''}`}
                                onClick={() => setSelectedRadiatorId(r.id)}
                            >
                                <div className="product-icon">▥</div>
                                <div className="product-info">
                                    <div className="product-name">{r.brand} {r.model}</div>
                                    <div className="product-spec">Altura: {r.heightMm}mm | Potencia: {r.powerKcal} Kcal/el</div>
                                </div>
                                <div className="product-price-col">
                                    <div className="product-price">${(prices.radiators[r.id] || r.cost).toLocaleString()}/el</div>
                                </div>
                                <div className="check-mark">✔</div>
                            </div>
                        ))}
                    </div>

                    {budgetResult?.breakdown.radiators && (
                        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#eef2f5', borderRadius: '6px', fontSize: '0.9rem' }}>
                            <strong>Total Elementos Calculados: </strong>
                            <span style={{ color: 'var(--bp-primary)' }}>{budgetResult.breakdown.radiators.count}</span>
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                (Se adapta la cantidad de elementos según potencia requerida por ambiente)
                            </div>
                        </div>
                    )}
                </div>

                {/* Pipes Section */}
                {budgetResult?.breakdown.pipes && budgetResult.breakdown.pipes.length > 0 && (
                    <div className="budget-section">
                        <h4>🔧 Tuberías</h4>
                        <div className="breakdown-list">
                            {budgetResult.breakdown.pipes.map((pipe, index) => (
                                <div className="breakdown-item" key={index}>
                                    <span className="breakdown-label">
                                        Tubo PE-X Ø{pipe.diameterMm}mm
                                        <small> ({pipe.meters.toFixed(1)}m × ${pipe.costPerMeter.toLocaleString()}/m)</small>
                                    </span>
                                    <span className="breakdown-cost">${pipe.totalCost.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Breakdown & Accessories */}
                <div className="budget-section">
                    <h4>📋 Accesorios</h4>
                    <div className="breakdown-list">
                        {budgetResult?.breakdown.accessories.map((acc, index) => (
                            <div className="breakdown-item" key={index}>
                                <span className="breakdown-label">{acc.model.name} <small>x{acc.count}</small></span>
                                <span className="breakdown-cost">${acc.totalCost.toLocaleString()}</span>
                            </div>
                        ))}
                        {(!budgetResult?.breakdown.accessories || budgetResult?.breakdown.accessories.length === 0) && (
                            <div style={{ color: '#999', fontStyle: 'italic', textAlign: 'center' }}>Sin accesorios adicionales</div>
                        )}
                    </div>
                </div>

                {/* Labor Costs */}
                {budgetResult && budgetResult.laborCost > 0 && (
                    <div className="budget-section">
                        <h4>👷 Mano de Obra</h4>
                        <div className="breakdown-list">
                            {budgetResult.breakdown.labor.radiatorInstallation.total > 0 && (
                                <div className="breakdown-item">
                                    <span className="breakdown-label">
                                        Instalación radiadores
                                        <small> ({budgetResult.breakdown.labor.radiatorInstallation.count} × ${budgetResult.breakdown.labor.radiatorInstallation.costPer.toLocaleString()})</small>
                                    </span>
                                    <span className="breakdown-cost">${budgetResult.breakdown.labor.radiatorInstallation.total.toLocaleString()}</span>
                                </div>
                            )}
                            {budgetResult.breakdown.labor.boilerInstallation.total > 0 && (
                                <div className="breakdown-item">
                                    <span className="breakdown-label">Instalación caldera</span>
                                    <span className="breakdown-cost">${budgetResult.breakdown.labor.boilerInstallation.total.toLocaleString()}</span>
                                </div>
                            )}
                            {budgetResult.breakdown.labor.pipingInstallation.total > 0 && (
                                <div className="breakdown-item">
                                    <span className="breakdown-label">
                                        Tendido tuberías
                                        <small> ({budgetResult.breakdown.labor.pipingInstallation.meters.toFixed(1)}m)</small>
                                    </span>
                                    <span className="breakdown-cost">${budgetResult.breakdown.labor.pipingInstallation.total.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="budget-footer">
                {/* Subtotals */}
                {budgetResult && (
                    <div className="subtotals">
                        <div className="subtotal-row">
                            <span>Materiales</span>
                            <span>${budgetResult.materialsCost.toLocaleString()}</span>
                        </div>
                        {budgetResult.laborCost > 0 && (
                            <div className="subtotal-row">
                                <span>Mano de obra</span>
                                <span>${budgetResult.laborCost.toLocaleString()}</span>
                            </div>
                        )}
                        {budgetResult.markupAmount > 0 && (
                            <div className="subtotal-row">
                                <span>Margen ({((budgetResult.markupAmount / budgetResult.materialsCost) * 100).toFixed(0)}%)</span>
                                <span>${budgetResult.markupAmount.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                )}
                <div className="total-row">
                    <span className="total-label">TOTAL ESTIMADO</span>
                    <span className="total-amount">${budgetResult ? budgetResult.totalCost.toLocaleString() : 0}</span>
                </div>
                <button className="download-btn" onClick={handleDownloadPDF} disabled={!budgetResult}>
                    📄 Descargar Presupuesto PDF
                </button>
                <button className="floorplan-btn" onClick={handleDownloadFloorPlan}>
                    📐 Exportar Plano Técnico A4
                </button>
            </div>
        </div>
    );
};
