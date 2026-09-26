const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        // Obtenemos los últimos 5 eventos
        const { data: historial, error } = await supabase
            .from('events')
            .select('*')
            .order('id', { ascending: false })
            .limit(5);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // Si no hay datos, asumimos que hay luz por defecto
        const estadoActual = historial.length > 0 ? historial[0] : { luz: true };

        return res.status(200).json({
            actual: estadoActual,
            historial: historial || []
        });
    }

    return res.status(405).json({ error: "Método no permitido" });
};