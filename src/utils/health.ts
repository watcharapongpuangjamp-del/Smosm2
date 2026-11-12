/**
 * Health assessment utilities according to Thai Ministry of Public Health guidelines
 */

export interface BmiResult {
  bmi: number;
  label: string;
  colorClass: string;
  bgClass: string;
}

export function calculateBmi(weightKg: number, heightCm: number): BmiResult | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  // Asian / Thai MOPH BMI standard
  if (bmi < 18.5) {
    return { bmi, label: 'ผอม/น้ำหนักน้อย', colorClass: 'text-amber-700', bgClass: 'bg-amber-100 border-amber-200' };
  } else if (bmi <= 22.9) {
    return { bmi, label: 'ปกติ/สมส่วน', colorClass: 'text-emerald-700', bgClass: 'bg-emerald-100 border-emerald-200' };
  } else if (bmi <= 24.9) {
    return { bmi, label: 'น้ำหนักเกิน/ท้วม', colorClass: 'text-amber-800', bgClass: 'bg-amber-100 border-amber-300' };
  } else if (bmi <= 29.9) {
    return { bmi, label: 'อ้วนระดับ 1', colorClass: 'text-orange-700', bgClass: 'bg-orange-100 border-orange-200' };
  } else {
    return { bmi, label: 'อ้วนระดับ 2 (อันตราย)', colorClass: 'text-rose-700', bgClass: 'bg-rose-100 border-rose-300' };
  }
}

export interface BpResult {
  label: string;
  status: 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';
  colorClass: string;
  badgeClass: string;
}

export function evaluateBloodPressure(systolic?: number, diastolic?: number): BpResult | null {
  if (!systolic || !diastolic) return null;

  if (systolic >= 180 || diastolic >= 120) {
    return {
      label: 'วิกฤตความดันโลหิตสูง (ส่งต่อด่วน)',
      status: 'crisis',
      colorClass: 'text-rose-800 font-bold',
      badgeClass: 'bg-rose-600 text-white',
    };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      label: 'ความดันสูง ระดับ 2',
      status: 'stage2',
      colorClass: 'text-rose-600 font-semibold',
      badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300',
    };
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return {
      label: 'ความดันสูง ระดับ 1',
      status: 'stage1',
      colorClass: 'text-amber-700 font-semibold',
      badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
    };
  }
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return {
      label: 'เริ่มสูง (เฝ้าระวัง)',
      status: 'elevated',
      colorClass: 'text-yellow-700',
      badgeClass: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    };
  }
  return {
    label: 'ความดันปกติ',
    status: 'normal',
    colorClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  };
}

export function evaluateBloodSugar(dtx?: number): { label: string; badgeClass: string } | null {
  if (!dtx) return null;
  if (dtx >= 126) {
    return { label: `เสี่ยงเบาหวานสูง (${dtx} mg/dL)`, badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300' };
  } else if (dtx >= 100) {
    return { label: `กลุ่มเสี่ยงเบาหวาน (${dtx} mg/dL)`, badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300' };
  } else if (dtx < 70) {
    return { label: `น้ำตาลต่ำ (${dtx} mg/dL)`, badgeClass: 'bg-purple-100 text-purple-800 border border-purple-300' };
  }
  return { label: `น้ำตาลปกติ (${dtx} mg/dL)`, badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
}

export const CARE_CATEGORY_CONFIG = {
  active: {
    label: 'ติดสังคม (ช่วยเหลือตัวเองได้ดี)',
    shortLabel: 'ติดสังคม',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    dotColor: '#10b981',
  },
  homebound: {
    label: 'ติดบ้าน (ต้องมีผู้ดูแลบางส่วน)',
    shortLabel: 'ติดบ้าน',
    color: 'amber',
    badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
    dotColor: '#f59e0b',
  },
  bedridden: {
    label: 'ติดเตียง (ช่วยเหลือตัวเองไม่ได้/ต้องดูแลใกล้ชิด)',
    shortLabel: 'ติดเตียง',
    color: 'rose',
    badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
    dotColor: '#ef4444',
  },
};
