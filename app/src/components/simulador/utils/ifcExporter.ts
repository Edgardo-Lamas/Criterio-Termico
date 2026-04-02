/**
 * Exportador IFC (Industry Foundation Classes) para Sistema de Calefacción
 * 
 * Este módulo genera archivos IFC 2x3 compatibles con:
 * - Autodesk Revit
 * - Graphisoft ArchiCAD
 * - Trimble Tekla
 * - Solibri
 * - Navisworks
 * - Cualquier visor IFC
 * 
 * Exporta:
 * - Tuberías de piso radiante (IfcPipeSegment)
 * - Colectores (IfcDistributionChamberElement)
 * - Calderas (IfcBoiler)
 * - Zonas/Espacios (IfcSpace)
 * - Conexiones y propiedades MEP
 */

import type { Boiler } from '../models/Boiler';
import type { PipeSegment } from '../models/PipeSegment';

// ============================================
// TIPOS Y CONSTANTES
// ============================================

interface IFCEntity {
  id: number;
  type: string;
  attributes: (string | number | null)[];
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Escala: convertir píxeles a metros
const PIXELS_TO_METERS = 0.01; // 100 píxeles = 1 metro

// Altura de elementos por defecto
const DEFAULT_PIPE_HEIGHT = 0.05; // 5cm sobre el suelo (piso radiante embebido)

const DEFAULT_BOILER_HEIGHT = 0; // En el suelo

// ============================================
// CLASE PRINCIPAL DEL EXPORTADOR
// ============================================

export class IFCExporter {
  private entities: IFCEntity[] = [];
  private currentId: number = 1;
  private projectId: number = 0;
  private siteId: number = 0;
  private buildingId: number = 0;
  private storeyGroundId: number = 0;
  private storeyFirstId: number = 0;
  private ownerHistoryId: number = 0;
  private contextId: number = 0;
  private context3DId: number = 0;

  // Datos del proyecto
  private projectName: string;
  private projectDescription: string;
  private authorName: string;
  private organizationName: string;
  private applicationName: string = 'API Calefaccion';
  private applicationVersion: string = '1.0.0';

  constructor(
    projectName: string = 'Proyecto de Calefacción',
    projectDescription: string = 'Sistema de piso radiante',
    authorName: string = 'Usuario',
    organizationName: string = 'API Calefaccion'
  ) {
    this.projectName = projectName;
    this.projectDescription = projectDescription;
    this.authorName = authorName;
    this.organizationName = organizationName;
  }

  // ============================================
  // GENERACIÓN DE IDs
  // ============================================

  private nextId(): number {
    return this.currentId++;
  }

  private generateGUID(): string {
    // Genera un GUID compatible con IFC (22 caracteres base64)
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';
    let guid = '';
    for (let i = 0; i < 22; i++) {
      guid += chars[Math.floor(Math.random() * 64)];
    }
    return guid;
  }

  // ============================================
  // HELPERS DE FORMATO IFC
  // ============================================

  private formatString(str: string): string {
    return `'${str.replace(/'/g, "''")}'`;
  }

  private formatReal(num: number): string {
    return num.toFixed(6);
  }

  private formatRef(id: number): string {
    return `#${id}`;
  }

  private formatList(items: string[]): string {
    return `(${items.join(',')})`;
  }

  private formatEnum(value: string): string {
    return `.${value}.`;
  }

  // ============================================
  // ENTIDADES BASE IFC
  // ============================================

  private addEntity(type: string, attributes: (string | number | null)[]): number {
    const id = this.nextId();
    this.entities.push({ id, type, attributes });
    return id;
  }

  private createCartesianPoint(x: number, y: number, z: number = 0): number {
    return this.addEntity('IFCCARTESIANPOINT', [
      this.formatList([this.formatReal(x), this.formatReal(y), this.formatReal(z)])
    ]);
  }

  private createDirection(x: number, y: number, z: number = 0): number {
    return this.addEntity('IFCDIRECTION', [
      this.formatList([this.formatReal(x), this.formatReal(y), this.formatReal(z)])
    ]);
  }

  private createAxis2Placement3D(
    location: number,
    axis?: number,
    refDirection?: number
  ): number {
    return this.addEntity('IFCAXIS2PLACEMENT3D', [
      this.formatRef(location),
      axis ? this.formatRef(axis) : '$',
      refDirection ? this.formatRef(refDirection) : '$'
    ]);
  }

