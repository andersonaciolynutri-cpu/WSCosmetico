import { jsPDF } from 'jspdf';
import { Order, OrderItem, AppSettings } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helperes de formatação
const formatCurrencyBR = (val: number) => 
  `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatPhoneBR = (phone: string) => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const p = cleaned.slice(2);
    return `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
  }
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const formatCpfCnpj = (doc: string) => {
  if (!doc) return '-';
  const cleaned = doc.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
};

const formatCep = (cep: string) => {
  if (!cep) return '-';
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cep;
};

const formatOrderNumber = (num: number | string | undefined) => {
  if (!num) return '------';
  return String(num).padStart(6, '0');
};

const formatDateTimeBR = (dateStr: string | undefined) => {
  if (!dateStr) return format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

export const orderPdfService = {
  async generateOrderPdf(order: Order, items: OrderItem[], settings: AppSettings): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    const primaryColor = settings.primary_color || '#111827';
    // Helper to set primary color
    const setPrimaryColor = () => {
      const hex = primaryColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      doc.setTextColor(r, g, b);
    };

    let y = 15;

    // --- Header Section ---
    // Logo
    try {
      const logoUrl = settings.logo_url || '/logo.png';
      const logoDataUrl = await this.loadImage(logoUrl);
      const logoAreaSize = 32;
      doc.addImage(logoDataUrl, 'JPEG', margin, y, logoAreaSize, logoAreaSize);
    } catch (e) {
      console.error('Error loading logo for PDF', e);
    }

    // Company Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    setPrimaryColor();
    const textX = margin + 38; // Increased from 30 to accommodate 32mm logo
    doc.text(settings.company_name || 'WS Cosméticos', textX, y + 8);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`WhatsApp: ${formatPhoneBR(settings.whatsapp_number)}`, textX, y + 14);
    doc.text('Rio de Janeiro, RJ', textX, y + 19);

    // Title & Order Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    setPrimaryColor();
    doc.text('PEDIDO DE VENDA', pageWidth - margin, y + 8, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Nº ${formatOrderNumber(order.order_number)}`, pageWidth - margin, y + 15, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(formatDateTimeBR(order.created_at), pageWidth - margin, y + 21, { align: 'right' });

    y += 35;

    // Drawer helper for sections
    const drawSectionHeader = (title: string, yPos: number) => {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setPrimaryColor();
      doc.text(title, margin + 3, yPos + 5.5);
      return yPos + 12;
    };

    // --- Customer Data Section ---
    y = drawSectionHeader('DADOS DO CLIENTE', y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60);
    
    const col2 = margin + (contentWidth / 2);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Nome:', margin + 3, y);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customer_name || '-', margin + 15, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Telefone:', col2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatPhoneBR(order.customer_phone), col2 + 18, y);
    y += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('CPF/CNPJ:', margin + 3, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCpfCnpj(order.customer_document || ''), margin + 22, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('E-mail:', col2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customer_email || '-', col2 + 13, y);
    
    y += 12;

    // --- Delivery Address Section ---
    y = drawSectionHeader('ENDEREÇO DE ENTREGA', y);
    doc.setFontSize(9);
    doc.setTextColor(60);

    if (order.customer_street) {
      doc.setFont('helvetica', 'bold');
      doc.text('Rua:', margin + 3, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${order.customer_street}, nº ${order.customer_number || 'S/N'}${order.customer_complement ? ', ' + order.customer_complement : ''}`, margin + 12, y);
      y += 6;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Bairro:', margin + 3, y);
      doc.setFont('helvetica', 'normal');
      doc.text(order.customer_neighborhood || '-', margin + 15, y);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Cidade/UF:', col2, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${order.customer_city || '-'}/${order.customer_state || '-'}`, col2 + 20, y);
      y += 6;
      
      doc.setFont('helvetica', 'bold');
      doc.text('CEP:', margin + 3, y);
      doc.setFont('helvetica', 'normal');
      doc.text(formatCep(order.customer_zip_code || ''), margin + 12, y);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Referência:', col2, y);
      doc.setFont('helvetica', 'normal');
      doc.text(order.customer_reference || '-', col2 + 20, y);
    } else {
      doc.setFont('helvetica', 'normal');
      const address = order.customer_address || 'Retirada no local ou endereço não informado';
      const splitAddress = doc.splitTextToSize(address, contentWidth - 6);
      doc.text(splitAddress, margin + 3, y);
      y += (splitAddress.length * 5);
    }
    
    y += 12;

    // --- Order Info Section ---
    y = drawSectionHeader('INFORMAÇÕES DO PEDIDO', y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', margin + 3, y);
    doc.setFont('helvetica', 'normal');
    doc.text('Aguardando confirmação', margin + 15, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Pagamento:', col2, y);
    doc.setFont('helvetica', 'normal');
    let paymentDesc = order.payment_method || 'Não informada';
    if (order.payment_method === 'Dinheiro' && order.change_for) {
      paymentDesc += ` (Troco para ${formatCurrencyBR(order.change_for)})`;
    }
    doc.text(paymentDesc, col2 + 22, y);
    
    y += 12;

    // --- Items Table ---
    y = drawSectionHeader('ÍTENS DO PEDIDO', y);
    
    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 4, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setPrimaryColor();
    doc.text('PRODUTO', margin + 3, y + 0.5);
    doc.text('QTD', margin + 110, y + 0.5, { align: 'center' });
    doc.text('VALOR UNIT.', margin + 140, y + 0.5, { align: 'right' });
    doc.text('TOTAL', margin + 170, y + 0.5, { align: 'right' });
    
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);

    items.forEach((item, index) => {
      if (y > 270) {
        doc.addPage();
        // Add footer for the previous page if needed, but the current logic adds it at the end
        y = 30;
      }

      const itemName = item.product_name;
      const splitName = doc.splitTextToSize(itemName, 100);
      
      const lineY = y;
      doc.text(splitName, margin + 3, lineY);
      doc.text(item.quantity.toString(), margin + 110, lineY, { align: 'center' });
      doc.text(formatCurrencyBR(item.unit_price), margin + 140, lineY, { align: 'right' });
      doc.text(formatCurrencyBR(item.total_price), margin + 170, lineY, { align: 'right' });
      
      const rowHeight = Math.max(splitName.length * 5, 7);
      y += rowHeight;

      // Draw light line
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y - 2, margin + contentWidth, y - 2);
      y += 2;
    });

    y += 5;

    // --- Financial Summary ---
    const summaryX = pageWidth - margin - 60;
    const summaryWidth = 60;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', summaryX, y);
    doc.text(formatCurrencyBR(order.total), pageWidth - margin, y, { align: 'right' });
    y += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    setPrimaryColor();
    doc.rect(summaryX - 5, y - 4, summaryWidth + 5, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL GERAL:', summaryX, y + 3);
    doc.text(formatCurrencyBR(order.total), pageWidth - margin, y + 3, { align: 'right' });
    
    y += 15;

    // --- Observations ---
    if (order.observations) {
      if (y > 260) {
        doc.addPage();
        y = 30;
      }
      y = drawSectionHeader('OBSERVAÇÕES DO CLIENTE', y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80);
      const splitObs = doc.splitTextToSize(order.observations, contentWidth - 6);
      doc.text(splitObs, margin + 3, y);
      y += (splitObs.length * 5) + 10;
    }

    // --- Footer ---
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150);
        const footerY = pageHeight - 10;
        doc.text('Pedido gerado automaticamente pelo catálogo WS Cosméticos.', margin, footerY);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
        doc.text('Confirmação sujeita à disponibilidade de estoque.', pageWidth / 2, footerY - 4, { align: 'center' });
    }

    return doc.output('blob');
  },

  loadImage(url: string, size = 512): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(url); // Fallback to original URL
          return;
        }

        // Fundo Branco (Remove transparência que pode virar preto no jsPDF)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        // Calcular escala para manter proporção dentro do quadrado
        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;

        ctx.drawImage(img, x, y, w, h);
        
        // Retorna como JPEG para garantir que não haja transparência
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => {
        // Fallback for logo
        if (!url.endsWith('/logo.png')) {
          img.src = '/logo.png';
        } else {
          reject(new Error('Failed to load image'));
        }
      };
      img.src = url;
    });
  }
};
