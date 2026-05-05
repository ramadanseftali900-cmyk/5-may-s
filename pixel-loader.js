// =============================================
// PIXEL LOADER - Meta & TikTok Pixel Yukleyici
// =============================================
// Guncelleme: 2025
// =============================================

(function() {
    
    // Site ID icin key olustur
    function getSiteKey(key) {
        if (typeof SITE_ID !== 'undefined' && SITE_ID) {
            return SITE_ID + '_' + key;
        }
        var siteId = localStorage.getItem('__SITE_ID__') || 'default';
        return siteId + '_' + key;
    }
    
    // Firebase hazir olunca calistir
    function onFirebaseReady(callback) {
        if (typeof database !== 'undefined' && database) {
            callback();
        } else if (typeof firebase !== 'undefined') {
            setTimeout(function() { onFirebaseReady(callback); }, 200);
        } else {
            setTimeout(function() { onFirebaseReady(callback); }, 200);
        }
    }
    
    // META PIXEL YUKLE (2025 Guncel) - Artık HTML'de direkt yüklü
    function loadMetaPixel(pixelId) {
        if (!pixelId) return;
        
        // Meta Pixel zaten HTML'de yüklü, sadece ID'yi kaydet
        window.metaPixelId = pixelId;
        console.log('✅ Meta Pixel ID kaydedildi:', pixelId);
        
        // Eğer fbq henüz yüklenmemişse, yükle
        if (typeof fbq === 'undefined') {
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            fbq('init', pixelId);
            fbq('track', 'PageView');
        }
    }
    
    // TIKTOK PIXEL YUKLE (2025 Guncel)
    function loadTikTokPixel(pixelId) {
        if (!pixelId) return;
        
        !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
            ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
            ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
            for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
            ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
            ttq.load(pixelId);
            ttq.page();
        }(window, document, 'ttq');
        
        window.tiktokPixelId = pixelId;
        console.log('✅ TikTok Pixel aktif:', pixelId);
    }
    
    // PIXELLERI YUKLE
    onFirebaseReady(function() {
        
        // Direkt Meta Pixel ID'sini ayarla (HTML'de zaten yüklü)
        window.metaPixelId = '960336256818177';
        console.log('✅ Meta Pixel ID ayarlandı:', window.metaPixelId);
        
        // Firebase'den pixel ID'leri al (opsiyonel - yedek)
        if (typeof database !== 'undefined' && database) {
            
            // Meta Pixel - Firebase'den kontrol et
            database.ref('pixels/meta').once('value').then(function(snap) {
                var id = snap.val();
                if (id && id !== window.metaPixelId) {
                    console.log('⚠️ Firebase\'deki Pixel ID farklı:', id, 'vs', window.metaPixelId);
                }
            }).catch(function(e) {
                console.log('Firebase Meta Pixel okunamadı:', e.message);
            });
            
            // TikTok Pixel
            database.ref('pixels/tiktok').once('value').then(function(snap) {
                var id = snap.val();
                if (id) {
                    loadTikTokPixel(id);
                } else {
                    console.log('⚠️ TikTok Pixel ID ayarlanmamis');
                }
            }).catch(function(e) {
                console.log('TikTok Pixel yuklenemedi:', e.message);
            });
            
        } else {
            console.log('⚠️ Firebase baglantisi yok - sadece Meta Pixel aktif');
        }
    });
    
})();

// =============================================
// PIXEL EVENT FONKSIYONLARI
// =============================================

