/**
 * Quick debug utility to check rules in console
 * Use this in browser console: window.debugRules()
 */

import { storage } from './storage';

export function debugRules() {
  console.log('======================');
  console.log('🔍 RULES DEBUG REPORT');
  console.log('======================');
  
  const currentUser = storage.getCurrentUser();
  const allRules = storage.getRules();
  const allUsers = storage.getAllUsers();
  
  console.log('\n📊 SUMMARY:');
  console.log(`Total rules in storage: ${allRules.length}`);
  console.log(`Total users: ${allUsers.length}`);
  console.log(`Current user ID: ${currentUser?.id || 'NONE'}`);
  
  console.log('\n👤 CURRENT USER:');
  console.log(currentUser);
  
  console.log('\n📝 ALL RULES:');
  allRules.forEach((rule, index) => {
    console.log(`[${index + 1}] ${rule.title} (userId: ${rule.userId})`);
  });
  
  console.log('\n👥 ALL USERS:');
  allUsers.forEach((user, index) => {
    console.log(`[${index + 1}] ${user.email} (id: ${user.id})`);
  });
  
  if (currentUser) {
    const myRules = allRules.filter(r => r.userId === currentUser.id);
    console.log(`\n✅ Rules for current user (${currentUser.email}): ${myRules.length}`);
    myRules.forEach((rule, index) => {
      console.log(`  [${index + 1}] ${rule.title}`);
    });
  }
  
  const userIdsInRules = [...new Set(allRules.map(r => r.userId))];
  const validUserIds = allUsers.map(u => u.id);
  const orphanedUserIds = userIdsInRules.filter(id => !validUserIds.includes(id));
  
  if (orphanedUserIds.length > 0) {
    console.log('\n⚠️ ORPHANED RULES DETECTED:');
    console.log(`Found rules with non-existent user IDs: ${orphanedUserIds.join(', ')}`);
    const orphanedRules = allRules.filter(r => orphanedUserIds.includes(r.userId));
    console.log(`Number of orphaned rules: ${orphanedRules.length}`);
    orphanedRules.forEach((rule, index) => {
      console.log(`  [${index + 1}] ${rule.title} (orphaned userId: ${rule.userId})`);
    });
  } else {
    console.log('\n✅ No orphaned rules detected');
  }
  
  console.log('\n💾 RAW LOCALSTORAGE:');
  console.log('tradeforge_rules:', localStorage.getItem('tradeforge_rules'));
  console.log('tradeforge_currentUser:', localStorage.getItem('tradeforge_currentUser'));
  
  console.log('\n======================');
  
  return {
    currentUser,
    allRules,
    allUsers,
    orphanedUserIds,
    summary: {
      totalRules: allRules.length,
      totalUsers: allUsers.length,
      currentUserId: currentUser?.id,
      myRulesCount: currentUser ? allRules.filter(r => r.userId === currentUser.id).length : 0,
      hasOrphans: orphanedUserIds.length > 0
    }
  };
}

// Make it available globally for easy debugging
if (typeof window !== 'undefined') {
  (window as any).debugRules = debugRules;
}
