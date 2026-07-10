import { create } from 'zustand';
import { useElementsStore } from './useElementsStore';

type Tool = 'select' | 'radiator' | 'boiler' | 'vertical-pipe' | 'floor-heating-zone' | 'manifold';

// Capas visuales del canvas, estilo AutoCAD: se prenden/apagan sin afectar
// los datos. 'plano' es la imagen de fondo, 'circuitos' los serpentines Ø20
// con sus acometidas, 'montantes' la primaria Ø32 caldera→colector (la capa
// física inferior: va por el contrapiso, debajo de las placas).
export type CanvasLayer = 'plano' | 'circuitos' | 'montantes';

interface ToolsStore {
  tool: Tool;
  isBudgetPanelOpen: boolean;
  visibleLayers: Record<CanvasLayer, boolean>;
  setTool: (tool: Tool) => void;
  setBudgetPanelOpen: (isOpen: boolean) => void;
  toggleLayer: (layer: CanvasLayer) => void;
}

export const useToolsStore = create<ToolsStore>((set) => ({
  tool: 'select',
  isBudgetPanelOpen: false,
  visibleLayers: { plano: true, circuitos: true, montantes: true },

  setTool: (tool) => {
    // Cancelar tubería temporal si existe al cambiar de herramienta
    const elementsStore = useElementsStore.getState();
    if (elementsStore.tempPipe) {
      elementsStore.cancelPipe(elementsStore.tempPipe.id);
    }

    set({ tool });
  },

  setBudgetPanelOpen: (isOpen) => set({ isBudgetPanelOpen: isOpen }),

  toggleLayer: (layer) => set((state) => ({
    visibleLayers: { ...state.visibleLayers, [layer]: !state.visibleLayers[layer] },
  })),
}));