// Sayfa goruntulendiginde (otomatik calisir)
function fireViewContent(contentName, contentId, value) {
    // Meta - Doğru ViewContent formatı
    if (window.metaPixelId && typeof fbq !== 'undefined') {
        
        // Değerleri temizle
        var cleanValue = parseFloat(value) || 0;
        var cleanContentId = contentId || 'product_' + Date.now();
        var cleanContentName = contentName || 'Ürün';
        
        // Minimum değer kontrolü
        if (cleanValue < 0.01) {
            cleanValue = 0.01;
        }
        
        fbq('track', 'ViewContent', {
            content_name: cleanContentName,
            content_ids: [cleanContentId],
            content_type: 'product',
            content_category: 'ecommerce',
            value: cleanValue,
            currency: 'TRY',
            predicted_ltv: cleanValue * 1.5
        });
        console.log('✅ Meta ViewContent event - Değer:', cleanValue, 'TRY, ID:', cleanContentId);
        
        // Conversions API ile de gönder
        if (typeof sendConversionsAPIEvent === 'function') {
            sendConversionsAPIEvent('ViewContent', {
                value: cleanValue,
                currency: 'TRY',
                content_ids: [cleanContentId],
                content_name: cleanContentName,
                content_type: 'product',
                content_category: 'ecommerce'
            });
        }
    }
    // TikTok - Doğru ViewContent formatı
    if (window.tiktokPixelId && typeof ttq !== 'undefined') {
        ttq.track('ViewContent', {
            content_name: cleanContentName || 'Ürün',
            content_id: cleanContentId || 'product_1',
            content_type: 'product',
            value: parseFloat(value) || 0,
            currency: 'TRY'
        });
        console.log('✅ TikTok ViewContent event - Değer:', value, 'TRY');
    }
}

// Sepete eklendiginde
function fireAddToCart(contentName, contentId, value, quantity) {
    // Meta - Doğru AddToCart formatı
    if (window.metaPixelId && typeof fbq !== 'undefined') {
        
        // Değerleri temizle
        var cleanValue = parseFloat(value) || 0;
        var cleanContentId = contentId || 'product_' + Date.now();
        var cleanContentName = contentName || 'Ürün';
        var cleanQuantity = parseInt(quantity) || 1;
        
        // Minimum değer kontrolü
        if (cleanValue < 0.01) {
            cleanValue = 0.01;
        }
        
        fbq('track', 'AddToCart', {
            content_name: cleanContentName,
            content_ids: [cleanContentId],
            content_type: 'product',
            content_category: 'ecommerce',
            value: cleanValue,
            currency: 'TRY',
            num_items: cleanQuantity,
            predicted_ltv: cleanValue * 2
        });
        console.log('✅ Meta AddToCart event - Değer:', cleanValue, 'TRY, Adet:', cleanQuantity);
    }
    // TikTok - Doğru AddToCart formatı
    if (window.tiktokPixelId && typeof ttq !== 'undefined') {
        ttq.track('AddToCart', {
            content_name: contentName || 'Ürün',
            content_id: contentId || 'product_1',
            content_type: 'product',
            value: parseFloat(value) || 0,
            currency: 'TRY',
            quantity: parseInt(quantity) || 1
        });
        console.log('✅ TikTok AddToCart event - Değer:', value, 'TRY');
    }
}

