import { useState } from 'react';
import { usePriceStore } from '../../store/usePriceStore';
import { CATALOG } from '../../data/catalog';
import './PriceConfigPanel.css';

interface PriceConfigPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PriceConfigPanel = ({ isOpen, onClose }: PriceConfigPanelProps) => {
    const {
        prices,
        lastUpdated,
        updateRadiatorPrice,
        updateBoilerPrice,
        updatePipePrice,
        updateAccessoryPrice,
        updateLaborCosts,
        updateMarkup,
        resetToDefaults,
    } = usePriceStore();

    const [activeTab, setActiveTab] = useState<'materials' | 'labor'>('materials');

    if (!isOpen) return null;

    const handlePriceChange = (
        type: 'radiator' | 'boiler' | 'pipe' | 'accessory',
        id: string | number,
        value: string
    ) => {
        const numValue = parseFloat(value) || 0;
        switch (type) {
            case 'radiator':
                updateRadiatorPrice(id as string, numValue);
                break;
            case 'boiler':
                updateBoilerPrice(id as string, numValue);
                break;
            case 'pipe':
                updatePipePrice(id as number, numValue);
                break;
            case 'accessory':
                updateAccessoryPrice(id as string, numValue);
                break;
        }
    };

    return (
        <div className="price-config-overlay" onClick={onClose}>
            <div className="price-config-panel" onClick={(e) => e.stopPropagation()}>
                <div className="price-config-header">
                    <h2>💰 Configuración de Precios</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="price-config-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
                        onClick={() => setActiveTab('materials')}
                    >
                        📦 Materiales
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'labor' ? 'active' : ''}`}
                        onClick={() => setActiveTab('labor')}
                    >
                        👷 Mano de Obra
                    </button>
                </div>

                <div className="price-config-content">
                    {activeTab === 'materials' && (
                        <>
                            {/* Radiadores */}
                            <section className="price-section">
                                <h3>🔥 Radiadores (precio por elemento)</h3>
                                <div className="price-grid">
                                    {CATALOG.radiators.map((radiator) => (
                                        <div key={radiator.id} className="price-item">
                                            <label>
                                                {radiator.brand} {radiator.model}
                                                <span className="price-hint">{radiator.powerKcal} Kcal/h</span>
                                            </label>
                                            <div className="price-input-wrapper">
                                                <span className="currency-symbol">$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="100"
                                                    value={prices.radiators[radiator.id] || ''}
                                                    onChange={(e) => handlePriceChange('radiator', radiator.id, e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Calderas */}
                            <section className="price-section">
                                <h3>🏭 Calderas (precio por unidad)</h3>
                                <div className="price-grid">
                                    {CATALOG.boilers.map((boiler) => (
                                        <div key={boiler.id} className="price-item">
                                            <label>
                                                {boiler.brand} {boiler.model}
                                                <span className="price-hint">{boiler.maxPowerKw} kW</span>
                                            </label>
                                            <div className="price-input-wrapper">
                                                <span className="currency-symbol">$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    value={prices.boilers[boiler.id] || ''}
                                                    onChange={(e) => handlePriceChange('boiler', boiler.id, e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Tuberías */}
                            <section className="price-section">
                                <h3>🔧 Tuberías PE-X (precio por metro)</h3>
                                <div className="price-grid">
                                    {Object.keys(prices.pipes).map((diameter) => (
                                        <div key={diameter} className="price-item">
                                            <label>
                                                Tubo PE-X Ø{diameter}mm
                                            </label>
                                            <div className="price-input-wrapper">
                                                <span className="currency-symbol">$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="10"
                                                    value={prices.pipes[parseInt(diameter)] || ''}
                                                    onChange={(e) => handlePriceChange('pipe', parseInt(diameter), e.target.value)}
                                                    placeholder="0"
                                                />
                                                <span className="unit">/m</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Accesorios */}
                            <section className="price-section">
                                <h3>🔩 Accesorios</h3>
                                <div className="price-grid">
                                    {CATALOG.accessories.map((acc) => (
                                        <div key={acc.id} className="price-item">
                                            <label>{acc.name}</label>
                                            <div className="price-input-wrapper">
                                                <span className="currency-symbol">$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="100"
                                                    value={prices.accessories[acc.id] || ''}
                                                    onChange={(e) => handlePriceChange('accessory', acc.id, e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'labor' && (
                        <>
                            <section className="price-section">
                                <h3>👷 Costos de Mano de Obra</h3>
                                <div className="price-grid">
                                    <div className="price-item">
                                        <label>
                                            Instalación de Radiador
                                            <span className="price-hint">por radiador</span>
                                        </label>
                                        <div className="price-input-wrapper">
                                            <span className="currency-symbol">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="500"
                                                value={prices.labor.radiatorInstallation || ''}
                                                onChange={(e) => updateLaborCosts({ radiatorInstallation: parseFloat(e.target.value) || 0 })}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="price-item">
                                        <label>
                                            Instalación de Caldera
                                            <span className="price-hint">por caldera</span>
                                        </label>
                                        <div className="price-input-wrapper">
                                            <span className="currency-symbol">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                value={prices.labor.boilerInstallation || ''}
                                                onChange={(e) => updateLaborCosts({ boilerInstallation: parseFloat(e.target.value) || 0 })}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="price-item">
                                        <label>
                                            Tendido de Tuberías
                                            <span className="price-hint">por metro</span>
                                        </label>
                                        <div className="price-input-wrapper">
                                            <span className="currency-symbol">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="50"
                                                value={prices.labor.pipingPerMeter || ''}
                                                onChange={(e) => updateLaborCosts({ pipingPerMeter: parseFloat(e.target.value) || 0 })}
                                                placeholder="0"
                                            />
                                            <span className="unit">/m</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="price-section">
                                <h3>📈 Margen de Ganancia</h3>
                                <div className="price-grid">
                                    <div className="price-item markup-item">
                                        <label>
                                            Porcentaje de recargo
                                            <span className="price-hint">Se aplica sobre el total de materiales</span>
                                        </label>
                                        <div className="price-input-wrapper">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="1"
                                                value={prices.markupPercent || ''}
                                                onChange={(e) => updateMarkup(parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                            />
                                            <span className="unit">%</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>

                <div className="price-config-footer">
                    {lastUpdated && (
                        <span className="last-updated">
                            Última actualización: {new Date(lastUpdated).toLocaleDateString('es-AR')}
                        </span>
                    )}
                    <div className="footer-buttons">
                        <button className="reset-btn" onClick={() => {
                            if (confirm('¿Resetear todos los precios a 0?')) {
                                resetToDefaults();
                            }
                        }}>
                            🔄 Resetear
                        </button>
                        <button className="save-btn" onClick={onClose}>
                            ✅ Guardar y Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