  private createLocalPlacement(
    relativeTo: number | null,
    placement: number
  ): number {
    return this.addEntity('IFCLOCALPLACEMENT', [
      relativeTo ? this.formatRef(relativeTo) : '$',
      this.formatRef(placement)
    ]);
  }

  private createPolyline(points: number[]): number {
    return this.addEntity('IFCPOLYLINE', [
      this.formatList(points.map(p => this.formatRef(p)))
    ]);
  }



  private createExtrudedAreaSolid(
    profile: number,
    position: number,
    direction: number,
    depth: number
  ): number {
    return this.addEntity('IFCEXTRUDEDAREASOLID', [
      this.formatRef(profile),
      this.formatRef(position),
      this.formatRef(direction),
      this.formatReal(depth)
    ]);
  }

  private createShapeRepresentation(
    contextId: number,
    identifier: string,
    type: string,
    items: number[]
  ): number {
    return this.addEntity('IFCSHAPEREPRESENTATION', [
      this.formatRef(contextId),
      this.formatString(identifier),
      this.formatString(type),
      this.formatList(items.map(i => this.formatRef(i)))
    ]);
  }

  private createProductDefinitionShape(representations: number[]): number {
    return this.addEntity('IFCPRODUCTDEFINITIONSHAPE', [
      '$',
      '$',
      this.formatList(representations.map(r => this.formatRef(r)))
    ]);
  }

  // ============================================
  // PROPIEDADES
  // ============================================

  private createPropertySingleValue(
    name: string,
    value: string | number
  ): number {
    let formattedValue: string;
    if (typeof value === 'number') {
      formattedValue = `IFCREAL(${this.formatReal(value)})`;
    } else {
      formattedValue = `IFCTEXT(${this.formatString(value)})`;
    }

    return this.addEntity('IFCPROPERTYSINGLEVALUE', [
      this.formatString(name),
      '$',
      formattedValue,
      '$'
    ]);
  }

  private createPropertySet(
    name: string,
    properties: number[]
  ): number {
    return this.addEntity('IFCPROPERTYSET', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      this.formatString(name),
      '$',
      this.formatList(properties.map(p => this.formatRef(p)))
    ]);
  }

