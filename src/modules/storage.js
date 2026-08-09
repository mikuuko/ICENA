import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { showToast } from '../ui/toast.js';

// Upload image file to Supabase Private Bucket "user-uploads"
export async function uploadImage(file, folderType = 'general') {
  if (!state.user) {
    showToast('กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพค่ะ', 'warning');
    return { success: false, error: 'Not authenticated' };
  }

  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
    const filePath = `${state.user.id}/${folderType}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      showToast('อัปโหลดรูปภาพไม่สำเร็จ: ' + error.message, 'error');
      return { success: false, error };
    }

    return { success: true, path: data.path };
  } catch (err) {
    console.error('Unexpected storage upload error:', err);
    showToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ', 'error');
    return { success: false, error: err };
  }
}

// Generate temporary Signed URL for private storage object (Rule #9: NO getPublicUrl)
export async function getSignedImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  try {
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .createSignedUrl(path, 3600); // Signed URL valid for 1 hour

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Unexpected error creating signed URL:', err);
    return null;
  }
}
