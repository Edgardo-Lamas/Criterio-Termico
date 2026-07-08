#!/usr/bin/env python3
# Genera fallas.json con los códigos de falla estructurados desde los manuales
# oficiales (PEISA, BAXI, CALDAIA). Datos curados manualmente de los PDFs.
import json

chunks = []

def add(source_id, titulo, contenido, seccion='Códigos de falla'):
    chunks.append({
        'source_id': source_id,
        'tipo': 'falla',
        'titulo': titulo,
        'seccion': seccion,
        'categoria': 'Códigos de falla de calderas',
        'contenido': contenido.strip()[:2800],
    })

# ── CALDAIA (Acquaterm) — plataforma X30/X35F/XA30/XA35F, SA26/SA26F, M60/M70F ──
MODELOS_CALDAIA = 'CALDAIA X30, X35F, XA30, XA35F, SA26, SA26F, M60 y M70F (plataforma Acquaterm)'
fallas_caldaia = [
    ('display-apagado', 'Display apagado', 'No llega corriente al display.',
     'La caldera no está enchufada, o fusible quemado.',
     'Enchufar la caldera. Si es el fusible, reemplazarlo (contactar al servicio técnico).'),
    ('e01', 'E01', 'Falta de llama.',
     'Falta de gas en la entrada de la caldera.',
     'Verificar el caudal de gas en la entrada de la caldera y purgar de aire la cañería de gas (contactar al servicio técnico).'),
    ('e02', 'E02', 'Intervención del termostato / presostato de humos.',
     'Obstrucción de la salida de humos, o conducto/terminal de humos mal instalado.',
     'Limpiar el conducto de salida de humos, o corregir la instalación del conducto según el manual.'),
    ('e03', 'E03', 'Avería de sensor de temperatura de calefacción.',
     'Mal funcionamiento del sensor de temperatura de agua de calefacción.',
     'Reemplazo o reparación del sensor (contactar al servicio técnico).'),
    ('e04', 'E04', 'Avería de sensor de temperatura sanitaria.',
     'Mal funcionamiento del sensor de temperatura de agua sanitaria.',
     'Reemplazo o reparación del sensor (contactar al servicio técnico).'),
    ('e05', 'E05', 'Anomalía en el modulador.',
     'Problema en la corriente del modulador.',
     'Conectar correctamente el cable del modulador. Si el problema persiste, contactar al servicio técnico.'),
    ('e06', 'E06', 'Sobretemperatura en el circuito primario.',
     'Temperatura de agua de mandada superior a los 90°C.',
     'Bajar la temperatura de calefacción. Si el problema persiste, contactar al servicio técnico.'),
    ('e07', 'E07', 'Protección de bomba — circuito primario.',
     'Presencia de aire en el circuito primario, falla en la bomba circuladora, u obstrucción en el circuito primario.',
     'Purgar el aire de la instalación. Si es la bomba: reemplazo o reparación (servicio técnico). Si hay obstrucción: limpiar el circuito primario.'),
    ('e08', 'E08', 'Falta de agua en el circuito de calefacción.',
     'Presión de agua en el circuito primario menor a 0,5 bar.',
     'Elevar la presión de agua del circuito primario (cargar la instalación) y presionar el botón de reset. Si persiste, contactar al servicio técnico.'),
    ('e09', 'E09', 'Intervención del termostato de seguridad.',
     'Temperatura en el circuito primario mayor a los 100°C.',
     'Purgar de aire el circuito primario de la caldera y presionar el botón de reset. Si persiste, contactar al servicio técnico.'),
]
for slug, codigo, problema, causa, solucion in fallas_caldaia:
    add(f'falla:caldaia-acquaterm#{slug}',
        f'Caldera CALDAIA — Código {codigo}',
        f'Código de falla {codigo} en calderas {MODELOS_CALDAIA}.\n'
        f'Significado: {problema}\nCausa: {causa}\nSolución: {solucion}\n'
        f'Fuente: manual oficial CALDAIA, sección Anomalías de Funcionamiento.')

# ── PEISA — códigos por plaqueta ──────────────────────────────────────────────
add('falla:peisa-bgl188#tabla',
    'Caldera PEISA (plaqueta BGL 188) — Códigos de falla',
    """Códigos de falla de calderas PEISA con plaqueta BGL 188 (modelos Duo GN/GE,
Duo F GN/GE, Unica GN/GE, Unica F GN/GE):
E0: Falla de plaqueta.
E1: Falta presión de agua (cargar la instalación / verificar presostato).
E2: Falla de encendido.
E3: Falla del sensor de calefacción.
E4: Falla del sensor de agua caliente sanitaria.
E6: Falla en salida de humos.
E7: Sobretemperatura.
Notas de service: si aparece E5, verificar diferencia de potencial entre L-N, L-T y N-T
(problema de alimentación eléctrica / puesta a tierra). Si aparece E9, verificar los
contactos de los sensores de temperatura en la placa, en los sensores y su cableado.
Fuente: Manual Técnico PEISA.""")

add('falla:peisa-bgl168#tabla',
    'Caldera PEISA (plaqueta BGL 168) — Códigos de falla',
    """Códigos de falla de calderas PEISA con plaqueta BGL 168:
E0: Falla de plaqueta.
E1: Falta presión de agua.
E2: Sobretemperatura o falla de encendido.
E3: Falla del sensor de calefacción.
E4: Falla del sensor de agua caliente sanitaria.
E6: Falla en salida de humos.
Regulación de potencia: llave selectora lateral en posición "Regulación"; el display
destella el valor porcentual de potencia (predeterminado de encendido progresivo: 35).
Fuente: Manual Técnico PEISA.""")

