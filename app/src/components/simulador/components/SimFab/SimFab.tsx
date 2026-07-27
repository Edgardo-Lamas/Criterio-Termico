import React from 'react';
import { useToolsStore } from '../../store/useToolsStore';
import styles from './SimFab.module.css';

interface SimFabProps {
    /** Posición en la columna superior derecha: 0 arriba, 1 debajo. */
    slot: 0 | 1;
    /** Emoji identificatorio del panel que abre. */
    icon: string;
    /** Texto visible: el mismo título que tiene el panel, para que se
     *  entienda qué abre sin tener que probarlo. */
    label: string;
    /** Descripción larga para el tooltip del navegador. */
    title: string;
    variant: 'config' | 'power';
    onClick: () => void;
}

export const SimFab: React.FC<SimFabProps> = ({ slot, icon, label, title, variant, onClick }) => {
    // Los botones se corren juntos según lo que haya abierto, así la pila no
    // se rompe y ninguno queda tapado. Un botón solo se renderiza cuando su
    // panel está plegado, así que `openSidePanel` acá es siempre el otro.
    const isBudgetPanelOpen = useToolsStore(state => state.isBudgetPanelOpen);
    const isSidePanelOpen = useToolsStore(state => state.openSidePanel !== null);

    const shift = isBudgetPanelOpen && isSidePanelOpen ? styles.shiftedBoth
        : isBudgetPanelOpen ? styles.shiftedBudget
            : isSidePanelOpen ? styles.shiftedPanel
                : '';

    const className = [
        styles.fab,
        slot === 0 ? styles.slot0 : styles.slot1,
        styles[variant],
        shift
    ].filter(Boolean).join(' ');

    return (
        <button className={className} onClick={onClick} title={title}>
            <span className={styles.icon} aria-hidden="true">{icon}</span>
            {label}
        </button>
    );
};
