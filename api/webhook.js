const { createClient } = require('@supabase/supabase-js');

// Vercel inyectará estas variables de entorno de forma segura
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
    // Solo permitimos peticiones POST desde tu teléfono
    if (req.method === 'POST') {
        const { luz, timestamp } = req.body;
        
        // Guardamos el evento en la tabla "eventos" de Supabase
        const { error } = await supabase
            .from('events')
            .insert([{ luz: luz, timestamp: timestamp }]);
            
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({ success: true, mensaje: "Guardado en la nube" });
    }
    
    return res.status(405).json({ error: "Método no permitido" });
};