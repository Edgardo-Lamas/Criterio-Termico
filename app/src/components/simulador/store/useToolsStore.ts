import { create } from 'zustand';
import { useElementsStore } from './useElementsStore';

type Tool = 'select' | 'radiator' | 'boiler' | 'vertical-pipe' | 'floor-heating-zone' | 'manifold';

interface ToolsStore {
  tool: Tool;
  isBudgetPanelOpen: boolean;
  setTool: (tool: Tool) => void;
  setBudgetPanelOpen: (isOpen: boolean) => void;
}

export const useToolsStore = create<ToolsStore>((set) => ({
  tool: 'select',
  isBudgetPanelOpen: false,

  setTool: (tool) => {
    // Cancelar tubería temporal si existe al cambiar de herramienta
    const elementsStore = useElementsStore.getState();
    if (elementsStore.tempPipe) {
      console.log('🧹 Limpiando tempPipe al cambiar herramienta');
      elementsStore.cancelPipe(elementsStore.tempPipe.id);
    }

    set({ tool });
    console.log('Herramienta cambiada a:', tool);
  },

  setBudgetPanelOpen: (isOpen) => set({ isBudgetPanelOpen: isOpen }),
}));
