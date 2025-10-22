import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, selectedBodyPart, language = 'en' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageMap: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'hi': 'Hindi',
      'ar': 'Arabic',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ta': 'Tamil'
    };

    let systemPrompt = `You are a conservative medical-assistant AI for "I Am Doctor" health web app. You provide evidence-based health information with strict limitations.

CRITICAL REQUIREMENTS:
1. NEVER provide direct diagnoses or prescriptions
2. ALWAYS recommend consulting licensed healthcare professionals for any serious concerns
3. Base answers on verifiable medical sources only
4. Include confidence scores (0-100) based on evidence quality
5. Cite up to 3 trusted medical sources (WHO, Mayo Clinic, medical journals, etc.)
6. Mark urgency levels: LOW, MEDIUM, HIGH, EMERGENCY

RESPONSE STRUCTURE (in ${languageMap[language] || 'English'}):
{
  "anatomical_name": "Medical name of body part",
  "confidence_score": 0-100,
  "urgency": "LOW|MEDIUM|HIGH|EMERGENCY",
  "possible_causes": ["ranked list of 2-4 causes"],
  "red_flags": ["urgent symptoms requiring immediate medical attention"],
  "self_care": ["2-3 immediate non-urgent suggestions"],
  "yoga_suggestions": ["2-3 specific yoga poses with brief instructions"],
  "diet_suggestions": ["2-3 dietary recommendations"],
  "recommended_tests": ["suggested medical investigations if needed"],
  "sources": [{"title": "source name", "link": "URL", "excerpt": "brief quote"}],
  "disclaimer": "This is not medical advice. Consult a licensed healthcare professional."
}

EMERGENCY TRIGGERS: chest pain, difficulty breathing, severe bleeding, loss of consciousness, stroke symptoms
→ Return urgency: "EMERGENCY" and recommend calling emergency services immediately.

If confidence < 65%: Explicitly state "I'm not certain - please consult a specialist" in the response.`;

    if (selectedBodyPart) {
      systemPrompt += `\n\nUSER SELECTED BODY PART: ${selectedBodyPart}. Focus your response on this anatomical region.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
      }
    );
  }
});
