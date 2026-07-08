#!/usr/bin/env python3
# Fragmentos curados de los 3 PDFs que requirieron lectura visual (tablas en
# imagen): PEISA XP, BAXI Main 5 y folleto CALDAIA CP30 (climatización de piscinas).
import json
import sys

chunks = [
    {
        'source_id': 'falla:peisa-xp#sintomas',
        'tipo': 'falla',
        'titulo': 'Caldera PEISA serie XP — Cuadro de inconvenientes y soluciones',
        'seccion': 'Anomalías de funcionamiento',
        'categoria': 'Códigos de falla de calderas',
        'contenido': """Diagnóstico por síntomas de la caldera PEISA serie XP (atmosférica de
fundición, sin display — se diagnostica por síntoma, no por código):
- Olor a gases no quemados: caldera sucia (limpiar el cuerpo), tiraje insuficiente de la
chimenea (verificar eficiencia del tiraje), renovación de aire insuficiente (asegurar
ventilación del local), o mala regulación de la llama (controlar presión de gas en el
quemador principal).
- Poco rendimiento de la caldera: mala regulación de la llama (verificar que el consumo
de gas sea regular) o caldera sucia (limpiar el cuerpo).
- Salto térmico demasiado alto: sensado del termostato incorrecto — introducir
correctamente el bulbo en la vaina.
- Condensación de la caldera: errónea regulación del termostato (regularlo a temperatura
más alta), mala regulación de la llama, o consumo de gas insuficiente respecto de la potencia.
- La caldera se ensucia fácilmente: mala regulación de la llama (verificar llama del
quemador y consumo proporcional a la potencia) o quemadores sucios (limpiar).
- Explosiones en el quemador principal: falta de gas de alimentación (controlar presión
de gas), caldera sucia (verificar y limpiar el cuerpo) o piloto sucio (limpiar).
La caldera XP también tiene termostato de humos con rearme manual: si bloquea, accionar
el pulsador retirando la tapa protectora; si vuelve a bloquear, pedir asistencia técnica.
Fuente: manual oficial PEISA serie XP, sección 8 Anomalías de funcionamiento.""",
    },
    {
        'source_id': 'falla:baxi-main5#tabla-a',
        'tipo': 'falla',
        'titulo': 'Caldera BAXI Main 5 — Códigos de anomalía (E01 a E27)',
        'seccion': 'Tabla de anomalías',
        'categoria': 'Códigos de falla de calderas',
        'contenido': """Códigos de anomalía de la caldera BAXI Main 5 (display muestra E + número;
para rearmar pulsar la tecla R al menos 2 segundos; si se repite, servicio técnico autorizado):
E01: Bloqueo — no se enciende. Resetear con R.
E02: Bloqueo por activación del termostato de seguridad. Resetear con R.
E03: Error de configuración de tarjeta. Servicio técnico.
E04: Error de seguridad por falta de encendido / pérdidas de llama frecuentes. Resetear con R.
E05: Fallo de la sonda de impulsión. Servicio técnico.
E06: Fallo de la sonda de ACS. Servicio técnico.
E07: Fallo de la sonda NTC de humos. Resetear con R.
E08: Error en el circuito de amplificación de llama. Servicio técnico.
E09: Error en el circuito de seguridad de la válvula de gas. Servicio técnico.
E10: El presóstato hidráulico no habilita — presión de instalación baja. Controlar y cargar
la presión de la instalación (ver sección Llenado).
E22: Apagado por disminución de la tensión de alimentación. Restauración automática con
tensión superior a 170V; si persiste, servicio técnico.
E25: Activación del dispositivo de seguridad por falta de circulación de agua (probable
bomba bloqueada). Resetear con R.
E26: Sobretemperatura en circuito de calefacción / falta de circulación (probable bomba
bloqueada). Resetear con R; si se repite, servicio técnico.
E27: Posición incorrecta de la sonda sanitaria. Resetear con R.
Fuente: manual oficial BAXI Main 5, sección 7 Anomalías.""",
    },
    {
        'source_id': 'falla:baxi-main5#tabla-b',
        'tipo': 'falla',
        'titulo': 'Caldera BAXI Main 5 — Códigos de anomalía (E35 a E98 y señales del display)',
        'seccion': 'Tabla de anomalías',
        'categoria': 'Códigos de falla de calderas',
        'contenido': """Códigos de anomalía de la caldera BAXI Main 5 (continuación):
E35: Llama parásita (error de llama). Resetear con R; si se repite, servicio técnico.
E36: Fallo de la sonda NTC de humos. Servicio técnico.
E40-E41: Bloqueo por probable atasco del conducto de humos/aspiración o presión de
alimentación de gas demasiado baja. Resetear con R.
E42: Pérdida de llama (probable atasco total del conducto de humos/aspiración o fallo
del ventilador). Resetear con R.
E43: Bloqueo por probable atasco del conducto de humos/aspiración o presión de gas baja.
Anomalía temporal — restauración automática con tensión superior a 185V o reset con R.
E50: Bloqueo por activación de sobretemperatura de la sonda NTC de humos. Resetear con R.
E55: Válvula de gas no calibrada electrónicamente. Servicio técnico.
E62: Bloqueo de seguridad por falta de estabilización de la señal de llama o de la
temperatura de humos. Resetear con R.
E65: Bloqueo de seguridad por activaciones frecuentes de la prueba de control de atasco
del conducto de humos/aspiración. Resetear con R.
E98: Configuración incorrecta de los parámetros de la tarjeta electrónica. Servicio técnico.
Señal parpadeante (sin código): la caldera funciona con potencia reducida — probable
atasco del conducto de humos/aspiración o presión de gas baja. Eliminar temporalmente la
demanda de calor para resetear; si se repite, servicio técnico.
Parpadeo alternado con símbolo de llama: alarma de caliza (incrustaciones) o posición
incorrecta de la sonda NTC sanitaria. Servicio técnico.
Nota: la retroiluminación de la pantalla parpadea en sincronía con el código de error.
Fuente: manual oficial BAXI Main 5, sección 7 Anomalías.""",
    },
    {
        'source_id': 'falla:baxi-main5#service',
        'tipo': 'falla',
        'titulo': 'Caldera BAXI Main 5 — Diagnóstico service (causas e intervenciones)',
        'seccion': 'Identificación y solución de anomalías service',
        'categoria': 'Códigos de falla de calderas',
        'contenido': """Diagnóstico de nivel service para la caldera BAXI Main 5 — causas posibles
e intervenciones por código:
E01 (bloqueo por falta de encendido): falta de presión de gas, cable encendedor-detección
interrumpido, electrodo de detección defectuoso o mal posicionado, válvula de gas o tarjeta
defectuosa. Controlar: válvula de cierre de gas abierta y sin aire en el circuito, presión de
alimentación, continuidad del cable y contacto del electrodo, conexiones de la válvula de
gas con la tarjeta, integridad y posición del electrodo.
E02 (termostato de seguridad): no circula agua en el circuito primario (bomba bloqueada o
intercambiador atascado), termostato límite defectuoso o su cableado interrumpido, sonda
NTC de impulsión defectuosa. Controlar: funcionamiento de la bomba (desenroscar el tapón
frontal y desbloquear el rodete con destornillador), cableado de alimentación de la bomba,
termostato límite, sonda NTC de impulsión, intercambiador atascado.
E05/E06 (sondas de impulsión/ACS): sonda NTC defectuosa (circuito abierto o en
cortocircuito) o cableado interrumpido. Controlar sonda, continuidad y que el cableado no
esté en cortocircuito.
E10 (presóstato hidráulico): presión del circuito menor a 0,5 bar, presóstato defectuoso o
cableado interrumpido. Cargar la instalación, verificar presóstato y su cableado.
E22 (tensión baja): tensión de alimentación menor a 162V (restauración automática con
más de 168V). Si las caídas no dependen de la caldera, reclamar a la distribuidora eléctrica.
E25/E26 (falta de circulación): bomba bloqueada o intercambiador atascado, sonda NTC
de impulsión defectuosa. Desbloquear el rodete de la bomba, controlar cableado, sonda e
intercambiador.
E35 (llama parásita): falta de puesta a tierra de la tarjeta (conector X4), electrodo de
detección defectuoso o mal ubicado. Controlar continuidad de la puesta a tierra — causa
clásica de E35: tierra deficiente.
E40-E41 (atasco de conducto humos/aspiración o presión de gas baja): controlar presión de
gas (metano: presión de alimentación mayor a 9 mbar), cables del modulador de la válvula,
presión del quemador calibrada, electrodo, sonda NTC de humos, y que los conductos de
aspiración/descarga no estén atascados ni superen las longitudes máximas con los
diafragmas correctos.
Fuente: manual oficial BAXI Main 5, sección 15 Identificación y solución de anomalías service.""",
    },
    {
        'source_id': 'manual:caldaia-climatizadores-piscina#seleccion',
        'tipo': 'manual',
        'titulo': 'Climatizadores de piscina CALDAIA Digital CP/CX — Selección de equipos',
        'seccion': 'Tabla de selección',
        'categoria': 'Climatización de piscinas',
        'contenido': """Climatizadores de piscina a gas CALDAIA Digital. Modelos y potencias:
CP30 (28.000 kcal/h, de piso exterior/interior, tiro forzado), CP40 (38.000 kcal/h, de piso),
CP70 (70.000 kcal/h, de piso), CX30 (28.000 kcal/h, mural interior, tiro forzado/balanceado),
CX40 (38.000 kcal/h, mural interior).
Tabla de selección por superficie máxima de piscina (en m², agua a 28°C, temperatura
exterior no inferior a 15°C):
- Piscina cubierta de uso permanente: CP30/CX30 hasta 74 m² — CP40/CX40 hasta 102 m² — CP70 hasta 166 m².
- Piscina cubierta de uso de fin de semana: CP30/CX30 hasta 45 m² — CP40/CX40 hasta 61 m² — CP70 hasta 100 m².
- Piscina descubierta de uso permanente: CP30/CX30 hasta 38 m² — CP40/CX40 hasta 51 m² — CP70 hasta 84 m².
- Piscina descubierta de uso de fin de semana: CP30/CX30 hasta 27 m² — CP40/CX40 hasta 37 m² — CP70 hasta 60 m².
Se recomienda manta térmica en todos los casos para ahorro de gas.
Instalación: versión mural con tiro balanceado forzado usa tubos coaxiales hasta 5 m
(cámara de combustión cerrada); versión de tiro forzado usa tubo de escape de aluminio
de 80 mm hasta 15 m (cámara abierta — requiere entrada de aire en el local).
Componentes: intercambiador agua-humos de cobre, quemadores modulantes de acero
inoxidable, flujostato diferencial de agua con bloqueo total, válvula by-pass automática.
El sistema mantiene temperatura constante de pileta (control por diferencial con sonda
de agua y exterior). Aprobado ENARGAS/IGA, norma IRAM 2092.
Fuente: catálogo oficial CALDAIA Climatizadores Digital CP30/CP40/CP70/CX30/CX40.""",
    },
]

out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/fallas-visuales.json'
with open(out, 'w') as f:
    json.dump({'documents': chunks}, f, ensure_ascii=False, indent=1)
print(f'{len(chunks)} fragmentos → {out}')