  private createRelDefinesByProperties(
    relatedObjects: number[],
    propertySet: number
  ): number {
    return this.addEntity('IFCRELDEFINESBYPROPERTIES', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      '$',
      '$',
      this.formatList(relatedObjects.map(o => this.formatRef(o))),
      this.formatRef(propertySet)
    ]);
  }

  // ============================================
  // SETUP DEL PROYECTO
  // ============================================

  private setupProject(): void {
    // Persona y organización
    const personId = this.addEntity('IFCPERSON', [
      '$', this.formatString(this.authorName), '$', '$', '$', '$', '$', '$'
    ]);

    const organizationId = this.addEntity('IFCORGANIZATION', [
      '$', this.formatString(this.organizationName), '$', '$', '$'
    ]);

    const personAndOrgId = this.addEntity('IFCPERSONANDORGANIZATION', [
      this.formatRef(personId),
      this.formatRef(organizationId),
      '$'
    ]);

    // Aplicación
    const applicationId = this.addEntity('IFCAPPLICATION', [
      this.formatRef(organizationId),
      this.formatString(this.applicationVersion),
      this.formatString(this.applicationName),
      this.formatString('APICalefaccion')
    ]);

    // Owner History
    const timestamp = Math.floor(Date.now() / 1000);
    this.ownerHistoryId = this.addEntity('IFCOWNERHISTORY', [
      this.formatRef(personAndOrgId),
      this.formatRef(applicationId),
      '$',
      this.formatEnum('READWRITE'),
      '$',
      '$',
      '$',
      timestamp.toString()
    ]);

    // Unidades
    const lengthUnitId = this.addEntity('IFCSIUNIT', [
      '*', this.formatEnum('LENGTHUNIT'), '$', this.formatEnum('METRE')
    ]);

    const areaUnitId = this.addEntity('IFCSIUNIT', [
      '*', this.formatEnum('AREAUNIT'), '$', this.formatEnum('SQUARE_METRE')
    ]);

    const volumeUnitId = this.addEntity('IFCSIUNIT', [
      '*', this.formatEnum('VOLUMEUNIT'), '$', this.formatEnum('CUBIC_METRE')
    ]);

    const powerUnitId = this.addEntity('IFCSIUNIT', [
      '*', this.formatEnum('POWERUNIT'), '$', this.formatEnum('WATT')
    ]);

    const thermodynamicTempUnitId = this.addEntity('IFCSIUNIT', [
      '*', this.formatEnum('THERMODYNAMICTEMPERATUREUNIT'), '$', this.formatEnum('KELVIN')
    ]);

    const unitAssignmentId = this.addEntity('IFCUNITASSIGNMENT', [
      this.formatList([
        this.formatRef(lengthUnitId),
        this.formatRef(areaUnitId),
        this.formatRef(volumeUnitId),
        this.formatRef(powerUnitId),
        this.formatRef(thermodynamicTempUnitId)
      ])
    ]);

    // Contexto geométrico
    const originPoint = this.createCartesianPoint(0, 0, 0);
    const zAxis = this.createDirection(0, 0, 1);
    const xAxis = this.createDirection(1, 0, 0);

    const worldCoordSystem = this.createAxis2Placement3D(originPoint, zAxis, xAxis);

    this.contextId = this.addEntity('IFCGEOMETRICREPRESENTATIONCONTEXT', [
      '$',
      this.formatString('Model'),
      '3',
      this.formatReal(1.0E-05),
      this.formatRef(worldCoordSystem),
      '$'
    ]);

    this.context3DId = this.addEntity('IFCGEOMETRICREPRESENTATIONSUBCONTEXT', [
      this.formatString('Body'),
      this.formatString('Model'),
      '*',
      '*',
      '*',
      '*',
      this.formatRef(this.contextId),
      '$',
      this.formatEnum('MODEL_VIEW'),
      '$'
    ]);

    // Proyecto
    this.projectId = this.addEntity('IFCPROJECT', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      this.formatString(this.projectName),
      this.formatString(this.projectDescription),
      '$',
      '$',
      '$',
      this.formatList([this.formatRef(this.contextId)]),
      this.formatRef(unitAssignmentId)
    ]);

    // Sitio
    const sitePlacement = this.createLocalPlacement(null, worldCoordSystem);
    this.siteId = this.addEntity('IFCSITE', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      this.formatString('Sitio'),
      '$',
      '$',
      this.formatRef(sitePlacement),
      '$',
      '$',
      this.formatEnum('ELEMENT'),
      '$', '$', '$', '$', '$'
    ]);

    // Edificio
    const buildingPlacement = this.createLocalPlacement(sitePlacement, worldCoordSystem);
    this.buildingId = this.addEntity('IFCBUILDING', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      this.formatString('Edificio'),
      '$',
      '$',
      this.formatRef(buildingPlacement),
      '$',
      '$',
      this.formatEnum('ELEMENT'),
      '$', '$', '$'
    ]);

    // Planta Baja (z=0)
    const groundFloorPoint = this.createCartesianPoint(0, 0, 0);
    const groundFloorPlacement = this.createAxis2Placement3D(groundFloorPoint, zAxis, xAxis);
    const groundFloorLocalPlacement = this.createLocalPlacement(buildingPlacement, groundFloorPlacement);

    this.storeyGroundId = this.addEntity('IFCBUILDINGSTOREY', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      this.formatString('Planta Baja'),
      '$',
      '$',
      this.formatRef(groundFloorLocalPlacement),
      '$',
      '$',
      this.formatEnum('ELEMENT'),
      this.formatReal(0)
    ]);

    // Planta Alta (z=2.8m)
    const firstFloorPoint = this.createCartesianPoint(0, 0, 2.8);
    const firstFloorPlacement = this.createAxis2Placement3D(firstFloorPoint, zAxis, xAxis);
    const firstFloorLocalPlacement = this.createLocalPlacement(buildingPlacement, firstFloorPlacement);

    this.storeyFirstId = this.addEntity('IFCBUILDINGSTOREY', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      this.formatString('Planta Alta'),
      '$',
      '$',
      this.formatRef(firstFloorLocalPlacement),
      '$',
      '$',
      this.formatEnum('ELEMENT'),
      this.formatReal(2.8)
    ]);

    // Relaciones de agregación
    this.addEntity('IFCRELAGGREGATES', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      '$', '$',
      this.formatRef(this.projectId),
      this.formatList([this.formatRef(this.siteId)])
    ]);

    this.addEntity('IFCRELAGGREGATES', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      '$', '$',
      this.formatRef(this.siteId),
      this.formatList([this.formatRef(this.buildingId)])
    ]);

    this.addEntity('IFCRELAGGREGATES', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      '$', '$',
      this.formatRef(this.buildingId),
      this.formatList([
        this.formatRef(this.storeyGroundId),
        this.formatRef(this.storeyFirstId)
      ])
    ]);
  }

  // ============================================
  // EXPORTAR ELEMENTOS
  // ============================================

  private getStoreyId(floor: 'ground' | 'first'): number {
    return floor === 'ground' ? this.storeyGroundId : this.storeyFirstId;
  }



  /**
   * Exporta una tubería de piso radiante
   */
  exportPipeSegment(
    pipe: PipeSegment,
    circuitLabel?: string
  ): number {
    const floor = pipe.floor as 'ground' | 'first';
    const storeyId = this.getStoreyId(floor);

    // Convertir puntos a metros
    const points3D: Point3D[] = pipe.points.map(p => ({
      x: p.x * PIXELS_TO_METERS,
      y: p.y * PIXELS_TO_METERS,
      z: DEFAULT_PIPE_HEIGHT
    }));

    // Crear polyline con los puntos
    const pointIds = points3D.map(p =>
      this.createCartesianPoint(p.x, p.y, p.z)
    );
    const polylineId = this.createPolyline(pointIds);

    // Perfil circular para la tubería
    const diameter = 'diameter' in pipe ? pipe.diameter : 20;

    // const profileId = this.createCircleProfile(radius); // Unused

    // Crear swept solid (tubería extruida a lo largo del path)
    // Nota: IFC usa IfcSweptDiskSolid para tuberías, pero simplificamos con representación de curva
    const curveRepId = this.createShapeRepresentation(
      this.context3DId,
      'Axis',
      'Curve3D',
      [polylineId]
    );

    const shapeId = this.createProductDefinitionShape([curveRepId]);

    // Placement
    const originPoint = this.createCartesianPoint(0, 0, 0);
    const zAxis = this.createDirection(0, 0, 1);
    const xAxis = this.createDirection(1, 0, 0);
    const placementAxis = this.createAxis2Placement3D(originPoint, zAxis, xAxis);
    const localPlacement = this.createLocalPlacement(null, placementAxis);

    // Crear el pipe segment
    const pipeType = 'pipeType' in pipe ? pipe.pipeType : 'supply';
    const pipeName = circuitLabel
      ? `Circuito ${circuitLabel} - ${pipeType === 'supply' ? 'IDA' : 'RETORNO'}`
      : `Tubería ${pipeType === 'supply' ? 'IDA' : 'RETORNO'}`;

    const pipeId = this.addEntity('IFCPIPESEGMENT', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      this.formatString(pipeName),
      '$',
      '$',
      this.formatRef(localPlacement),
      this.formatRef(shapeId),
      '$',
      this.formatEnum('USERDEFINED')
    ]);

    // Calcular longitud
    let length = 0;
    for (let i = 1; i < points3D.length; i++) {
      const dx = points3D[i].x - points3D[i - 1].x;
      const dy = points3D[i].y - points3D[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }

    // Propiedades
    const props = [
      this.createPropertySingleValue('Diámetro', diameter),
      this.createPropertySingleValue('DiámetroNominal', `DN${diameter}`),
      this.createPropertySingleValue('Material', 'PEX'),
      this.createPropertySingleValue('Longitud', length),
      this.createPropertySingleValue('TipoFlujo', pipeType === 'supply' ? 'Ida' : 'Retorno'),
      this.createPropertySingleValue('Sistema', 'Piso Radiante'),
    ];

    if (circuitLabel) {
      props.push(this.createPropertySingleValue('Circuito', circuitLabel));
    }

    const propSetId = this.createPropertySet('Pset_PipeSegmentCommon', props);
    this.createRelDefinesByProperties([pipeId], propSetId);

    // Contener en el storey
    this.addEntity('IFCRELCONTAINEDINSPATIALSTRUCTURE', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      '$', '$',
      this.formatList([this.formatRef(pipeId)]),
      this.formatRef(storeyId)
    ]);

    return pipeId;
  }



  /**
   * Exporta una caldera
   */
  exportBoiler(boiler: Boiler): number {
    const floor = (boiler as any).floor as 'ground' | 'first' || 'ground';
    const storeyId = this.getStoreyId(floor);

    // Posición en metros
    const x = boiler.x * PIXELS_TO_METERS;
    const y = boiler.y * PIXELS_TO_METERS;
    const z = DEFAULT_BOILER_HEIGHT;

    // Dimensiones en metros
    const width = boiler.width * PIXELS_TO_METERS;
    const height = boiler.height * PIXELS_TO_METERS;
    const depth = 0.6; // 60cm de profundidad (altura física de la caldera)

    // Crear representación
    const originPoint = this.createCartesianPoint(x, y, z);
    const zAxis = this.createDirection(0, 0, 1);
    const xAxis = this.createDirection(1, 0, 0);
    const placement = this.createAxis2Placement3D(originPoint, zAxis, xAxis);

    const rectProfile = this.addEntity('IFCRECTANGLEPROFILEDEF', [
      this.formatEnum('AREA'),
      '$',
      '$',
      this.formatReal(width),
      this.formatReal(height)
    ]);

    const extrudeDir = this.createDirection(0, 0, 1);
    const solidId = this.createExtrudedAreaSolid(rectProfile, placement, extrudeDir, depth);

    const bodyRep = this.createShapeRepresentation(
      this.context3DId,
      'Body',
      'SweptSolid',
      [solidId]
    );

    const shapeId = this.createProductDefinitionShape([bodyRep]);
    const localPlacement = this.createLocalPlacement(null, placement);

    // Potencia en kW
    const powerKW = boiler.power / 860; // Kcal/h a kW

    // Crear el boiler
    const boilerId = this.addEntity('IFCBOILER', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      this.formatString('Caldera'),
      this.formatString(`Caldera ${powerKW.toFixed(1)} kW`),
      '$',
      this.formatRef(localPlacement),
      this.formatRef(shapeId),
      '$',
      this.formatEnum('WATER')
    ]);

    // Propiedades
    const props = [
      this.createPropertySingleValue('PotenciaNominal', powerKW),
      this.createPropertySingleValue('PotenciaKcal', boiler.power),
      this.createPropertySingleValue('Combustible', 'Gas Natural'),
      this.createPropertySingleValue('Sistema', 'Calefacción'),
    ];

    const propSetId = this.createPropertySet('Pset_BoilerCommon', props);
    this.createRelDefinesByProperties([boilerId], propSetId);

    // Contener en el storey
    this.addEntity('IFCRELCONTAINEDINSPATIALSTRUCTURE', [
      this.formatString(this.generateGUID()),
      this.formatRef(this.ownerHistoryId),
      '$', '$',
      this.formatList([this.formatRef(boilerId)]),
      this.formatRef(storeyId)
    ]);

    return boilerId;
  }

  /**
   * Exporta una zona de piso radiante como espacio
   */


  // ============================================
  // GENERACIÓN DEL ARCHIVO
  // ============================================

  /**
   * Genera el contenido completo del archivo IFC
   */
  generate(): string {
    // Setup inicial
    this.setupProject();

    // Header
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0];

    const header = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('${this.projectName}.ifc','${timestamp}',('${this.authorName}'),('${this.organizationName}'),'${this.applicationName} ${this.applicationVersion}','${this.applicationName}','');
