import React from 'react';
import { useElementsStore } from '../../store/useElementsStore';
import './FloorSelector.css';

export const FloorSelector: React.FC = () => {
  const { currentFloor, setCurrentFloor } = useElementsStore();

  return (
    <div className="floor-selector">
      <button
        type="button"
        className={currentFloor === 'ground' ? 'active' : ''}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentFloor('ground'); }}
        title="Planta Baja"
      >
        PB
      </button>
      <button
        type="button"
        className={currentFloor === 'first' ? 'active' : ''}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentFloor('first'); }}
        title="Planta Alta (1er Piso)"
      >
        P1
      </button>
    </div>
  );
};
