
/**
 * Utilitários para edição e processamento de imagens no navegador.
 */

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Retorna as novas dimensões de uma caixa delimitadora após rotação.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Gera o DataURL da imagem cortada e rotacionada.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  outputType = 'image/jpeg'
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Não foi possível obter o contexto do canvas');
  }

  const rotRad = getRadianAngle(rotation);

  // Calcula o tamanho necessário do canvas após a rotação
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Move o contexto para o centro e aplica rotação/espelhamento
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Desenha a imagem original
  ctx.drawImage(image, 0, 0);

  // Cria um novo canvas para o corte final
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Não foi possível obter o contexto do canvas de corte');
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Copia a parte rotacionada para o canvas final
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Retorna a URL final (base64)
  return croppedCanvas.toDataURL(outputType, 0.9);
}

/**
 * Comprime um DataURL (base64) para garantir que fique abaixo de um tamanho máximo (MB).
 */
export async function compressDataUrl(
  dataUrl: string,
  maxSizeMB = 2,
  outputType = 'image/jpeg'
): Promise<string> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  let currentSize = Math.round((dataUrl.length * 3) / 4);

  if (currentSize <= maxSizeBytes) return dataUrl;

  const image = await createImage(dataUrl);
  let quality = 0.9;
  let maxWidth = image.width;
  let maxHeight = image.height;
  let resultDataUrl = dataUrl;

  for (let i = 0; i < 8; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) break;

    ctx.drawImage(image, 0, 0, maxWidth, maxHeight);
    resultDataUrl = canvas.toDataURL(outputType, quality);
    currentSize = Math.round((resultDataUrl.length * 3) / 4);

    if (currentSize <= maxSizeBytes) return resultDataUrl;

    // Reduz qualidade agressivamente na primeira metade, depois reduz dimensões
    if (quality > 0.5) {
      quality -= 0.15;
    } else {
      maxWidth = Math.round(maxWidth * 0.8);
      maxHeight = Math.round(maxHeight * 0.8);
    }
  }

  return resultDataUrl;
}
