const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        
        // Traemos hasta 200 eventos ordenados del más viejo al más nuevo
        // Esto es vital para el algoritmo de emparejamiento cronológico.
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('timestamp', { ascending: true })
            .limit(200);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        let cortesCompletos = [];
        let corteActual = null;
        let estadoUltimo = { luz: true, timestamp: new Date().toISOString() };

        if (data && data.length > 0) {
            // Recorremos el historial en orden cronológico
            data.forEach(evt => {
                estadoUltimo = evt; // Guardamos el estado más reciente
                
                if (evt.luz === false) {
                    // Inicia un nuevo corte
                    corteActual = { 
                        corte: evt.timestamp, 
                        regreso: null, 
                        duracionMs: null 
                    };
                } else if (evt.luz === true && corteActual !== null) {
                    // La luz regresó, cerramos el paquete y calculamos duración
                    corteActual.regreso = evt.timestamp;
                    corteActual.duracionMs = new Date(evt.timestamp).getTime() - new Date(corteActual.corte).getTime();
                    
                    // Solo guardamos si la duración tiene sentido (mayor a 1 minuto) para evitar ruido
                    if (corteActual.duracionMs > 60000) {
                        cortesCompletos.push(corteActual);
                    }
                    corteActual = null;
                }
            });
        }

        let promedioMs = 0;
        if (cortesCompletos.length > 0) {
            const sumaTotal = cortesCompletos.reduce((acc, c) => acc + c.duracionMs, 0);
            promedioMs = sumaTotal / cortesCompletos.length;
        }

        // Preparamos el historial para la web (volteamos para mostrar lo más nuevo arriba)
        let historialVisual = [...cortesCompletos].reverse();
        
        // Si actualmente estamos sin luz (corte no cerrado), lo ponemos de primero
        if (corteActual !== null) {
            historialVisual.unshift(corteActual);
        }

        return res.status(200).json({
            actual: estadoUltimo,
            estadisticas: {
                promedioMs: promedioMs,
                totalCortes: cortesCompletos.length
            },
            historial: historialVisual
        });
    }

    return res.status(405).json({ error: "Método no permitido" });
};