import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Uploads guest identity proof image (Aadhaar / Passport / Driving License)
 * to Supabase Storage bucket 'guest-id-proofs' and returns the CDN public URL.
 */
export async function uploadGuestIdProof(file, guestPhone) {
  if (!file) return { url: null, error: 'No file provided' };

  if (!isSupabaseConfigured) {
    // Local-first fallback for offline / demo environments
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ url: reader.result, error: null, isLocal: true });
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    const cleanPhone = (guestPhone || 'unknown').replace(/[^0-9]/g, '');
    const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `${cleanPhone}-${Date.now()}.${fileExt}`;
    const filePath = `id-cards/${fileName}`;

    const { data, error } = await supabase.storage
      .from('guest-id-proofs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('guest-id-proofs')
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null, isLocal: false };
  } catch (err) {
    console.error('Supabase storage upload error:', err);
    return { url: null, error: err.message };
  }
}
