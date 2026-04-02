import { useState, useCallback } from 'react';
import type { RefObject } from 'react';

interface Point {
    x: number;
    y: number;
}

interface Dimensions {
    width: number;
    height: number;
}

interface UseCanvasZoomOptions {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    backgroundImageDimensions: Dimensions | null;
    currentFloorRadiators: Array<{ x: number; y: number; width: number; height: number }>;
    currentFloorBoilers: Array<{ x: number; y: number; width: number; height: number }>;
    currentFloorPipes: Array<{ points: Point[] }>;
    isDragging: boolean;
}

interface UseCanvasZoomReturn {
    // State
    zoom: number;
    panOffset: Point;
    isPanning: boolean;
    lastPanPoint: Point;
    lastTouchDistance: number | null;

    // Setters (needed for integration with other handlers)
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    setPanOffset: React.Dispatch<React.SetStateAction<Point>>;
    setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
    setLastPanPoint: React.Dispatch<React.SetStateAction<Point>>;
    setLastTouchDistance: React.Dispatch<React.SetStateAction<number | null>>;

    // Button handlers
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleResetZoom: () => void;
    handleFitAll: () => void;

    // Touch handlers
    getTouchDistance: (touch1: React.Touch, touch2: React.Touch) => number;
    handleTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    handleTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    handleTouchEnd: (e: React.TouchEvent<HTMLCanvasElement>) => void;

    // Wheel handler
    handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
}

/**
 * Custom hook for canvas zoom and pan functionality
 * Extracted from Canvas.tsx to improve maintainability
 */