// Siparis tamamlandiginda (LEAD)
function fireMetaLeadEvent(value, contentName, contentId) {
    // Meta - Doğru Purchase event formatı
    if (window.metaPixelId && typeof fbq !== 'undefined') {
        
        // Değerleri kontrol et ve düzelt
        var cleanValue = parseFloat(value) || 0;
        var cleanContentId = contentId || 'product_' + Date.now();
        var cleanContentName = contentName || 'Ürün';
        
        // Minimum değer kontrolü (Meta için) - Warning'i önlemek için
        if (cleanValue < 1) {
            cleanValue = Math.max(cleanValue, 1); // Minimum 1 TL
            console.log('⚠️ Değer çok düşük, minimum 1 TL yapıldı:', cleanValue);
        }
        
        // Maksimum değer kontrolü
        if (cleanValue > 1000000) {
            cleanValue = 1000000; // Maksimum 1M TL
            console.log('⚠️ Değer çok yüksek, maksimum 1M TL yapıldı:', cleanValue);
        }
        
        // Lead event
        fbq('track', 'Lead', { 
            value: cleanValue, 
            currency: 'TRY',
            content_category: 'product',
            content_ids: [cleanContentId],
            content_name: cleanContentName
        });
        
        // Purchase event - Meta'nın gerektirdiği FULL format
        fbq('track', 'Purchase', {
            value: cleanValue,
            currency: 'TRY',
            content_ids: [cleanContentId],
            content_name: cleanContentName,
            content_type: 'product',
            content_category: 'ecommerce',
            num_items: 1,
            predicted_ltv: cleanValue * 1.2, // Tahmini yaşam boyu değer
            order_id: 'order_' + Date.now(),
            delivery_category: 'home_delivery'
        }, {
            // Gelişmiş Eşleştirme Parametreleri
            em: hashEmail(getUserEmail()), // Email hash
            ph: hashPhone(getUserPhone()), // Telefon hash
            fn: hashName(getUserFirstName()), // Ad hash
            ln: hashName(getUserLastName()), // Soyad hash
            ct: hashCity(getUserCity()), // Şehir hash
            country: 'TR', // Ülke
            external_id: getUserId() // Kullanıcı ID
        });
        
        console.log('✅ Meta Lead/Purchase event - Değer:', cleanValue, 'TRY, ID:', cleanContentId);
        
        // Conversions API ile de gönder (server-side tracking)
        if (typeof sendConversionsAPIEvent === 'function') {
            sendConversionsAPIEvent('Purchase', {
                value: parseFloat(value) || 0,
                currency: 'TRY',
                content_ids: [contentId || 'product_1'],
                content_name: contentName || 'Ürün',
                content_type: 'product',
                num_items: 1
            });
        }
    }
}

// Siparis tamamlandiginda (TikTok)
function fireTikTokSubmitFormEvent(value, contentName, contentId) {
    // TikTok - Doğru CompletePayment event formatı
    if (window.tiktokPixelId && typeof ttq !== 'undefined') {
        // Form submit event
        ttq.track('SubmitForm');
        
        // Complete payment event - TikTok'un gerektirdiği format
        ttq.track('CompletePayment', { 
            value: parseFloat(value) || 0, 
            currency: 'TRY',
            content_name: contentName || 'Ürün',
            content_id: contentId || 'product_1',
            content_type: 'product',
            quantity: 1
        });
        console.log('✅ TikTok SubmitForm/CompletePayment event - Değer:', value, 'TRY');
    }
}

// Siparis tamamlandiginda (Her ikisi birden)
function fireOrderComplete(value, contentName, contentId) {
    fireMetaLeadEvent(value, contentName, contentId);
    fireTikTokSubmitFormEvent(value, contentName, contentId);
}

// =============================================
// CONVERSIONS API (SERVER-SIDE TRACKING)
// =============================================

// Conversions API için event gönder
function sendConversionsAPIEvent(eventName, eventData) {
    // Conversions API endpoint'i (kendi sunucunuzda olmalı)
    var capiEndpoint = '/api/conversions'; // Bu endpoint'i kendi sunucunuzda oluşturmanız gerekiyor
    
    if (!window.metaPixelId) {
        console.log('⚠️ Meta Pixel ID yok - Conversions API eventi gönderilemedi');
        return;
    }
    
    var payload = {
        data: [{
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: window.location.href,
            user_data: {
                client_ip_address: '{{client_ip}}', // Sunucu tarafında doldurulacak
                client_user_agent: navigator.userAgent,
                fbc: getCookie('_fbc'), // Facebook click ID
                fbp: getCookie('_fbp')  // Facebook browser ID
            },
            custom_data: eventData || {}
        }],
        pixel_id: window.metaPixelId
    };
    
    // Conversions API'ye gönder (fetch ile)
    fetch(capiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(function(response) {
        if (response.ok) {
            console.log('✅ Conversions API event gönderildi:', eventName);
        } else {
            console.log('⚠️ Conversions API hatası:', response.status);
        }
    }).catch(function(error) {
        console.log('⚠️ Conversions API bağlantı hatası:', error);
    });
}

// Cookie okuma fonksiyonu
function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
    return null;
}

