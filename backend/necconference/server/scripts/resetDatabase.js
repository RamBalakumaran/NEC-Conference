#!/usr/bin/env node
/**
 * Reset Database Script
 * Safely drops and recreates all Sequelize models
 * Use this to resolve "too many keys" MySQL errors
 * 
 * Usage: node scripts/resetDatabase.js
 */

const { sequelize } = require('../config/db');
require('../model/index'); // Load all models

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');
    console.log('⚠️  This will DROP all tables and recreate them');
    
    // Drop all tables with { force: true }
    await sequelize.sync({ force: true });
    
    console.log('✅ Database reset successfully!');
    console.log('📝 All tables have been dropped and recreated fresh.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();
