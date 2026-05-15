/**
 * Valida o tipo da imagem.
 */
export const validateImageType = (file: File): string | null => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Selecione uma imagem PNG, JPG ou WebP.';
  }
  return null;
};

/**
 * Converte um arquivo para uma string base64 representativa (Data URL).
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Mantém compatibilidade com o nome antigo se necessário, mas prefere-se usar fileToDataUrl.
 */
export const fileToBase64 = fileToDataUrl;

/**
 * Carrega um arquivo de imagem em um elemento HTMLImageElement.
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calcula as novas dimensões mantendo a proporção.
 */
const calculateSize = (originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number) => {
  let width = originalWidth;
  let height = originalHeight;

  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  return { width, height };
};

/**
 * Converte um DataURL para Blob.
 */
export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const res = await fetch(dataUrl);
  return res.blob();
};

/**
 * Processa a imagem para ser quadrada (1024x1024) sem distorcer, centralizada.
 */
export async function processLogoToSquare(dataUrlOrFile: string | File, size = 1024): Promise<string> {
  let src: string;
  if (dataUrlOrFile instanceof File) {
    src = URL.createObjectURL(dataUrlOrFile);
  } else {
    src = dataUrlOrFile;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível processar a imagem.'));
        return;
      }

      // Limpa canvas (preserva transparência)
      ctx.clearRect(0, 0, size, size);

      const scale = Math.min(size / img.width, size / img.height);
      const width = img.width * scale;
      const height = img.height * scale;
      const x = (size - width) / 2;
      const y = (size - height) / 2;

      ctx.drawImage(img, x, y, width, height);
      
      const result = canvas.toDataURL('image/webp', 0.9);
      if (dataUrlOrFile instanceof File) {
        URL.revokeObjectURL(src);
      }
      resolve(result);
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Comprime uma imagem para que fique abaixo do tamanho máximo em MB e converte para WebP.
 */
export async function compressImageToMaxSize(file: File, maxSizeMB = 2): Promise<string> {
  const typeError = validateImageType(file);
  if (typeError) throw new Error(typeError);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const image = await loadImage(file);

  let maxWidth = 1600;
  let maxHeight = 1600;
  let quality = 0.8;
  let dataUrl = "";

  // Tenta comprimir em até 10 iterações
  for (let attempt = 0; attempt < 5; attempt++) {
    const { width, height } = calculateSize(image.width, image.height, maxWidth, maxHeight);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível processar a imagem.");

    ctx.drawImage(image, 0, 0, width, height);

    // Converte para WebP (fallback para JPEG se não suportado)
    dataUrl = canvas.toDataURL("image/webp", quality);
    if (!dataUrl.startsWith("data:image/webp")) {
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    // Estimativa de tamanho em bytes da DataURL
    const sizeInBytes = Math.round((dataUrl.length * 3) / 4);

    if (sizeInBytes <= maxSizeBytes && attempt >= 0) {
      URL.revokeObjectURL(image.src);
      return dataUrl;
    }

    // Se ainda for muito grande, reduz qualidade ou dimensões
    quality -= 0.15;
    maxWidth = Math.round(maxWidth * 0.8);
    maxHeight = Math.round(maxHeight * 0.8);
  }

  URL.revokeObjectURL(image.src);
  return dataUrl;
}
