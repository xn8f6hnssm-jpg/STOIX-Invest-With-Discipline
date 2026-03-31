/**
 * Rules Synchronization Utility
 * Ensures rules are always properly synced between storage and current user
 */

import { storage } from './storage';

export function syncRulesForCurrentUser(): void {
  const currentUser = storage.getCurrentUser();
  if (!currentUser) {
    console.error('❌ Cannot sync rules: No current user found');
    return;
  }

  console.log('🔄 Starting rules sync for user:', currentUser.id);

  // Get all rules from storage
  const allRules = storage.getRules();
  const myRules = allRules.filter(r => r.userId === currentUser.id);

  console.log(`📊 Found ${myRules.length} rules for user ${currentUser.id} out of ${allRules.length} total rules`);

  // Update user.rules array with latest rule titles
  const ruleStrings = myRules.map(r => r.title);
  storage.updateCurrentUser({
    rules: ruleStrings
  });

  console.log('✅ Rules synced successfully');
}

/**
 * Force reload rules from localStorage
 * Useful for debugging and recovery
 */
export function forceReloadRules(): { success: boolean; rulesCount: number } {
  try {
    const rawRules = localStorage.getItem('tradeforge_rules');
    console.log('🔍 Raw rules from localStorage:', rawRules);

    if (!rawRules) {
      console.warn('⚠️ No rules found in localStorage');
      return { success: false, rulesCount: 0 };
    }

    const allRules = JSON.parse(rawRules);
    console.log('📦 Parsed rules:', allRules);

    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
      console.error('❌ No current user');
      return { success: false, rulesCount: 0 };
    }

    const myRules = allRules.filter((r: any) => r.userId === currentUser.id);
    console.log(`✅ Found ${myRules.length} rules for user ${currentUser.id}`);

    // Sync with user object
    syncRulesForCurrentUser();

    return { success: true, rulesCount: myRules.length };
  } catch (error) {
    console.error('❌ Error force reloading rules:', error);
    return { success: false, rulesCount: 0 };
  }
}

/**
 * Check if rules are properly loaded
 * Returns diagnostic information
 */
export function diagnoseRulesIssue(): {
  hasCurrentUser: boolean;
  currentUserId: string | null;
  totalRulesInStorage: number;
  rulesForCurrentUser: number;
  userIdsWithRules: string[];
  diagnosis: string;
} {
  const currentUser = storage.getCurrentUser();
  const allRules = storage.getRules();
  const userIdsWithRules = [...new Set(allRules.map(r => r.userId))];

  const hasCurrentUser = !!currentUser;
  const currentUserId = currentUser?.id || null;
  const totalRulesInStorage = allRules.length;
  const rulesForCurrentUser = currentUser 
    ? allRules.filter(r => r.userId === currentUser.id).length 
    : 0;

  let diagnosis = '';

  if (!hasCurrentUser) {
    diagnosis = '❌ No current user logged in';
  } else if (totalRulesInStorage === 0) {
    diagnosis = '❌ No rules in storage at all';
  } else if (rulesForCurrentUser === 0) {
    if (userIdsWithRules.length > 0) {
      diagnosis = `❌ Rules exist but for different user IDs: ${userIdsWithRules.join(', ')}. Current user is: ${currentUserId}`;
    } else {
      diagnosis = '❌ Rules in storage but no userId set on them';
    }
  } else {
    diagnosis = `✅ Found ${rulesForCurrentUser} rules for current user`;
  }

  return {
    hasCurrentUser,
    currentUserId,
    totalRulesInStorage,
    rulesForCurrentUser,
    userIdsWithRules,
    diagnosis
  };
}

/**
 * Attempt to recover orphaned rules
 * If rules exist but with wrong user ID, migrate them to current user
 */
export function recoverOrphanedRules(): { success: boolean; migratedCount: number } {
  const currentUser = storage.getCurrentUser();
  if (!currentUser) {
    return { success: false, migratedCount: 0 };
  }

  const allRules = storage.getRules();
  const myRules = allRules.filter(r => r.userId === currentUser.id);

  // If we already have rules, no need to recover
  if (myRules.length > 0) {
    return { success: true, migratedCount: 0 };
  }

  // Check if there are orphaned rules (rules with no matching user)
  const allUsers = storage.getAllUsers();
  const validUserIds = allUsers.map(u => u.id);

  const orphanedRules = allRules.filter(r => !validUserIds.includes(r.userId));

  if (orphanedRules.length === 0) {
    return { success: false, migratedCount: 0 };
  }

  console.log(`🔧 Found ${orphanedRules.length} orphaned rules. Migrating to current user...`);

  // Migrate orphaned rules to current user
  const updatedRules = allRules.map(rule => {
    if (!validUserIds.includes(rule.userId)) {
      return { ...rule, userId: currentUser.id };
    }
    return rule;
  });

  localStorage.setItem('tradeforge_rules', JSON.stringify(updatedRules));
  
  // Sync with user object
  syncRulesForCurrentUser();

  console.log(`✅ Migrated ${orphanedRules.length} rules to user ${currentUser.id}`);

  return { success: true, migratedCount: orphanedRules.length };
}
