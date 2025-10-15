// src/lib/db/reference.js
import db from './index';

/**
 * Database operations for medical reference data
 * Consolidates medications, conditions, and guidelines
 */
export const referenceDb = {
  // Medication operations
  async searchMedications(query) {
    return await db.medications
      .filter(med =>
        med.name.toLowerCase().includes(query.toLowerCase()) ||
        med.indications.some(i => i.toLowerCase().includes(query.toLowerCase()))
      )
      .toArray();
  },

  async getMedicationById(id) {
    return await db.medications.get(id);
  },

  async getAllMedications() {
    return await db.medications.toArray();
  },

  // Condition operations
  async searchConditions(query) {
    return await db.conditions
      .filter(condition =>
        condition.name.toLowerCase().includes(query.toLowerCase()) ||
        condition.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
      )
      .toArray();
  },

  async getConditionById(id) {
    return await db.conditions.get(id);
  },

  async getAllConditions() {
    return await db.conditions.toArray();
  },

  // Guideline operations
  async searchGuidelines(query) {
    return await db.guidelines
      .filter(guide =>
        guide.title.toLowerCase().includes(query.toLowerCase()) ||
        guide.content.toLowerCase().includes(query.toLowerCase())
      )
      .toArray();
  },

  async getGuidelinesByCategory(category) {
    return await db.guidelines
      .where('category')
      .equals(category)
      .toArray();
  },

  async getGuidelineById(id) {
    return await db.guidelines.get(id);
  },

  async getAllGuidelines() {
    return await db.guidelines.toArray();
  }
};
