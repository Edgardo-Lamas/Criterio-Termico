#!/usr/bin/env python3
# Fragmentos de ACS (agua caliente sanitaria) y química del agua de piletas,
# curados de manuales PEISA (Boiler, Kit Bollente, Circuito de calentamiento)
# y artículos técnicos de tratamiento de agua (solo datos fácticos).
import json
import sys

ACS = 'Agua caliente sanitaria'
PIL = 'Climatización de piscinas'

chunks = [
    {
        'source_id': 'manual:acs-acumulacion#principio',
        'tipo': 'manual',
        'titulo': 'ACS por acumulación — Cómo trabaja la caldera con tanque acumulador',
        'seccion': 'Principio de funcionamiento',
        'categoria': ACS,
        'contenido': """Cómo funciona el ACS por acumulación con caldera (sistema PEISA de circuito
de calentamiento con intercambiador a placas):
El circuito de calentamiento vincula el tanque acumulador con el intercambiador a placas
y el circuito hidráulico de la caldera, e incluye la bomba circuladora propia.
Ciclo: cuando el termostato del tanque pide recuperación de temperatura (por consumo de
agua o por enfriamiento), arranca la bomba del circuito de calentamiento y hace circular
el agua del tanque a través del intercambiador de placas, donde intercambia calor con el
agua del circuito primario de la caldera. Al alcanzar la temperatura seteada, la bomba se
detiene y termina la recuperación.
Datos de instalación: bomba alimentada a 220 V desde el tablero de control del tanque
(verificar bomba en velocidad 3); el LED del tablero indica calentamiento activo; el bulbo
del termostato va en la vaina del tanque. El kit sella con Loctite 242 (anaeróbico) y/o
juntas de fibra según la unión. Prever una válvula antes de la entrada de agua fría
sanitaria para poder vaciar el tanque. Hay circuitos para 30.000/50.000 kcal/h (conexiones
1") y para 100.000 kcal/h (conexiones 1 ¼").
Fuente: manual oficial PEISA — Circuito de calentamiento Agua Sanitaria.""",
    },
    {
        'source_id': 'manual:acs-boiler-peisa#funcionamiento',
        'tipo': 'manual',
        'titulo': 'Boiler PEISA 100/120 L — Funcionamiento e instalación con caldera doble servicio',
        'seccion': 'Funcionamiento',
        'categoria': ACS,
        'contenido': """El Boiler PEISA (tanque acumulador de 100 o 120 litros) se suma a una caldera
DIVA doble servicio para lograr abundante ACS con temperatura constante aunque haya
aperturas simultáneas de canillas.
Ciclo: cuando el termostato del Boiler pide calentamiento, arranca la bomba del Boiler y
circula el agua del tanque a través de la caldera — el flujo enciende el quemador como si
fuera un consumo sanitario. El agua se acumula hasta la temperatura fijada; la bomba se
detiene, cesa la circulación y el quemador se apaga. Bomba a 220 V desde el tablero del
Boiler; el LED indica calentamiento en curso.
DATO CLAVE de instalación: quitar el restrictor de caudal de la caldera al instalar el
Boiler para aumentar el rendimiento (recomendación oficial PEISA).
Conexiones: entrada de agua fría 1", salida de agua caliente 1", ida a caldera (entrada
agua fría de caldera) 3/4", retorno de caldera (salida ACS de caldera) 3/4".
El modelo Plus agrega una válvula termostática regulable a la salida del ACS (perilla bajo
el techo del Boiler) para fijar la temperatura de salida.
Mantenimiento estacional (fin de cada invierno): estanqueidad de conexiones, control de la
barra (ánodo) de magnesio, funcionamiento de la bomba, encendido/apagado, y drenaje de al
menos 20 litros por la válvula de descarga para eliminar sedimentos.
Fuente: manual oficial PEISA — Boiler 100/120 L.""",
    },
    {
        'source_id': 'manual:acs-generador-diva-acqua#caracteristicas',
        'tipo': 'manual',
        'titulo': 'Generador ACS PEISA Diva Acqua F (Kit Bollente) — Producción instantánea e indirecta',
        'seccion': 'Características y funcionamiento',
        'categoria': ACS,
        'contenido': """El Generador ACS Diva Acqua F (Kit Bollente) de PEISA produce agua caliente
sanitaria instantánea; combinado con un tanque acumulador forma un termotanque de
calentamiento indirecto de alto rendimiento.
Componentes y características: intercambiador gas-agua íntegramente de cobre, quemadores
multigas de acero inoxidable, cámara de combustión estanca (habilitado para monoambientes),
tiro forzado con ventilador — salida por tubos coaxiales hasta 6 m o paralelos hasta 20 m,
válvula de gas modulante, encendido electrónico automático, display digital con temperatura
y códigos de anomalía, termostato de seguridad límite del intercambiador (corte total de
gas por sobrecalentamiento), presostato diferencial de control de salida de humos.
Rendimiento térmico: 90%. Altura reducida: 80 cm.
Tanques compatibles: acero S235JR con protección interna o acero inoxidable AISI 444.
Mantenimiento anual: limpieza del quemador, control del intercambiador y de los electrodos
de encendido/ionización, verificación de seguridades, estanqueidad de conexiones de gas y
agua, y del conducto de salida de gases.
Fuente: manual oficial PEISA — Generador de ACS Diva Acqua F, Kit Bollente.""",
    },
    {
        'source_id': 'falla:peisa-diva-acqua-f#tabla',
        'tipo': 'falla',
        'titulo': 'Generador ACS PEISA Diva Acqua F — Códigos de falla e inconvenientes',
        'seccion': 'Códigos de falla',
        'categoria': 'Códigos de falla de calderas',
        'contenido': """Códigos de falla en display del Generador ACS PEISA Diva Acqua F (Kit Bollente):
E00: Falla de plaqueta de comando.
E01: Falta de circulación de agua.
E02: Falla de encendido.
E04: Falla del sensor de temperatura.
E05: Falla de aislación / plaqueta.
E06: Falla en salida de humos.
E07: Sobretemperatura.
Inconvenientes y soluciones:
- No enciende el quemador: falla en alimentación de gas (controlar caudal nominal y purgar
aire de la tubería), falla eléctrica (verificar alimentación), electrodos de encendido
sucios o mal posicionados (limpiar y posicionar), ventilador no funciona (controlar su
alimentación eléctrica).
- Baja temperatura del agua: regulación del termostato baja (subir la temperatura
seleccionada) o consumo de gas insuficiente (controlar que consumo y presión de gas
coincidan con la regulación de presión del quemador).
Antes de diagnosticar, verificar que no falte alimentación eléctrica ni gas.
Fuente: manual oficial PEISA — Generador de ACS Diva Acqua F.""",
    },
    {
        'source_id': 'manual:piletas-quimica-agua#parametros',
        'tipo': 'manual',
        'titulo': 'Piscinas — Parámetros químicos del agua: pH, cloro y renovación',
        'seccion': 'Química del agua',
        'categoria': PIL,
        'contenido': """Parámetros de referencia para el tratamiento del agua de piscinas:
- pH: mantener entre 7,0 y 7,8 (en hidromasaje/spa: 7,2 a 7,8). El pH fuera de rango reduce
la eficacia del cloro y causa irritación de ojos y piel.
- Cloro residual libre: entre 0,5 y 3 mg/l en piscinas; entre 0,8 y 2 mg/l en hidromasaje.
- Bromo residual libre (alternativa recomendada en agua templada): entre 2 y 4 mg/l.
- Renovación de agua: reponer diariamente el 5% del volumen de la pileta.
- Piscinas cubiertas: renovar el aire del recinto a razón de 22 m³/hora por bañista — la
mala ventilación (no el cloro en sí) es la causa habitual de picazón de ojos y molestias.
- La irritación de ojos y piel no la causa el cloro bien dosificado sino sus subproductos
al reaccionar con contaminantes de los bañistas (sudor, orina, cosméticos): exigir ducha
previa y gorro reduce el problema.
- Cada bañista aporta ~30 millones de bacterias por baño: la desinfección no es opcional.
- Cloro líquido (hipoclorito de sodio / lavandina) vs pastillas (cloroisocianuratos): ambos
son seguros bien manejados; el líquido es más diluido, más fácil de manejar y más económico.
Relevancia para el instalador de climatización: el agua mal balanceada (pH ácido, exceso de
desinfectante) es agresiva y corroe el intercambiador del climatizador — verificar
parámetros del agua antes de conectar el equipo y en cada mantenimiento.""",
    },
    {
        'source_id': 'manual:piletas-tsd#criterio',
        'tipo': 'manual',
        'titulo': 'Piscinas — Total de Sólidos Disueltos (TSD): qué es y cuándo preocuparse',
        'seccion': 'Química del agua',
        'categoria': PIL,
        'contenido': """Total de Sólidos Disueltos (TSD) en agua de piscinas — criterio práctico:
El TSD es la suma de todos los sólidos disueltos (sales, minerales, metales — invisibles;
no incluye los sólidos en suspensión que dan turbiedad). En pileta recién llenada predomina
el calcio; con el tiempo predomina el cloruro de sodio (sal común), que se acumula por el
uso de cloro líquido, carbonato de sodio y demás productos, más el aporte de los bañistas.
Con cloro líquido el TSD sube típicamente 2.000-3.000 ppm por año y la dilución de rutina
no lo compensa.
Criterio: la recomendación tradicional de drenar la pileta al superar 1.500-2.000 ppm es
errónea y derrochadora. Las piletas funcionan bien incluso con más de 5.000 ppm (las de
agua de mar operan con 32.000 ppm sin problemas de cloración, filtrado ni corrosión).
Efecto real del TSD alto sobre el cloro: mínimo — subir de 400 a 4.000 ppm reduce la
capacidad de trabajo del cloro apenas como una décima de suba de pH.
Regla de oro: no drenar la pileta salvo que haya una buena razón concreta; el nivel de TSD
por sí solo casi nunca lo es.""",
    },
    {
        'source_id': 'manual:piletas-hidromasaje#mantenimiento',
        'tipo': 'manual',
        'titulo': 'Hidromasaje de uso colectivo — Mantenimiento preventivo y recirculación',
        'seccion': 'Mantenimiento',
        'categoria': PIL,
        'contenido': """Mantenimiento de bañeras y piletas de hidromasaje de uso colectivo (referencia:
normativa del Ministerio de Sanidad de España, usable como criterio hasta que exista
reglamentación local):
Desinfección: cloro residual libre 0,8-2 mg/l, o bromo 2-4 mg/l (recomendado en agua
templada), con pH entre 7,2 y 7,8.
Bañeras individuales sin recirculación: vaciado y limpieza tras cada uso; limpieza y
desinfección diaria del vaso; revisión mensual de difusores; desmontaje y desinfección
semestral de difusores; limpieza anual completa de conducciones, mezclador y componentes.
Piletas de hidromasaje con recirculación (uso colectivo):
- Depuración obligatoria: filtración + desinfección automática continua.
- Bomba y filtros dimensionados para recircular todo el volumen en máximo 30 minutos.
- Velocidad máxima recomendada en filtros de arena: 36,7 m³/h por m² de filtro.
- Renovación continua de agua: 3 m³/h cada 20 usuarios durante las horas de uso.
- Revisión mensual de conductos y filtros; cada 6 meses limpieza y desinfección de boquillas
de impulsión, canillas y duchas (reemplazar piezas con corrosión o incrustación).
- Cierre diario: limpiar el vaso y clorar a 5 mg/l recirculando mínimo 4 horas.
Relevancia para el instalador: la recirculación corta y el agua caliente aceleran la
incrustación y la corrosión en intercambiadores — el mantenimiento del circuito es parte
del servicio de climatización.""",
    },
]

out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/acs-piletas.json'
with open(out, 'w') as f:
    json.dump({'documents': chunks}, f, ensure_ascii=False, indent=1)
print(f'{len(chunks)} fragmentos → {out}')
