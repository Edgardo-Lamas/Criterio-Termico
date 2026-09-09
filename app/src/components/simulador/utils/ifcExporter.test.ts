import { describe, it, expect } from 'vitest';
import { IFCExporter } from './ifcExporter';
import { PIXELS_PER_METER } from './floorHeating';
import type { Boiler } from '../models/Boiler';
import type { Radiator } from '../models/Radiator';
import type { PipeSegment } from '../models/PipeSegment';

/**
 * Estos casos existen porque los cinco errores que arreglaron el exportador el
 * 2026-09-08 NO daban error: el archivo se generaba, se descargaba y recién se
 * notaba al abrirlo en un visor —y algunos ni ahí—. Un IFC roto es silencioso.
 */

// 200 px con la escala del simulador (50 px/m) = 4 m.
const boiler: Boiler = {
    id: 'b1', type: 'boiler', x: 200, y: 300, power: 22826,
    width: 40, height: 25, floor: 'ground',
};

const radiator: Radiator = {
    id: 'r1', type: 'radiator', x: 100, y: 150, power: 2400,
    width: 60, height: 10, floor: 'ground',
    elementos: 12, alturaElementoMm: 500,
};

const pipe: PipeSegment = {
    id: 'p1', type: 'pipe', pipeType: 'supply',
    points: [{ x: 0, y: 0 }, { x: 500, y: 0 }],
    diameter: 20, material: 'PEX', floor: 'ground',
};

function exportar(): string {
    return new IFCExporter('Prueba', 'Sistema de calefacción', 'Usuario', 'API Calefacción')
        .exportProject([boiler], [pipe], [radiator]);
}

/** Cuenta cuántas veces aparece una entidad IFC en el archivo. */
function contar(ifc: string, entidad: string): number {
    return (ifc.match(new RegExp(`=${entidad}\\(`, 'g')) ?? []).length;
}

describe('exportador IFC', () => {
    it('declara el esquema que realmente escribe', () => {
        const ifc = exportar();
        // IfcBoiler, IfcPipeSegment e IfcSpaceHeater NO existen en IFC2X3:
        // declarar 2X3 hacía que Revit o Solibri pudieran descartarlos.
        expect(ifc).toContain("FILE_SCHEMA(('IFC4'))");
        expect(ifc).not.toContain('IFC2X3');
    });

    it('arma una sola raíz de proyecto', () => {
        const ifc = exportar();
        // Salían dos de cada uno porque setupProject() corría dos veces.
        expect(contar(ifc, 'IFCPROJECT')).toBe(1);
        expect(contar(ifc, 'IFCSITE')).toBe(1);
        expect(contar(ifc, 'IFCBUILDING')).toBe(1);
        expect(contar(ifc, 'IFCBUILDINGSTOREY')).toBe(2); // planta baja y alta
        expect(contar(ifc, 'IFCOWNERHISTORY')).toBe(1);
    });

    it('exporta los radiadores, no sólo la caldera y los caños', () => {
        const ifc = exportar();
        expect(contar(ifc, 'IFCSPACEHEATER')).toBe(1);
        expect(ifc).toContain('.RADIATOR.');
        // La batería viaja como propiedad, no sólo en el nombre.
        expect(ifc).toContain("IFCPROPERTYSINGLEVALUE('Elementos'");
        expect(ifc).toContain("IFCPROPERTYSINGLEVALUE('AlturaElemento'");
    });

    it('usa la escala del simulador y no una copia vieja', () => {
        const ifc = exportar();
        // El caño va de x=0 a x=500 px. Con los 50 px/m del simulador son 10 m;
        // con los 100 px/m que tenía escritos a mano daban 5.
        expect(PIXELS_PER_METER).toBe(50);
        expect(ifc).toContain('IFCCARTESIANPOINT((10.000000,0.000000,0.050000))');
    });

    it('deja la caldera donde el usuario la puso, no al doble', () => {
        const ifc = exportar();
        // (200, 300) px ÷ 50 = (4, 6) m. El punto tiene que aparecer UNA vez
        // como posición del objeto; el sólido va en el origen local.
        expect(ifc).toContain('IFCCARTESIANPOINT((4.000000,6.000000,0.000000))');
        expect(ifc).not.toContain('IFCCARTESIANPOINT((8.000000,12.000000,0.000000))');
    });

    it('levanta el radiador del piso los 15 cm que pide la convección', () => {
        const ifc = exportar();
        // (100, 150) px ÷ 50 = (2, 3) m, y z = 0,15: el radiador necesita esa
        // separación para que le entre el aire frío por abajo. Apoyado en el
        // piso pierde entre 20% y 30% de su potencia efectiva, y el archivo
        // estaría mostrando una instalación que en obra rinde de menos.
        expect(ifc).toContain('IFCCARTESIANPOINT((2.000000,3.000000,0.150000))');
        expect(ifc).not.toContain('IFCCARTESIANPOINT((2.000000,3.000000,0.000000))');
    });

    it('le da cuerpo a los caños, además del eje', () => {
        const ifc = exportar();
        // Un caño de 20 mm exterior es un disco de 0,01 m de radio barrido a lo
        // largo de la polilínea. Sin esto el visor no dibuja ninguna cañería.
        expect(ifc).toMatch(/IFCSWEPTDISKSOLID\(#\d+,0\.010000,\$,\$,\$\)/);
        expect(ifc).toContain("'Body','AdvancedSweptSolid'");
        expect(ifc).toContain("'Axis','Curve3D'");
    });

    it('no repite el andamiaje si se exporta dos veces con el mismo objeto', () => {
        const exporter = new IFCExporter('Prueba', 'Sistema', 'Usuario', 'App');
        exporter.exportProject([boiler], [pipe], [radiator]);
        const segundo = exporter.exportProject([boiler], [pipe], [radiator]);
        expect(contar(segundo, 'IFCPROJECT')).toBe(1);
        expect(contar(segundo, 'IFCSPACEHEATER')).toBe(1);
    });
});
