/**
 * Utility functions for formatting phone numbers and launching WhatsApp messages
 */

export const cleanPhoneForWhatsApp = (rawPhone?: string): string => {
  if (!rawPhone) return '';
  // Strip non-digit characters
  let digits = rawPhone.replace(/\D/g, '');
  // Remove leading zeroes if any
  digits = digits.replace(/^0+/, '');
  return digits;
};

export const getWhatsAppUrl = (phone?: string, text?: string): string => {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(text || '');
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
};

export const openWhatsAppMessage = (phone?: string, text?: string) => {
  const url = getWhatsAppUrl(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');
};
