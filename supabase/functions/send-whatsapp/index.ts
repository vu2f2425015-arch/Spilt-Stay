import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone_number, message } = await req.json();

    if (!phone_number || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'phone_number and message are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    if (!accountSid || !authToken || !twilioWhatsAppNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER) are not configured in Supabase secrets',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Normalize and format phone number to E.164 format (defaulting 10-digit numbers to India +91 if missing)
    let cleaned = phone_number.trim().replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = `+91${cleaned}`;
      } else {
        cleaned = `+${cleaned}`;
      }
    }
    const formattedPhone = cleaned;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    // Construct x-www-form-urlencoded params for Twilio API
    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${twilioWhatsAppNumber}`);
    formData.append('To', `whatsapp:${formattedPhone}`);
    formData.append('Body', message);

    // Basic Auth header with Account SID & Auth Token
    const basicAuth = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: data.message || 'Failed to send WhatsApp message via Twilio', twilio_error: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message_sid: data.sid,
        to: data.to,
        status: data.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
