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
 * Comprime uma imagem para que fique abaixo do tamanho máximo em MB.
 */
export async function compressImageToMaxSize(file: File, maxSizeMB = 2): Promise<string> {
  const typeError = validateImageType(file);
  if (typeError) throw new Error(typeError);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Se já estiver abaixo do limite, retorna convertida para DataURL diretamente
  if (file.size <= maxSizeBytes) {
    return fileToDataUrl(file);
  }

  const image = await loadImage(file);

  let maxWidth = 1200;
  let maxHeight = 1200;
  let quality = 0.9;
  let dataUrl = "";

  // Tenta comprimir em até 10 iterações
  for (let attempt = 0; attempt < 10; attempt++) {
    const { width, height } = calculateSize(image.width, image.height, maxWidth, maxHeight);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível processar a imagem.");

    ctx.drawImage(image, 0, 0, width, height);

    // Converte para JPEG para melhor taxa de compressão
    dataUrl = canvas.toDataURL("image/jpeg", quality);

    // Estimativa de tamanho em bytes da DataURL
    const sizeInBytes = Math.round((dataUrl.length * 3) / 4);

    if (sizeInBytes <= maxSizeBytes) {
      URL.revokeObjectURL(image.src);
      return dataUrl;
    }

    // Se ainda for muito grande, reduz qualidade ou dimensões
    if (quality > 0.6) {
      quality -= 0.1;
    } else {
      maxWidth = Math.round(maxWidth * 0.85);
      maxHeight = Math.round(maxHeight * 0.85);
      quality = 0.85;
    }
  }

  URL.revokeObjectURL(image.src);
  return dataUrl;
}
