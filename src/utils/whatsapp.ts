import { Order, StoreSettings } from '../types';

export const cleanPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
};

export const formatWhatsAppMessage = (order: Order, settings: StoreSettings): string => {
  const totalFormatted = order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return `Olá, segue um novo pedido da ${settings.companyName}.

*Nº do pedido:* ${order.order_number}
*Cliente:* ${order.customer_name}
*Telefone:* ${order.customer_phone}
*Endereço:* ${order.customer_address || 'Não informado'}
*Forma de Pagamento:* ${order.payment_method || 'Não informada'}${order.payment_method === 'Dinheiro' && order.change_for ? ` (Troco para R$ ${order.change_for.toFixed(2)})` : ''}
*Total:* ${totalFormatted}

O PDF do pedido foi gerado.
Por favor, anexe o arquivo PDF nesta conversa para conferência.`;
};

export const openWhatsApp = (order: Order, settings: StoreSettings) => {
  const message = formatWhatsAppMessage(order, settings);
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = cleanPhoneNumber(settings.whatsappNumber);
  window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
};
