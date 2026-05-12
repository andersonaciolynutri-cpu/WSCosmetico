import { CartItem, CustomerData, StoreSettings } from '../types';

export const cleanPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
};

export const formatWhatsAppMessage = (items: CartItem[], total: number, customer: CustomerData, settings: StoreSettings): string => {
  const itemsList = items
    .map(item => {
      const itemTotal = (item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const unitPrice = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      return `${item.quantity}x ${item.name} - ${item.brand} - ${item.category}\nValor unitário: ${unitPrice}\nTotal: ${itemTotal}`;
    })
    .join('\n\n');

  const totalFormatted = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return `Olá, gostaria de fazer um pedido na ${settings.companyName}.

*Dados do cliente:*
Nome: ${customer.name}
${customer.storeName ? `Loja: ${customer.storeName}` : ''}
${customer.document ? `CPF/CNPJ: ${customer.document}` : ''}
Telefone: ${customer.phone}
${customer.address ? `Endereço: ${customer.address}` : ''}

*Produtos:*
${itemsList}

*Total geral: ${totalFormatted}*

${customer.observation ? `*Observações:* ${customer.observation}` : ''}`;
};

export const openWhatsApp = (items: CartItem[], total: number, customer: CustomerData, settings: StoreSettings) => {
  const message = formatWhatsAppMessage(items, total, customer, settings);
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = cleanPhoneNumber(settings.whatsappNumber);
  window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
};