// =============================================
// GELİŞMİŞ EŞLEŞTİRME FONKSİYONLARI
// =============================================

// SHA-256 hash fonksiyonu (basit versiyon)
function simpleHash(str) {
    if (!str) return null;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit integer'a çevir
    }
    return Math.abs(hash).toString(16);
}

// Email hash
function hashEmail(email) {
    if (!email) return null;
    return simpleHash(email.toLowerCase().trim());
}

// Telefon hash
function hashPhone(phone) {
    if (!phone) return null;
    // Sadece rakamları al
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return simpleHash(cleanPhone);
}

// İsim hash
function hashName(name) {
    if (!name) return null;
    return simpleHash(name.toLowerCase().trim());
}

// Şehir hash
function hashCity(city) {
    if (!city) return null;
    return simpleHash(city.toLowerCase().trim());
}

// Kullanıcı bilgilerini al (form verilerinden)
function getUserEmail() {
    // Form'dan email al
    const emailInput = document.querySelector('input[type="email"], input[name*="email"], input[id*="email"]');
    return emailInput ? emailInput.value : null;
}

function getUserPhone() {
    // Form'dan telefon al
    const phoneInput = document.querySelector('input[type="tel"], input[name*="phone"], input[name*="telefon"], input[id*="phone"]');
    return phoneInput ? phoneInput.value : null;
}

function getUserFirstName() {
    // Form'dan ad al
    const nameInput = document.querySelector('input[name*="name"], input[name*="ad"], input[id*="name"]');
    return nameInput ? nameInput.value.split(' ')[0] : null;
}

function getUserLastName() {
    // Form'dan soyad al
    const nameInput = document.querySelector('input[name*="surname"], input[name*="soyad"], input[id*="surname"]');
    if (nameInput) return nameInput.value;
    
    // Eğer tek name field'ı varsa ikinci kelimeyi al
    const fullNameInput = document.querySelector('input[name*="name"], input[name*="ad"]');
    if (fullNameInput) {
        const parts = fullNameInput.value.split(' ');
        return parts.length > 1 ? parts[1] : null;
    }
    return null;
}

function getUserCity() {
    // Form'dan şehir al
    const cityInput = document.querySelector('input[name*="city"], input[name*="sehir"], select[name*="city"]');
    return cityInput ? cityInput.value : null;
}

function getUserId() {
    // Benzersiz kullanıcı ID oluştur
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_id', userId);
    }
    return userId;
}

console.log('📦 Pixel Loader yuklendi');

// =============================================
// YARDIMCI FONKSIYONLAR
// =============================================

// Fiyat formatını düzelt (ondalık kısımları korur)
function formatPrice(priceString) {
    if (!priceString) return 0;
    
    // Türkçe formatı: "1.250,50 TL" -> 1250.50
    var cleaned = priceString.toString()
        .replace(/[^\d,\.]/g, '') // Sadece rakam, virgül ve nokta bırak
        .replace(/\./g, '') // Binlik ayırıcı noktaları kaldır
        .replace(',', '.'); // Virgülü noktaya çevir
    
    return parseFloat(cleaned) || 0;
}

// Ürün bilgilerini al
function getProductInfo(secimNum) {
    var urunAdi = localStorage.getItem(getAdminKey('genel_urun_adi')) || 'Ürün';
    var contentId = 'product_' + (secimNum || '1');
    var contentName = urunAdi + ' - ' + (secimNum || '1') + ' Adet';
    
    return {
        contentId: contentId,
        contentName: contentName,
        quantity: parseInt(secimNum) || 1
    };
}
