import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejo de solicitudes OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Crear un cliente Supabase usando las variables de entorno
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verificar la autenticación del usuario
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obtener todas las operaciones del usuario
    const { data: trades, error: tradesError } = await supabaseClient
      .from("trades")
      .select("*")
      .eq("user_id", user.id);

    if (tradesError) {
      return new Response(
        JSON.stringify({ error: "Error al obtener las operaciones" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Formatear los datos para la API de IA
    const tradesData = JSON.stringify(trades);

    // Construir el prompt maestro
    const prompt = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Eres un analista experto en trading que ayuda a traders a mejorar su desempeño. 
          Analiza el historial de operaciones y proporciona insights valiosos.`
        },
        {
          role: "user",
          content: `Analiza estas operaciones de trading y proporciona un análisis detallado:
          ${tradesData}
          
          Responde con un JSON con el siguiente formato:
          {
            "resumen": "Un resumen general del desempeño del trader",
            "fortalezas": ["Fortaleza 1", "Fortaleza 2", ...],
            "areas_mejora": ["Área de mejora 1", "Área de mejora 2", ...],
            "consejos": ["Consejo 1", "Consejo 2", ...],
            "patron_emocional": "Análisis del patrón emocional basado en las operaciones"
          }`
        }
      ]
    };

    // Placeholder para la llamada a la API de IA
    // En producción, reemplazar con la URL y API Key reales
    const AI_API_URL = "https://api.openai.com/v1/chat/completions";
    const AI_API_KEY = "sk-placeholder-api-key";

    // Simular respuesta de IA para desarrollo
    // En producción, descomentar el código para hacer la llamada real a la API
    /*
    const aiResponse = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify(prompt)
    });

    const aiData = await aiResponse.json();
    const analysisResult = JSON.parse(aiData.choices[0].message.content);
    */

    // Respuesta simulada para desarrollo
    const analysisResult = {
      resumen: "El trader muestra un desempeño mixto con algunas operaciones rentables y otras con pérdidas.",
      fortalezas: [
        "Buena selección de símbolos rentables",
        "Disciplina en el seguimiento de reglas en la mayoría de operaciones",
        "Capacidad para obtener ganancias consistentes en ciertos activos"
      ],
      areas_mejora: [
        "Gestión del tamaño de posición en operaciones con pérdidas",
        "Consistencia en el seguimiento de reglas",
        "Diversificación de activos"
      ],
      consejos: [
        "Establecer un límite máximo de pérdida por operación",
        "Documentar más detalladamente las razones de entrada y salida",
        "Revisar y ajustar la estrategia para los símbolos con peor desempeño"
      ],
      patron_emocional: "Se observa cierta tendencia a mantener posiciones perdedoras por más tiempo que las ganadoras, lo que podría indicar un sesgo de aversión a las pérdidas."
    };

    // Devolver el resultado del análisis
    return new Response(
      JSON.stringify(analysisResult),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});