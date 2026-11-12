/**
 * Thai National ID (เลขประจำตัวประชาชน 13 หลัก) Validation and Formatting
 */

export function validateThaiCitizenId(id: string): { isValid: boolean; message?: string } {
  // Strip non-digits
  const cleanId = id.replace(/\D/g, '');

  if (cleanId.length === 0) {
    return { isValid: false, message: 'กรุณากรอกเลขบัตรประชาชน' };
  }

  if (cleanId.length !== 13) {
    return { isValid: false, message: 'เลขประจำตัวประชาชนต้องมี 13 หลัก' };
  }

  // Check sum algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId.charAt(i), 10) * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;
  const lastDigit = parseInt(cleanId.charAt(12), 10);

  if (checkDigit !== lastDigit) {
    return { isValid: false, message: 'เลขประจำตัวประชาชนไม่ถูกต้อง (Checksum ไม่ผ่าน)' };
  }

  return { isValid: true };
}

export function formatThaiCitizenId(id: string): string {
  const clean = id.replace(/\D/g, '').slice(0, 13);
  if (clean.length === 0) return '';
  
  const parts = [];
  if (clean.length > 0) parts.push(clean.substring(0, 1));
  if (clean.length > 1) parts.push(clean.substring(1, 5));
  if (clean.length > 5) parts.push(clean.substring(5, 10));
  if (clean.length > 10) parts.push(clean.substring(10, 12));
  if (clean.length > 12) parts.push(clean.substring(12, 13));
  
  return parts.join('-');
}

export function calculateAge(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function formatThaiDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
  } catch {
    return dateStr;
  }
}
