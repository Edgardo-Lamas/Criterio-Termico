import React, { useEffect, useState } from 'react';
import { useLeadStore } from '../../store/useLeadStore';
import './BudgetCounter.css';

export const BudgetCounter: React.FC = () => {
    const { globalBudgetCount } = useLeadStore();
    const [displayCount, setDisplayCount] = useState(14000); // Start slightly lower for animation

    useEffect(() => {
        // Animate up to the global count
        let start = displayCount;
        const end = globalBudgetCount;
        if (start === end) return;

        const duration = 2000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const current = Math.floor(start + (end - start) * ease);
            setDisplayCount(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [globalBudgetCount]);

    return (
        <div className="budget-counter" title="Presupuestos generados por nuestra plataforma">
            <span className="counter-icon">🚀</span>
            <span className="counter-value">{displayCount.toLocaleString()}</span>
            <span className="counter-label">Proyectos Cotizados</span>
        </div>
    );
};
