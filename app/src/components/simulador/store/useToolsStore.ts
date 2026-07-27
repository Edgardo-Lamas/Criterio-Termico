import { create } from 'zustand';
import { useElementsStore } from './useElementsStore';

type Tool = 'select' | 'radiator' | 'boiler' | 'vertical-pipe' | 'floor-heating-zone' | 'manifold' | 'room-rect';

// Capas visuales del canvas, estilo AutoCAD: se prenden/apagan sin afectar
// los datos. 'plano' es la imagen de fondo, 'circuitos' los serpentines Ø20
// con sus acometidas, 'montantes' la primaria Ø32 caldera→colector (la capa
// física inferior: va por el contrapiso, debajo de las placas).
export type CanvasLayer = 'plano' | 'circuitos' | 'montantes';

// Los paneles de la columna superior derecha comparten el mismo lugar sobre el
// canvas, así que solo uno puede estar abierto a la vez: abrir uno cierra el
// otro. `null` = los dos plegados, con sus botones a la vista.
export type SidePanel = 'config' | 'power';

interface ToolsStore {
  tool: Tool;
  isBudgetPanelOpen: boolean;
  openSidePanel: SidePanel | null;
  visibleLayers: Record<CanvasLayer, boolean>;
  // Habitación a la que se le está marcando el contorno sobre el plano
  // (herramienta 'room-rect', se dispara desde el RoomPanel)
  roomBoundsTargetId: string | null;
  setTool: (tool: Tool) => void;
  setBudgetPanelOpen: (isOpen: boolean) => void;
  setOpenSidePanel: (panel: SidePanel | null) => void;
  toggleLayer: (layer: CanvasLayer) => void;
  setRoomBoundsTarget: (roomId: string | null) => void;
}

export const useToolsStore = create<ToolsStore>((set) => ({
  tool: 'select',
  isBudgetPanelOpen: false,
  // El de potencia arranca abierto: es el primer paso del orden de diseño
  openSidePanel: 'power',
  visibleLayers: { plano: true, circuitos: true, montantes: true },
  roomBoundsTargetId: null,

  setTool: (tool) => {
    // Cancelar tubería temporal si existe al cambiar de herramienta
    const elementsStore = useElementsStore.getState();
    if (elementsStore.tempPipe) {
      elementsStore.cancelPipe(elementsStore.tempPipe.id);
    }

    set({ tool });
  },

  setBudgetPanelOpen: (isOpen) => set({ isBudgetPanelOpen: isOpen }),

  setOpenSidePanel: (panel) => set({ openSidePanel: panel }),

  toggleLayer: (layer) => set((state) => ({
    visibleLayers: { ...state.visibleLayers, [layer]: !state.visibleLayers[layer] },
  })),

  setRoomBoundsTarget: (roomId) => set({
    roomBoundsTargetId: roomId,
    tool: roomId ? 'room-rect' : 'select',
  }),
}));