add('falla:peisa-23dsf#tabla',
    'Caldera PEISA Diva 23 DSf — Códigos de falla',
    """Códigos de falla de calderas PEISA Diva 23 DSf:
E1: Falla de encendido.
E2: Sobretemperatura.
E3: Falla en salida de humos.
E4: Falta de agua (presión baja del circuito).
E6: Falla del sensor de agua caliente sanitaria.
E7: Falla del sensor de calefacción.
Atención: en esta plaqueta los números NO coinciden con los de BGL 188/168 —
verificar siempre el modelo exacto antes de diagnosticar.
Fuente: Manual Técnico PEISA.""")

add('falla:peisa-diva-digital#tabla',
    'Caldera PEISA Diva Digital (plaqueta SIT 100-01 / 100-02) — Códigos de falla',
    """Códigos de falla de calderas PEISA Diva Digital con plaqueta SIT 100-01 o 100-02
(modelos 24 DS/DSz/DSf/DSfz, 31 DS/DSz/DSf/DSfz, 26 C/Cz/Cf/Cfz, 31 C/Cz/Cf/Cfz):
E1: Falla de encendido.
E2: Sobretemperatura.
E3: Falla en salida de humos.
E4: Falta de agua (presión baja).
E5: Falla de plaqueta.
E6: Falla del sensor de agua caliente sanitaria.
E7: Falla del sensor de calefacción.
Dato de service: DIP 3 de la plaqueta SIT 100-02 define agua sanitaria instantánea (OFF)
o con acumulación (ON); DIP 8 define radiadores (OFF) o piso radiante (ON).
Fuente: Manual Técnico PEISA.""")

# ── BAXI — por modelo ─────────────────────────────────────────────────────────
add('falla:baxi-eco4s#tabla',
    'Caldera BAXI Eco 4S — Códigos de anomalía',
    """Códigos de anomalía de la caldera BAXI Eco 4S (se muestran en pantalla como E + número;
la retroiluminación parpadea en sincronía con el código). Para RESETEAR: pulsar la tecla R
al menos 2 segundos. Tras 5 intentos consecutivos de rearme la caldera se bloquea (apagarla
unos segundos para rearmar de nuevo).
E01: Bloqueo — no se enciende. Resetear con R; si se repite, llamar al servicio técnico.
E02: Bloqueo por actuación del termostato de seguridad. Resetear con R; si se repite, servicio técnico.
E03: Actuación del termostato de humos / presóstato de humos. Llamar al servicio técnico.
E05: Fallo de la sonda de salida (calefacción). Llamar al servicio técnico.
E06: Fallo de la sonda de sanitario. Llamar al servicio técnico.
E10: El presóstato hidráulico no habilita — presión de instalación baja. Controlar y cargar
la presión de la instalación; si persiste, servicio técnico.
E25/E26: Actuación del dispositivo de seguridad por probable bloqueo de la bomba. Servicio técnico.
E35: Llama parásita (error de llama). Resetear con R; si se repite, servicio técnico.
E96: Apagado por disminución de la tensión de alimentación. El reset es automático;
si persiste, servicio técnico.
Fuente: manual oficial BAXI Eco 4S, sección Indicaciones y actuación de los dispositivos de seguridad.""")

add('falla:baxi-luna3comfort#tabla',
    'Caldera BAXI Luna 3 Comfort — Códigos de error',
    """Códigos de error de la caldera BAXI Luna 3 Comfort (display). Para restaurar:
pulsar el botón OK al menos 2 segundos; si el error no desaparece, llamar a un centro
de asistencia autorizado.
01E: Fallo de suministro de gas. Resetear con OK.
02E: Sensor del termostato de seguridad desconectado. Resetear con OK.
03E: Sensor del termostato de salida de gases desconectado / presostato de salida de gases. Servicio técnico.
04E: Error de seguridad por pérdidas de llama frecuentes. Servicio técnico.
05E: Fallo del sensor NTC de calefacción central. Servicio técnico.
06E: Fallo del sensor NTC de agua caliente doméstica. Servicio técnico.
10E: BAJA presión de agua. Verificar y cargar la presión del sistema; si persiste, servicio técnico.
11E: Intervención del termostato de seguridad de instalación a baja temperatura (si está conectado). Servicio técnico.
18E: Función de carga de agua activa (solo aparatos predispuestos). Esperar a que termine la carga.
19E: Anomalía de carga de instalación. Servicio técnico.
25E: Exceso de temperatura máxima de caldera — probable bomba bloqueada / sin circulación. Servicio técnico.
31E: Error de comunicación entre tarjeta electrónica y telecontrol. Resetear con OK.
35E: Fallo de llama (llama parasitaria). Resetear con OK.
80E-96E: Error interno del control remoto. Servicio técnico.
97E: Programación errada de la frecuencia (Hz) de alimentación de la tarjeta. Corregir programación.
98E-99E: Error interno de tarjeta. Servicio técnico.
Fuente: manual oficial BAXI Luna 3 Comfort, sección Errores.""")

with open('/private/tmp/claude-501/-Users-edgardolamas/8bb63a12-a37f-4b52-904d-8528ee332595/scratchpad/fallas.json', 'w') as f:
    json.dump({'documents': chunks}, f, ensure_ascii=False, indent=1)
print(f'{len(chunks)} fragmentos de códigos de falla generados')
