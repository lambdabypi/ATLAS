// src/lib/utils/validation.js
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateAge(age) {
  const numAge = parseInt(age);
  return !isNaN(numAge) && numAge >= 0 && numAge <= 150;
}

export function validateRequired(value) {
  return value && value.toString().trim().length > 0;
}

export function validateBloodPressure(bp) {
  if (!bp) return false;
  const bpRegex = /^\d{2,3}\/\d{2,3}$/;
  return bpRegex.test(bp);
}

export function validateTemperature(temp) {
  const numTemp = parseFloat(temp);
  return !isNaN(numTemp) && numTemp >= 30 && numTemp <= 45; // Celsius
}
