import imageCompression from "browser-image-compression";

/**
 * 이미지 초경량화를 위한 압축 유틸리티
 * @param file 압축할 이미지 파일
 * @returns 압축된 이미지 파일
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5, // 0.5MB 이하로 설정하여 아주 가볍게 만듦
    maxWidthOrHeight: 1280, // 최대 해상도 제한
    useWebWorker: true,
    fileType: 'image/webp', // 용량 절감을 위해 webp 포맷 권장 (지원이 안되면 기본 포맷 유지)
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Blob을 다시 File 객체로 변환 (기존 파일 이름과 타입을 유지하되 확장자는 webp로 바뀔 수 있음)
    const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
      type: 'image/webp',
      lastModified: Date.now(),
    });
    
    console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    
    return compressedFile;
  } catch (error) {
    console.error("Compression error:", error);
    return file; // 에러 발생 시 원본 반환
  }
}

/**
 * 썸네일 전용 최적화 URL 생성 (Supabase Transformation 활용)
 * @param url 원본 이미지 URL
 * @param width 가로 너비 (기본 300)
 * @returns 최적화된 URL
 */
export function getThumbnailUrl(url: string | null | undefined, width = 300): string {
  if (!url) return '';
  
  // Supabase Storage URL인 경우 Transformation 적용 (Render API 사용)
  // 예: https://[project].supabase.co/storage/v1/object/public/item-images/image.webp
  // -> https://[project].supabase.co/storage/v1/render/image/public/item-images/image.webp?width=300&quality=75
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return url.replace('/object/public/', '/render/image/public/') + `?width=${width}&quality=75`;
  }

  return url;
}

/**
 * 전상세 페이지용 최적화 URL 생성
 * @param url 원본 이미지 URL
 * @returns 최적화된 URL
 */
export function getOptimizedImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    // 상세 페이지는 고해상도로 유지하되 품질만 살짝 조절
    return url.replace('/object/public/', '/render/image/public/') + '?width=1080&quality=85';
  }
  
  return url;
}
