import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import {
    PROVINCIAS, INSTALA, TRABAJOS, COMBUSTIBLES, MARCAS,
    NOTA_MAX, OTRAS_MAX, FICHA_VACIA, fichaTieneAlgo, type Ficha,
} from './opciones'
import styles from './FichaInstalador.module.css'

/**
 * «Qué sabe Martín de vos» — la primera etapa de la memoria del asistente.
 *
 * 🔑 La carga el instalador, Martín no infiere nada. Ese es el motivo de que
 * esta pantalla exista: una memoria equivocada es peor que no tener memoria, y
 * si los datos los escribe él, no hay nada que Martín pueda recordar mal.
 *
 * 🔑 TODO ES OPCIONAL y se contesta tocando, no escribiendo. El instalador está
 * en obra: si esto se siente un formulario, no lo completa nadie. Lo único que
 * se tipea es la nota, y también puede quedar vacía.
 */
export function FichaInstalador() {
    const [ficha, setFicha] = useState<Ficha>(FICHA_VACIA)
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [guardada, setGuardada] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isSupabaseConfigured) { setCargando(false); return }
        let vigente = true
        void (async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { if (vigente) setCargando(false); return }
            const { data } = await supabase
                .from('ficha_instalador')
                .select('provincia, instala, trabajos, combustible, marcas, marcas_otras, nota')
                .eq('user_id', user.id)
                .maybeSingle()
            if (!vigente) return
            // Sin fila todavía es lo normal, no un error: la ficha nace vacía.
            if (data) {
                setFicha({
                    ...FICHA_VACIA,
                    ...data,
                    trabajos: data.trabajos ?? [],
                    marcas: data.marcas ?? [],
                })
            }
            setCargando(false)
        })()
        return () => { vigente = false }
    }, [])

    /** Marca/desmarca en los campos que admiten varios a la vez. */
    function alternar(campo: 'trabajos' | 'marcas', valor: string) {
        setGuardada(false)
        setFicha(f => ({
            ...f,
            [campo]: f[campo].includes(valor)
                ? f[campo].filter(v => v !== valor)
                : [...f[campo], valor],
        }))
    }

    /** Volver a tocar la opción elegida la desmarca: sin esto no hay forma de
     *  arrepentirse de un dato en un grupo de una sola opción. */
    function elegir(campo: 'provincia' | 'instala' | 'combustible', valor: string | null) {
        setGuardada(false)
        setFicha(f => ({ ...f, [campo]: f[campo] === valor ? null : valor }))
    }

    async function guardar() {
        setGuardando(true); setError(''); setGuardada(false)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Se cerró la sesión. Volvé a entrar y probá de nuevo.')
            // `actualizada_at` no se manda: la pone la base con un trigger.
            const { error: err } = await supabase.from('ficha_instalador').upsert({
                user_id: user.id,
                provincia: ficha.provincia,
                instala: ficha.instala,
                trabajos: ficha.trabajos,
                combustible: ficha.combustible,
                marcas: ficha.marcas,
                marcas_otras: ficha.marcas_otras?.trim() || null,
                nota: ficha.nota?.trim() || null,
            }, { onConflict: 'user_id' })
            if (err) throw new Error(err.message)
            setGuardada(true)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo guardar')
        } finally {
            setGuardando(false)
        }
    }

    async function borrarTodo() {
        setGuardando(true); setError(''); setGuardada(false)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Se cerró la sesión. Volvé a entrar y probá de nuevo.')
            // Se borra la fila entera, no se vacían los campos: que no quede un
            // registro vacío diciendo que alguna vez cargó algo.
            const { error: err } = await supabase
                .from('ficha_instalador').delete().eq('user_id', user.id)
            if (err) throw new Error(err.message)
            setFicha(FICHA_VACIA)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo borrar')
        } finally {
            setGuardando(false)
        }
    }

    if (cargando) return <p className={styles.cargando}>Cargando…</p>

    const hayAlgo = fichaTieneAlgo(ficha)

    return (
        <div className={styles.ficha}>
            <p className={styles.intro}>
                Lo que cargues acá lo tiene en cuenta Martín cuando te contesta, para no
                volver a preguntarte lo mismo. <strong>Es todo opcional</strong> y lo podés
                cambiar o borrar cuando quieras.
            </p>

            <fieldset className={styles.grupo}>
                <legend>¿Dónde trabajás?</legend>
                <select
                    className={styles.select}
                    value={ficha.provincia ?? ''}
                    onChange={e => elegir('provincia', e.target.value || null)}
                >
                    <option value="">Sin especificar</option>
                    {PROVINCIAS.map(([valor, nombre]) => (
                        <option key={valor} value={valor}>{nombre}</option>
                    ))}
                </select>
            </fieldset>

            <fieldset className={styles.grupo}>
                <legend>¿Qué instalás más?</legend>
                <div className={styles.chips}>
                    {INSTALA.map(([valor, nombre]) => (
                        <button
                            key={valor} type="button"
                            aria-pressed={ficha.instala === valor}
                            className={`${styles.chip} ${ficha.instala === valor ? styles.chipOn : ''}`}
                            onClick={() => elegir('instala', valor)}
                        >{nombre}</button>
                    ))}
                </div>
            </fieldset>

            <fieldset className={styles.grupo}>
                <legend>¿Qué tipo de trabajo hacés?</legend>
                <div className={styles.chips}>
                    {TRABAJOS.map(([valor, nombre]) => (
                        <button
                            key={valor} type="button"
                            aria-pressed={ficha.trabajos.includes(valor)}
                            className={`${styles.chip} ${ficha.trabajos.includes(valor) ? styles.chipOn : ''}`}
                            onClick={() => alternar('trabajos', valor)}
                        >{nombre}</button>
                    ))}
                </div>
            </fieldset>

            <fieldset className={styles.grupo}>
                <legend>¿Con qué gas?</legend>
                <div className={styles.chips}>
                    {COMBUSTIBLES.map(([valor, nombre]) => (
                        <button
                            key={valor} type="button"
                            aria-pressed={ficha.combustible === valor}
                            className={`${styles.chip} ${ficha.combustible === valor ? styles.chipOn : ''}`}
                            onClick={() => elegir('combustible', valor)}
                        >{nombre}</button>
                    ))}
                </div>
            </fieldset>

            <fieldset className={styles.grupo}>
                <legend>¿Con qué marcas trabajás?</legend>
                <div className={styles.chips}>
                    {MARCAS.map(([valor, nombre]) => (
                        <button
                            key={valor} type="button"
                            aria-pressed={ficha.marcas.includes(valor)}
                            className={`${styles.chip} ${ficha.marcas.includes(valor) ? styles.chipOn : ''}`}
                            onClick={() => alternar('marcas', valor)}
                        >{nombre}</button>
                    ))}
                </div>
                <input
                    type="text" className={styles.input} maxLength={OTRAS_MAX}
                    placeholder="Otras marcas, separadas por coma"
                    value={ficha.marcas_otras ?? ''}
                    onChange={e => { setGuardada(false); setFicha(f => ({ ...f, marcas_otras: e.target.value })) }}
                />
                <p className={styles.ayuda}>
                    De esas tres tenemos el cuadro de fallas cargado. Las otras nos sirven
                    para saber qué manual sumar.
                </p>
            </fieldset>

            <fieldset className={styles.grupo}>
                <legend>¿Algo más que le quieras decir?</legend>
                <textarea
                    className={styles.textarea} rows={3} maxLength={NOTA_MAX}
                    placeholder="Con tus palabras. Por ejemplo: «trabajo casi siempre en casas de dos plantas»."
                    value={ficha.nota ?? ''}
                    onChange={e => { setGuardada(false); setFicha(f => ({ ...f, nota: e.target.value })) }}
                />
                <p className={styles.ayuda}>{(ficha.nota ?? '').length} de {NOTA_MAX}</p>
            </fieldset>

            {error && <p className={styles.error} role="alert">{error}</p>}
            {guardada && <p className={styles.ok} role="status">Guardado. Martín ya lo tiene en cuenta.</p>}

            <div className={styles.acciones}>
                <button
                    type="button" onClick={guardar} disabled={guardando}
                    className={styles.guardar}
                >{guardando ? 'Guardando…' : 'Guardar'}</button>
                {hayAlgo && (
                    <button
                        type="button" onClick={borrarTodo} disabled={guardando}
                        className={styles.borrar}
                    >Borrar todo</button>
                )}
            </div>
        </div>
    )
}
