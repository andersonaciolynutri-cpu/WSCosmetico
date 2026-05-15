import { supabase } from '../lib/supabaseClient';
import { Order, OrderItem, CartItem, CustomerData } from '../types';

export const orderService = {
  async createOrder(customer: CustomerData, cart: CartItem[], total: number) {
    // Format full address string
    const addressParts = [];
    if (customer.street) addressParts.push(customer.street);
    if (customer.number) addressParts.push(`, ${customer.number}`);
    if (customer.complement) addressParts.push(` ${customer.complement}`);
    if (customer.neighborhood) addressParts.push(` - ${customer.neighborhood}`);
    if (customer.city || customer.state) {
      const location = [customer.city, customer.state].filter(Boolean).join('/');
      addressParts.push(`, ${location}`);
    }
    if (customer.zipCode) addressParts.push(` - CEP ${customer.zipCode}`);

    const fullAddress = addressParts.join('').trim() || customer.address;

    // 1. Create Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_name: customer.name,
          customer_document: customer.document,
          customer_phone: customer.phone,
          customer_email: customer.email,
          customer_address: fullAddress,
          customer_zip_code: customer.zipCode,
          customer_street: customer.street,
          customer_number: customer.number,
          customer_complement: customer.complement,
          customer_neighborhood: customer.neighborhood,
          customer_city: customer.city,
          customer_state: customer.state,
          customer_reference: customer.reference,
          payment_method: customer.paymentMethod,
          change_for: customer.changeFor,
          observations: customer.observations,
          total: total,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create Order Items
    const orderItems = cart.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order as Order;
  },

  async updateOrderPdf(orderId: string, pdfUrl: string, pdfPath: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ pdf_url: pdfUrl, pdf_path: pdfPath })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  },
};
