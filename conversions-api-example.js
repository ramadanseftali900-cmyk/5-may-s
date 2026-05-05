// =============================================
// META CONVERSIONS API - BACKEND ENDPOINT ÖRNEĞİ
// =============================================
// Bu dosya Node.js/Express sunucunuzda kullanılacak
// Vercel, Netlify Functions veya kendi sunucunuzda çalıştırabilirsiniz

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Meta Conversions API ayarları
const FACEBOOK_ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN'; // Meta Business hesabınızdan alın
const FACEBOOK_PIXEL_ID = 'YOUR_PIXEL_ID'; // Pixel ID'nizi buraya yazın
const CONVERSIONS_API_URL = `https://graph.facebook.com/v18.0/${FACEBOOK_PIXEL_ID}/events`;

// IP adresini hash'le (GDPR uyumluluğu için)
function hashData(data) {
    if (!data) return null;
    return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

// Conversions API endpoint'i
app.post('/api/conversions', async (req, res) => {
    try {
        const { data, pixel_id } = req.body;
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ error: 'Geçersiz event data' });
        }
        
        // Client IP adresini al
        const clientIP = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress ||
                        (req.connection.socket ? req.connection.socket.remoteAddress : null);
        
        // Event data'yı hazırla
        const processedData = data.map(event => {
            // User data'yı hash'le
            const userData = {
                ...event.user_data,
                client_ip_address: hashData(clientIP),
                client_user_agent: event.user_data.client_user_agent
            };
            
            // Event'i formatla
            return {
                event_name: event.event_name,
                event_time: event.event_time,
                action_source: event.action_source || 'website',
                event_source_url: event.event_source_url,
                user_data: userData,
                custom_data: event.custom_data || {}
            };
        });
        
        // Meta Conversions API'ye gönder
        const response = await axios.post(CONVERSIONS_API_URL, {
            data: processedData,
            access_token: FACEBOOK_ACCESS_TOKEN
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Conversions API başarılı:', response.data);
        
        res.json({
            success: true,
            events_received: response.data.events_received || processedData.length,
            fbtrace_id: response.data.fbtrace_id
        });
        
    } catch (error) {
        console.error('❌ Conversions API hatası:', error.response?.data || error.message);
        
        res.status(500).json({
            success: false,
            error: error.response?.data?.error?.message || error.message
        });
    }
});

// Test endpoint'i
app.get('/api/conversions/test', (req, res) => {
    res.json({
        message: 'Conversions API endpoint çalışıyor',
        timestamp: new Date().toISOString(),
        pixel_id: FACEBOOK_PIXEL_ID ? 'Ayarlanmış' : 'Ayarlanmamış',
        access_token: FACEBOOK_ACCESS_TOKEN ? 'Ayarlanmış' : 'Ayarlanmamış'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Conversions API sunucusu ${PORT} portunda çalışıyor`);
});

// =============================================
// KURULUM TALİMATLARI
// =============================================

/*
1. GEREKLI PAKETLER:
   npm install express axios

2. META ACCESS TOKEN ALMA:
   - https://business.facebook.com/settings/system-users
   - System User oluşturun
   - "Ads Management" yetkisi verin
   - Access token oluşturun
   - Token'ı yukarıdaki FACEBOOK_ACCESS_TOKEN'a yazın

3. PIXEL ID:
   - Meta Events Manager'dan Pixel ID'nizi alın
   - FACEBOOK_PIXEL_ID'ye yazın

4. VERCEL DEPLOY (Önerilen):
   - vercel.json dosyası oluşturun:
   {
     "functions": {
       "conversions-api-example.js": {
         "runtime": "nodejs18.x"
       }
     },
     "routes": [
       { "src": "/api/(.*)", "dest": "/conversions-api-example.js" }
     ]
   }

5. ENVIRONMENT VARIABLES:
   - Vercel dashboard'da environment variables ekleyin:
     FACEBOOK_ACCESS_TOKEN=your_token_here
     FACEBOOK_PIXEL_ID=your_pixel_id_here

6. TEST:
   - https://your-domain.vercel.app/api/conversions/test
   - Çalışıyorsa pixel-loader.js'deki capiEndpoint'i güncelleyin

7. GÜVENLIK:
   - Access token'ı environment variable olarak saklayın
   - CORS ayarları yapın
   - Rate limiting ekleyin
*/

module.exports = app;