/**
 * Genera un número de orden único basado en timestamp
 */
export const generateOrderNumber = (): string => {
  const now = new Date();
  const timestamp = now.getTime().toString().slice(-6);
  return timestamp;
};

/**
 * Genera un tag único de 6 caracteres alfanuméricos
 */
export const generateOrderTag = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let tag = '';
  for (let i = 0; i < 6; i++) {
    tag += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return tag;
};

/**
 * Formatea una fecha en formato DD/MM/YYYY
 */
export const formatDate = (date: Date = new Date()): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formatea una hora en formato HH:MM:SS
 */
export const formatTime = (date: Date = new Date()): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};