export function useCanvasZoom({
    canvasRef,
    backgroundImageDimensions,
    currentFloorRadiators,
    currentFloorBoilers,
    currentFloorPipes,
    isDragging,
}: UseCanvasZoomOptions): UseCanvasZoomReturn {

    // State
    const [zoom, setZoom] = useState(1);
    const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

    // Button handlers
    const handleZoomIn = useCallback(() => {
        setZoom(prevZoom => Math.min(prevZoom * 1.2, 5)); // Max zoom 5x
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(prevZoom => Math.max(prevZoom / 1.2, 0.1)); // Min zoom 0.1x
    }, []);

    // Center content at specified zoom level
    const centerContent = useCallback((targetZoom: number = 1) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;

        if (backgroundImageDimensions) {
            const imgWidth = backgroundImageDimensions.width;
            const imgHeight = backgroundImageDimensions.height;

            const newPanX = (canvasWidth - imgWidth * targetZoom) / 2;
            const newPanY = (canvasHeight - imgHeight * targetZoom) / 2;

            setZoom(targetZoom);
            setPanOffset({ x: newPanX, y: newPanY });
        } else {
            setZoom(targetZoom);
            setPanOffset({ x: canvasWidth / 2, y: canvasHeight / 2 });
        }
    }, [canvasRef, backgroundImageDimensions]);

    const handleResetZoom = useCallback(() => {
        centerContent(1);
    }, [centerContent]);

    // Fit all elements in view
    const handleFitAll = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;

        // If there's a background image, use it as main reference
        if (backgroundImageDimensions) {
            const imgWidth = backgroundImageDimensions.width;
            const imgHeight = backgroundImageDimensions.height;

            const margin = 40;
            const zoomX = (canvasWidth - margin * 2) / imgWidth;
            const zoomY = (canvasHeight - margin * 2) / imgHeight;
            const newZoom = Math.min(zoomX, zoomY, 2);

            const newPanX = (canvasWidth - imgWidth * newZoom) / 2;
            const newPanY = (canvasHeight - imgHeight * newZoom) / 2;

            setZoom(newZoom);
            setPanOffset({ x: newPanX, y: newPanY });
            return;
        }

        // If no image but has elements, fit to elements
        if (currentFloorRadiators.length === 0 && currentFloorBoilers.length === 0 && currentFloorPipes.length === 0) {
            centerContent(1);
            return;
        }

        // Calculate bounding box of all elements
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        currentFloorRadiators.forEach(rad => {
            minX = Math.min(minX, rad.x);
            minY = Math.min(minY, rad.y);
            maxX = Math.max(maxX, rad.x + rad.width);
            maxY = Math.max(maxY, rad.y + rad.height);
        });

        currentFloorBoilers.forEach(boiler => {
            minX = Math.min(minX, boiler.x);
            minY = Math.min(minY, boiler.y);
            maxX = Math.max(maxX, boiler.x + boiler.width);
            maxY = Math.max(maxY, boiler.y + boiler.height);
        });

        currentFloorPipes.forEach(pipe => {
            pipe.points.forEach(point => {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            });
        });

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const contentCenterX = minX + contentWidth / 2;
        const contentCenterY = minY + contentHeight / 2;

        const margin = 50;
        const zoomX = (canvasWidth - margin * 2) / contentWidth;
        const zoomY = (canvasHeight - margin * 2) / contentHeight;
        const newZoom = Math.min(zoomX, zoomY, 5);

        const newPanX = canvasWidth / 2 - contentCenterX * newZoom;
        const newPanY = canvasHeight / 2 - contentCenterY * newZoom;

        setZoom(newZoom);
        setPanOffset({ x: newPanX, y: newPanY });
    }, [canvasRef, backgroundImageDimensions, currentFloorRadiators, currentFloorBoilers, currentFloorPipes, centerContent]);

    // Touch distance calculation
    const getTouchDistance = useCallback((touch1: React.Touch, touch2: React.Touch): number => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }, []);

    // Touch start handler
    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 2) {
            const distance = getTouchDistance(e.touches[0], e.touches[1]);
            setLastTouchDistance(distance);
            setIsPanning(true);
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            setLastPanPoint({ x: midX, y: midY });
            e.preventDefault();
        } else if (e.touches.length === 1) {
            setLastPanPoint({
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            });
        }
    }, [getTouchDistance]);

    // Touch move handler
    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 2) {
            if (lastTouchDistance !== null) {
                const distance = getTouchDistance(e.touches[0], e.touches[1]);
                const scale = distance / lastTouchDistance;
                setZoom(prevZoom => Math.max(0.1, Math.min(5, prevZoom * scale)));
                setLastTouchDistance(distance);
            }

            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const dx = midX - lastPanPoint.x;
            const dy = midY - lastPanPoint.y;

            setPanOffset(prev => ({
                x: prev.x + dx,
                y: prev.y + dy
            }));

            setLastPanPoint({ x: midX, y: midY });
            e.preventDefault();
        } else if (e.touches.length === 1 && !isDragging) {
            const touch = e.touches[0];
            const dx = touch.clientX - lastPanPoint.x;
            const dy = touch.clientY - lastPanPoint.y;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                setIsPanning(true);
                setPanOffset(prev => ({
                    x: prev.x + dx,
                    y: prev.y + dy
                }));
            }

            setLastPanPoint({
                x: touch.clientX,
                y: touch.clientY
            });
        }
    }, [lastTouchDistance, lastPanPoint, isDragging, getTouchDistance]);

    // Touch end handler
    const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length < 2) {
            setLastTouchDistance(null);
        }
        if (e.touches.length === 0) {
            setIsPanning(false);
        }
    }, []);

    // Wheel handler for zoom
    const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        setZoom(prevZoom => Math.max(0.1, Math.min(5, prevZoom * (1 + delta))));
    }, []);

    return {
        // State
        zoom,
        panOffset,
        isPanning,
        lastPanPoint,
        lastTouchDistance,

        // Setters
        setZoom,
        setPanOffset,
        setIsPanning,
        setLastPanPoint,
        setLastTouchDistance,

        // Button handlers
        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        handleFitAll,

        // Touch handlers
        getTouchDistance,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,

        // Wheel handler
        handleWheel,
    };
}
