// Temporary test data for CIS-18 development
// This file should be removed once real data import is implemented

import { CIS18Api } from './cis18-api';

export async function insertTestCIS18Data(organizationId: string, userId: string) {
  const testData = {
    organizationId,
    importedBy: userId,
    importMethod: 'test',
    assessmentDate: new Date(),
    // Generate random scores for demonstration
    control1: Math.floor(Math.random() * 30) + 70,  // 70-100
    control2: Math.floor(Math.random() * 30) + 70,  // 70-100
    control3: Math.floor(Math.random() * 30) + 40,  // 40-70
    control4: Math.floor(Math.random() * 30) + 40,  // 40-70
    control5: Math.floor(Math.random() * 40) + 60,  // 60-100
    control6: Math.floor(Math.random() * 40) + 60,  // 60-100
    control7: Math.floor(Math.random() * 20) + 20,  // 20-40
    control8: Math.floor(Math.random() * 20) + 20,  // 20-40
    control9: Math.floor(Math.random() * 50) + 50,  // 50-100
    control10: Math.floor(Math.random() * 50) + 50, // 50-100
    control11: Math.floor(Math.random() * 30) + 70, // 70-100
    control12: Math.floor(Math.random() * 30) + 40, // 40-70
    control13: Math.floor(Math.random() * 30) + 40, // 40-70
    control14: Math.floor(Math.random() * 40) + 60, // 60-100
    control15: Math.floor(Math.random() * 40) + 60, // 60-100
    control16: Math.floor(Math.random() * 20) + 20, // 20-40
    control17: Math.floor(Math.random() * 50) + 50, // 50-100
    control18: Math.floor(Math.random() * 30) + 70, // 70-100
  };

  // Calculate total score
  const totalScore = CIS18Api.calculateTotalScore(testData);
  
  const assessment = await CIS18Api.createCIS18Assessment({
    ...testData,
    totalScore
  });

  return assessment;
}