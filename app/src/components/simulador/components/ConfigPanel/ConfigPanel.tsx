import React, { useState, useRef } from 'react';
import { useCompanyStore } from '../../stores/companyStore';
import './ConfigPanel.css';

export const ConfigPanel: React.FC = () => {
  const {
    companyDetails,
    clientDetails,
    updateCompanyInfo,
    updateClientInfo,
    resetCompanyInfo,
    resetClientInfo
  } = useCompanyStore();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<'empresa' | 'cliente'>('empresa');
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes (PNG, JPG, JPEG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string;
      updateCompanyInfo({ logo: imageDataUrl });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleResetCompany = () => {
    if (confirm('¿Eliminar todos los datos de la empresa? Esta acción no se puede deshacer.')) {
      resetCompanyInfo();
    }
  };

  const handleResetClient = () => {
    if (confirm('¿Eliminar los datos del cliente actual?')) {
      resetClientInfo();
    }
  };

  if (isCollapsed) {
    return (
      <button
        className="config-toggle-button"
        onClick={() => setIsCollapsed(false)}
        title="Configuración de Empresa y Cliente"
      >
        ⚙️
      </button>
    );
  }

  return (
    <div className="config-panel">
      <div className="config-header">
        <h3>⚙️ Configuración</h3>
        <button className="config-close-btn" onClick={() => setIsCollapsed(true)}>✕</button>
      </div>

      {/* Tabs */}
      <div className="config-tabs">
        <button
          className={`config-tab ${activeTab === 'empresa' ? 'active' : ''}`}
          onClick={() => setActiveTab('empresa')}
        >
          🏢 Mi Empresa
        </button>
        <button
          className={`config-tab ${activeTab === 'cliente' ? 'active' : ''}`}
          onClick={() => setActiveTab('cliente')}
        >
          👤 Cliente
        </button>
      </div>

      <div className="config-content">
        {/* EMPRESA TAB */}
        {activeTab === 'empresa' && (
          <>
            <p className="config-description">
              Estos datos aparecerán en todos tus presupuestos.
            </p>

            {/* Logo Upload */}
            <div className="config-section logo-section">
              <label>Logo de la Empresa</label>
              <div className="logo-preview-container">
                {companyDetails.logo ? (
                  <div className="logo-preview">
                    <img src={companyDetails.logo} alt="Logo" />
                    <button
                      className="remove-logo-btn"
                      onClick={() => updateCompanyInfo({ logo: '' })}
                      title="Quitar logo"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    className="logo-placeholder"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <span>📷</span>
                    <small>Subir logo</small>
                  </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
              />
              {!companyDetails.logo && (
                <button
                  className="upload-btn"
                  onClick={() => logoInputRef.current?.click()}
                >
                  📁 Seleccionar imagen
                </button>
              )}
            </div>

            <div className="config-section">
              <label>Nombre de la Empresa</label>
              <input
                type="text"
                value={companyDetails.companyName}
                onChange={(e) => updateCompanyInfo({ companyName: e.target.value })}
                placeholder="Ej: Instalaciones García"
              />
            </div>

            <div className="config-section">
              <label>Teléfono</label>
              <input
                type="text"
                value={companyDetails.phone}
                onChange={(e) => updateCompanyInfo({ phone: e.target.value })}
                placeholder="Ej: +54 11 1234-5678"
              />
            </div>

            <div className="config-section">
              <label>Email</label>
              <input
                type="email"
                value={companyDetails.email}
                onChange={(e) => updateCompanyInfo({ email: e.target.value })}
                placeholder="Ej: contacto@miempresa.com"
              />
            </div>

            <div className="config-section">
              <label>Dirección</label>
              <input
                type="text"
                value={companyDetails.address}
                onChange={(e) => updateCompanyInfo({ address: e.target.value })}
                placeholder="Ej: Av. Principal 123, Ciudad"
              />
            </div>

            <div className="config-section">
              <label>Sitio Web</label>
              <input
                type="text"
                value={companyDetails.website}
                onChange={(e) => updateCompanyInfo({ website: e.target.value })}
                placeholder="Ej: www.miempresa.com"
              />
            </div>

            <div className="config-actions">
              <button className="reset-btn" onClick={handleResetCompany}>
                🧹 Limpiar datos
              </button>
            </div>
          </>
        )}

        {/* CLIENTE TAB */}
        {activeTab === 'cliente' && (
          <>
            <p className="config-description">
              Datos del cliente para este presupuesto.
            </p>

            <div className="config-section">
              <label>Nombre del Cliente</label>
              <input
                type="text"
                value={clientDetails.name}
                onChange={(e) => updateClientInfo({ name: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div className="config-section">
              <label>Teléfono</label>
              <input
                type="text"
                value={clientDetails.phone}
                onChange={(e) => updateClientInfo({ phone: e.target.value })}
                placeholder="Ej: +54 11 9876-5432"
              />
            </div>

            <div className="config-section">
              <label>Email</label>
              <input
                type="email"
                value={clientDetails.email}
                onChange={(e) => updateClientInfo({ email: e.target.value })}
                placeholder="Ej: cliente@email.com"
              />
            </div>

            <div className="config-section">
              <label>Nombre del Proyecto</label>
              <input
                type="text"
                value={clientDetails.projectName}
                onChange={(e) => updateClientInfo({ projectName: e.target.value })}
                placeholder="Ej: Casa de Campo"
              />
            </div>

            <div className="config-actions">
              <button className="reset-btn" onClick={handleResetClient}>
                🧹 Limpiar datos del cliente
              </button>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="config-section save-section">
          <button
            className={`save-button ${saved ? 'saved' : ''}`}
            onClick={handleSave}
          >
            {saved ? '✓ Guardado' : '💾 Guardar Cambios'}
          </button>
        </div>

        <div className="config-section">
          <p className="privacy-note">
            <small>🔒 Tus datos se guardan localmente en tu navegador.</small>
          </p>
        </div>
      </div>
    </div>
  );
};