FILE_SCHEMA(('IFC2X3'));
ENDSEC;

DATA;
`;

    // Entities
    const entityLines = this.entities.map(entity => {
      const attrs = entity.attributes.map(a => a === null ? '$' : a).join(',');
      return `#${entity.id}=${entity.type}(${attrs});`;
    }).join('\n');

    const footer = `
ENDSEC;
END-ISO-10303-21;
`;

    return header + entityLines + footer;
  }

  /**
   * Exporta todo el proyecto de piso radiante
   */
  /**
   * Exporta todo el proyecto de calefacción (Calderas y Tuberías)
   */
  exportProject(
    boilers: Boiler[],
    pipes: PipeSegment[]
  ): string {
    // Reset
    this.entities = [];
    this.currentId = 1;

    // Setup
    this.setupProject();

    // Exportar calderas
    boilers.forEach(boiler => {
      this.exportBoiler(boiler);
    });

    // Exportar tuberías principales
    pipes.forEach(pipe => {
      this.exportPipeSegment(pipe);
    });

    return this.generate();
  }
}

// ============================================
// FUNCIÓN DE UTILIDAD PARA EXPORTAR
// ============================================

/**
 * Genera y descarga un archivo IFC con el proyecto de piso radiante
 */
export function downloadIFCFile(
  data: {
    boilers: Boiler[];
    pipes: PipeSegment[];
    projectName: string;
  },
  filename?: string
): void {
  const { boilers, pipes, projectName } = data;

  const exporter = new IFCExporter(
    projectName,
    'Sistema de calefacción',
    'Usuario',
    'API Calefacción'
  );

  const ifcContent = exporter.exportProject(
    boilers,
    pipes
  );

  // Crear blob y descargar
  const blob = new Blob([ifcContent], { type: 'application/x-step' });
  const url = URL.createObjectURL(blob);

  const finalFilename = filename || `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.ifc`;

  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('✅ Archivo IFC generado:', finalFilename);
}
