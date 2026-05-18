// Local storage utilities for demo app
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

// Helper function to upload image to Supabase Storage
async function uploadImageToStorage(base64Image: string, userId: string, entryId?: string, fieldName?: string): Promise<string> {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ecfd718d/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({
        base64Image,
        userId,
        entryId,
        fieldName
      })
    });

    if (!response.ok) {
      console.error('Image upload failed:', await response.text());
      return base64Image;
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Image upload error:', error);
    return base64Image;
  }
}

export interface User {
  id: string;
  email: string;
  password: string;
  username: string;
  name: string;
  tradingStyle: string;
  instruments: string[];
  rules: string[];
  totalPoints: number;
  cleanDays: number;
  forfeitDays: number;
  currentStreak: number;
  followers: number;
  following: number;
  isVerified: boolean;
  profilePicture?: string;
  isPremium?: boolean;
  premiumSince?: number;
  // Premium features
  streakSavers?: number;
  streakSaversUsed?: number;
  doubleXPDaysRemaining?: number;
  lastDoubleXPReset?: number;
  activeDoubleXPDate?: string;
  // Achievements
  achievements?: Achievement[];
  // Account Rules (Prop Firm Rules) - Premium Feature
  accountRules?: {
    maxDailyLoss?: number;
    maxOverallDrawdown?: number;
    maxContracts?: number;
    consistencyRules?: string;
  };
  // Account Protection Mode - Premium Feature
  accountProtectionMode?: boolean;
  // Pre-Trade Checklist - Premium Feature
  preTradeChecklistEnabled?: boolean;
  // Custom Strategy Section Name
  strategiesSectionName?: string;
}

export interface Achievement {
  id: string;
  type: 'trophy' | 'medal' | 'star';
  title: string;
  description: string;
  earnedAt: number;
  source: 'group_challenge' | 'milestone' | 'special';
  groupId?: string;
  challengeId?: string;
}

export interface AccountRule {
  id: string;
  title: string;
  description?: string;
  userId: string;
}

export interface Rule {
  id: string;
  userId: string;
  title: string;
  description: string;
  tag: string;
  isCritical?: boolean;
}

export interface DayLog {
  id: string;
  userId: string;
  date: string;
  isClean: boolean;
  photoUrl: string;
  note: string;
  forfeitCompleted?: string;
  pointsEarned: number;
  journalEntry?: string;
  posted: boolean;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  result: 'win' | 'loss' | 'breakeven';
  description: string;
  screenshots?: string[];
  customFields?: Record<string, any>;
  riskReward?: number;
  pnl?: number;
  isNoTradeDay?: boolean;
  pointsAwarded?: boolean;
  timestamp?: number;
  strategyId?: string;
  reflection?: {
    questions: Record<string, string>;
    insights: string[];
  };
  // Investment Thesis fields (for Long Term Hold users)
  assetName?: string;
  action?: 'buy' | 'hold' | 'sell';
  investmentThesis?: string;
  invalidationCondition?: string;
  plannedHoldTime?: string;
  thesisReviewDates?: string[];
  sellReason?: 'thesis_broken' | 'emotional_reaction' | 'planned_exit';
}

export interface JournalFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'checkbox' | 'dropdown' | 'datetime' | 'time' | 'image';
  options?: string[];
}

export interface Strategy {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorUsername: string;
  type: 'free' | 'paid';
  price?: number;
  memberCount: number;
  members: string[];
  admins: string[];
  inviteCode: string;
  isPublic: boolean;
  coverImage?: string;
  createdAt: number;
  challenges?: GroupChallenge[];
  channels?: GroupChannel[];
}

export interface GroupChannel {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: number;
  isDefault?: boolean;
}

export interface GroupMessage {
  id: string;
  channelId: string;
  groupId: string;
  userId: string;
  username: string;
  content: string;
  mentions: string[];
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
    size?: number;
  }[];
  timestamp: number;
  edited?: boolean;
  editedAt?: number;
}

export interface GroupChallenge {
  id: string;
  groupId: string;
  name: string;
  description: string;
  duration: number;
  participants: string[];
  startDate: string;
  endDate: string;
  prize?: string;
  rules: string[];
  leaderboard: { userId: string; points: number; username: string }[];
  status: 'upcoming' | 'active' | 'completed';
  createdBy: string;
  createdAt: number;
}

export interface JoinRequest {
  id: string;
  groupId: string;
  userId: string;
  username: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'withdrawal' | 'refund';
  amount: number;
  source?: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: number;
  withdrawalDetails?: {
    bankName?: string;
    accountLast4?: string;
    processedAt?: number;
  };
}

export interface UserCredits {
  userId: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  transactions: CreditTransaction[];
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  league: string;
  isVerified: boolean;
  type: 'clean' | 'forfeit' | 'general' | 'journal';
  photoUrl: string;
  images?: string[];
  caption: string;
  likes: number;
  comments: Comment[];
  timestamp: number;
  journalData?: {
    result: 'win' | 'loss' | 'breakeven';
    isNoTradeDay?: boolean;
    riskReward?: number;
    date: string;
    customFields: Record<string, any>;
  };
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface Activity {
  id: string;
  userId: string;
  type: 'post' | 'journal' | 'clean_day' | 'forfeit_day';
  description: string;
  timestamp: number;
  relatedId?: string;
}

// Storage keys
const STORAGE_KEYS = {
  CURRENT_USER: 'tradeforge_current_user',
  ALL_USERS: 'tradeforge_all_users',
  RULES: 'tradeforge_rules',
  JOURNAL_ENTRIES: 'tradeforge_journal_entries',
  BACKTESTING_ENTRIES: 'tradeforge_backtesting_entries',
  POSTS: 'tradeforge_posts',
  DAILY_LOGS: 'tradeforge_daily_logs',
  ONBOARDING_COMPLETE: 'tradeforge_onboarding_complete',
  CUSTOM_FIELDS: 'tradeforge_custom_fields',
  ACTIVITIES: 'tradeforge_activities',
  STRATEGIES: 'tradeforge_strategies',
  GROUPS: 'tradeforge_groups',
  JOIN_REQUESTS: 'tradeforge_join_requests',
  CREDIT_TRANSACTIONS: 'tradeforge_credit_transactions',
  USER_CREDITS: 'tradeforge_user_credits',
  GROUP_CHANNELS: 'tradeforge_group_channels',
  GROUP_MESSAGES: 'tradeforge_group_messages',
  CHAT_MESSAGES: 'tradeforge_chat_messages',
  FOLLOWING: 'tradeforge_following',
  MENTAL_PREP_SETTINGS: 'tradeforge_mental_prep_settings',
  AFFIRMATIONS: 'tradeforge_affirmations',
  MENTAL_PREP_TRACKING: 'tradeforge_mental_prep_tracking',
};

// Generate unique ID with timestamp + random suffix
let idCounter = 0;
const generateUniqueId = (): string => {
  idCounter++;
  return `${Date.now()}-${idCounter}-${Math.random().toString(36).substring(2, 9)}`;
};

// Storage management utilities
const getStorageSize = (): number => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
};

const getStorageSizeMB = (): number => {
  return getStorageSize() / (1024 * 1024);
};

const checkStorageSpace = (): { canAdd: boolean; shouldWarn: boolean; sizeMB: number } => {
  const sizeMB = getStorageSizeMB();
  
  if (sizeMB > 2.8) {
    console.log(`⚠️ Storage approaching limit (${sizeMB.toFixed(2)} MB), running cleanup...`);
    cleanupOldData();
    const newSizeMB = getStorageSizeMB();
    return {
      canAdd: newSizeMB < 4.5,
      shouldWarn: newSizeMB > 2.8,
      sizeMB: parseFloat(newSizeMB.toFixed(2))
    };
  }
  
  return {
    canAdd: sizeMB < 4.5,
    shouldWarn: sizeMB > 2.8,
    sizeMB: parseFloat(sizeMB.toFixed(2))
  };
};

const cleanupOldData = () => {
  try {
    console.log(`💾 Storage before cleanup: ${getStorageSizeMB().toFixed(2)} MB`);
    
    try {
      const postsStr = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (postsStr) {
        const posts = JSON.parse(postsStr);
        const cleaned = posts.slice(-10).map((post: any) => ({
          ...post,
          photoUrl: '',
          images: [],
          journalData: post.journalData ? {
            ...post.journalData,
            customFields: {}
          } : undefined
        }));
        localStorage.removeItem(STORAGE_KEYS.POSTS);
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(cleaned));
        console.log(`✅ Cleaned posts: ${posts.length} -> ${cleaned.length} posts (no images)`);
      }
    } catch (postsError) {
      console.log('Posts cleanup failed, deleting entirely');
      localStorage.removeItem(STORAGE_KEYS.POSTS);
    }
    
    try {
      const activitiesStr = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (activitiesStr) {
        const activities = JSON.parse(activitiesStr);
        const cleaned = activities.slice(-15);
        localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(cleaned));
        console.log(`✅ Cleaned activities: ${activities.length} -> ${cleaned.length}`);
      }
    } catch (activitiesError) {
      console.log('Activities cleanup failed, deleting entirely');
      localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    }
    
    try {
      const logsStr = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
      if (logsStr) {
        const logs = JSON.parse(logsStr);
        const cleaned = logs.slice(-30).map((log: DayLog) => ({
          ...log,
          photoUrl: ''
        }));
        localStorage.removeItem(STORAGE_KEYS.DAILY_LOGS);
        localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(cleaned));
        console.log(`✅ Cleaned daily logs: ${logs.length} -> ${cleaned.length} (no photos)`);
      }
    } catch (logsError) {
      console.log('Daily logs cleanup failed, deleting entirely');
      localStorage.removeItem(STORAGE_KEYS.DAILY_LOGS);
    }
    
    try {
      const journalStr = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
      if (journalStr) {
        const entries = JSON.parse(journalStr);
        const cleaned = entries.map((entry: JournalEntry, index: number) => {
          const isRecent = index >= entries.length - 5;
          if (isRecent) return entry;
          return {
            ...entry,
            screenshots: [],
            customFields: entry.customFields ?
              Object.fromEntries(
                Object.entries(entry.customFields).map(([key, value]) => {
                  if (typeof value === 'string' && value.startsWith('data:image')) {
                    return [key, ''];
                  }
                  return [key, value];
                })
              ) : {}
          };
        });
        localStorage.removeItem(STORAGE_KEYS.JOURNAL_ENTRIES);
        localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(cleaned));
        console.log(`✅ Cleaned journal: ${entries.length} entries (kept images for last 5, removed from older)`);
      }
    } catch (journalError) {
      console.log('Journal cleanup failed, trying more aggressive cleanup');
      try {
        const journalStr = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
        if (journalStr) {
          const entries = JSON.parse(journalStr);
          const cleaned = entries.slice(-100).map((entry: JournalEntry) => ({
            id: entry.id,
            userId: entry.userId,
            date: entry.date,
            result: entry.result,
            description: entry.description,
            customFields: entry.customFields,
            riskReward: entry.riskReward,
            isNoTradeDay: entry.isNoTradeDay,
            timestamp: entry.timestamp,
            pointsAwarded: entry.pointsAwarded,
            strategyId: entry.strategyId,
          }));
          localStorage.removeItem(STORAGE_KEYS.JOURNAL_ENTRIES);
          localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(cleaned));
          console.log(`✅ Aggressive journal clean: ${entries.length} -> ${cleaned.length} entries`);
        }
      } catch (e) {
        console.log('Even aggressive journal cleanup failed');
      }
    }
    
    try {
      const backtestingStr = localStorage.getItem(STORAGE_KEYS.BACKTESTING_ENTRIES);
      if (backtestingStr) {
        const entries = JSON.parse(backtestingStr);
        const cleaned = entries.map((entry: JournalEntry, index: number) => {
          const isRecent = index >= entries.length - 5;
          if (isRecent) return entry;
          return {
            ...entry,
            screenshots: [],
            customFields: entry.customFields ?
              Object.fromEntries(
                Object.entries(entry.customFields).map(([key, value]) => {
                  if (typeof value === 'string' && value.startsWith('data:image')) {
                    return [key, ''];
                  }
                  return [key, value];
                })
              ) : {}
          };
        });
        localStorage.removeItem(STORAGE_KEYS.BACKTESTING_ENTRIES);
        localStorage.setItem(STORAGE_KEYS.BACKTESTING_ENTRIES, JSON.stringify(cleaned));
        console.log(`✅ Cleaned backtesting: ${entries.length} entries (kept images for last 5)`);
      }
    } catch (backtestingError) {
      console.log('Backtesting cleanup failed, deleting entirely');
      localStorage.removeItem(STORAGE_KEYS.BACKTESTING_ENTRIES);
    }
    
    try {
      const messagesStr = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      if (messagesStr) {
        const messages = JSON.parse(messagesStr);
        const messagesByChannel: Record<string, any[]> = {};
        messages.forEach((msg: any) => {
          const key = `${msg.groupId}_${msg.channelId}`;
          if (!messagesByChannel[key]) messagesByChannel[key] = [];
          messagesByChannel[key].push({
            ...msg,
            fileUrl: undefined,
            fileType: undefined,
            fileName: undefined
          });
        });
        
        const cleaned = Object.values(messagesByChannel)
          .flatMap(msgs => msgs.slice(-200));
        
        localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES);
        localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(cleaned));
        console.log(`✅ Cleaned chat messages: ${messages.length} -> ${cleaned.length}`);
      }
    } catch (chatError) {
      console.log('Chat cleanup failed, deleting entirely');
      localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES);
    }
    
    console.log(`🎉 Storage after cleanup: ${getStorageSizeMB().toFixed(2)} MB`);
  } catch (error) {
    console.error('Error during cleanup:', error);
    try {
      localStorage.removeItem(STORAGE_KEYS.POSTS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
      localStorage.removeItem(STORAGE_KEYS.DAILY_LOGS);
      localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES);
      console.log('Emergency cleanup: deleted posts, activities, logs, chat');
    } catch (e) {
      console.error('Emergency cleanup also failed:', e);
    }
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (
      e.code === 22 ||
      e.code === 1014 ||
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.error('❌ QUOTA EXCEEDED! Running emergency cleanup...');
      
      cleanupOldData();
      
      try {
        const journalStr = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
        if (journalStr) {
          const entries = JSON.parse(journalStr);
          const stripped = entries.map((e: JournalEntry) => ({
            ...e,
            screenshots: [],
            customFields: e.customFields ?
              Object.fromEntries(
                Object.entries(e.customFields).map(([k, v]) => {
                  if (typeof v === 'string' && v.startsWith('data:image')) {
                    return [k, ''];
                  }
                  return [k, v];
                })
              ) : {}
          }));
          localStorage.removeItem(STORAGE_KEYS.JOURNAL_ENTRIES);
          localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(stripped));
          console.log('🧹 Emergency: Stripped ALL images from journal entries');
        }
      } catch (stripError) {
        console.error('Failed to strip journal images:', stripError);
      }
      
      try {
        localStorage.setItem(key, value);
        console.log('✅ Successfully saved after emergency cleanup');
        return true;
      } catch (retryError) {
        console.error('❌ Storage still full after emergency cleanup');
        
        alert(
          '⚠️ STORAGE IS COMPLETELY FULL\n\n' +
          'Your browser storage is full even after removing old images.\n\n' +
          'What uses the most space:\n' +
          '• Screenshots and images (HTF, trade screenshots)\n' +
          '• Chat messages with attachments\n' +
          '• Old journal entries\n\n' +
          'TIP: Avoid uploading large images. The app works best with smaller images or external hosting.\n\n' +
          'This save was NOT successful. Your latest changes may not be saved.'
        );
        
        return false;
      }
    }
    console.error('Error setting localStorage item:', e);
    return false;
  }
};

// Helper functions
export const storage = {
  uploadImage: uploadImageToStorage,

  // User operations
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  setCurrentUser: (user: User) => {
    safeSetItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    const allUsers = storage.getAllUsers();
    const existingIndex = allUsers.findIndex(u => u.id === user.id);
    if (existingIndex !== -1) {
      allUsers[existingIndex] = user;
    } else {
      allUsers.push(user);
    }
    safeSetItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(allUsers));
  },

  getAllUsers: (): User[] => {
    const usersStr = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    return usersStr ? JSON.parse(usersStr) : [];
  },

  findUserByEmail: (email: string): User | null => {
    const allUsers = storage.getAllUsers();
    return allUsers.find(u => u.email === email) || null;
  },

  findUserByUsername: (username: string): User | null => {
    const allUsers = storage.getAllUsers();
    return allUsers.find(u => u.username === username) || null;
  },

  updateCurrentUser: (updates: Partial<User>) => {
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      storage.setCurrentUser(updatedUser);
      return updatedUser;
    }
    return null;
  },

  updateUserProfilePicture: (userId: string, imageUrl: string) => {
    const currentUser = storage.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.profilePicture = imageUrl;
      storage.setCurrentUser(currentUser);
    }
  },

  updateUser: (userId: string, updates: { name?: string; username?: string }) => {
    const currentUser = storage.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, ...updates };
      storage.setCurrentUser(updatedUser);
      
      const allUsers = storage.getAllUsers();
      const userIndex = allUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        allUsers[userIndex] = { ...allUsers[userIndex], ...updates };
        safeSetItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(allUsers));
      }
      
      return updatedUser;
    }
    return null;
  },

  // Premium operations
  upgradeToPremium: () => {
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      storage.updateCurrentUser({
        isPremium: true,
        premiumSince: Date.now(),
        streakSavers: 5,        // FIX: 5 streak savers per month
        streakSaversUsed: 0,
        doubleXPDaysRemaining: 8, // FIX: 8 double XP days per month
        lastDoubleXPReset: Date.now(),
      });
    }
  },

  isPremium: (): boolean => {
    const currentUser = storage.getCurrentUser();
    return currentUser?.isPremium || false;
  },

  // Streak Saver operations (Premium only)
  useStreakSaver: (): boolean => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || !currentUser.isPremium) return false;
    
    const savers = currentUser.streakSavers || 0;
    if (savers > 0) {
      storage.updateCurrentUser({
        streakSavers: savers - 1,
        streakSaversUsed: (currentUser.streakSaversUsed || 0) + 1,
      });
      return true;
    }
    return false;
  },

  // Double XP operations (Premium only)
  activateDoubleXP: (): boolean => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || !currentUser.isPremium) return false;
    
    const today = new Date().toISOString().split('T')[0];
    if (currentUser.activeDoubleXPDate === today) {
      return false;
    }
    
    const now = Date.now();
    const lastReset = currentUser.lastDoubleXPReset || 0;
    const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);
    
    let daysRemaining = currentUser.doubleXPDaysRemaining || 0;
    
    if (daysSinceReset >= 30) {
      daysRemaining = 8; // FIX: reset to 8
      storage.updateCurrentUser({
        doubleXPDaysRemaining: 8,
        lastDoubleXPReset: now,
      });
    }
    
    if (daysRemaining > 0) {
      storage.updateCurrentUser({
        doubleXPDaysRemaining: daysRemaining - 1,
        activeDoubleXPDate: today,
      });
      return true;
    }
    
    return false;
  },

  isDoubleXPActive: (): boolean => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || !currentUser.isPremium) return false;
    
    const today = new Date().toISOString().split('T')[0];
    return currentUser.activeDoubleXPDate === today;
  },

  // Account Rules (Prop Firm Rules) - Premium Only
  getAccountRules: (userId?: string): AccountRule[] => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || !currentUser.isPremium) return [];
    
    const key = `account_rules_${userId || currentUser.id}`;
    const rulesStr = localStorage.getItem(key);
    return rulesStr ? JSON.parse(rulesStr) : [];
  },

  addAccountRule: (userId: string, title: string, description?: string): AccountRule => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || !currentUser.isPremium) throw new Error('Premium required');
    
    const rules = storage.getAccountRules(userId);
    const newRule: AccountRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      userId,
    };
    
    const updatedRules = [...rules, newRule];
    localStorage.setItem(`account_rules_${userId}`, JSON.stringify(updatedRules));
    return newRule;
  },

  updateAccountRules: (rules: {
    maxDailyLoss?: number;
    maxOverallDrawdown?: number;
    maxContracts?: number;
    consistencyRules?: string;
  }): boolean => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || !currentUser.isPremium) return false;
    storage.updateCurrentUser({ accountRules: { ...currentUser.accountRules, ...rules } });
    return true;
  },

  updateAccountRule: (ruleId: string, title: string, description?: string): boolean => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || !currentUser.isPremium) return false;
    
    const rules = storage.getAccountRules(currentUser.id);
    const updatedRules = rules.map(r =>
      r.id === ruleId ? { ...r, title, description } : r
    );
    
    localStorage.setItem(`account_rules_${currentUser.id}`, JSON.stringify(updatedRules));
    return true;
  },

  deleteAccountRule: (ruleId: string): boolean => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || !currentUser.isPremium) return false;
    
    const rules = storage.getAccountRules(currentUser.id);
    const updatedRules = rules.filter(r => r.id !== ruleId);
    
    localStorage.setItem(`account_rules_${currentUser.id}`, JSON.stringify(updatedRules));
    return true;
  },

  // Account Protection Mode - Premium Only
  toggleAccountProtectionMode: (enabled: boolean): boolean => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || !currentUser.isPremium) return false;
    storage.updateCurrentUser({ accountProtectionMode: enabled });
    return true;
  },

  isAccountProtectionMode: (): boolean => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || !currentUser.isPremium) return false;
    return currentUser.accountProtectionMode || false;
  },

  // Pre-Trade Checklist - Premium Only
  togglePreTradeChecklist: (enabled: boolean): boolean => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || !currentUser.isPremium) return false;
    storage.updateCurrentUser({ preTradeChecklistEnabled: enabled });
    return true;
  },

  isPreTradeChecklistEnabled: (): boolean => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || !currentUser.isPremium) return false;
    return currentUser.preTradeChecklistEnabled || false;
  },

  // Rules operations
  getRules: (): Rule[] => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) return [];
    
    const rulesStr = localStorage.getItem(STORAGE_KEYS.RULES);
    let allRules: Rule[] = rulesStr ? JSON.parse(rulesStr) : [];
    return allRules.filter((rule: Rule) => rule.userId === currentUser.id);
  },

  addRule: (rule: Omit<Rule, 'id'>): Rule => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) throw new Error('No user logged in');
    
    const rulesStr = localStorage.getItem(STORAGE_KEYS.RULES);
    const allRules = rulesStr ? JSON.parse(rulesStr) : [];
    
    const newRule = { ...rule, id: crypto.randomUUID(), userId: currentUser.id };
    allRules.push(newRule);
    safeSetItem(STORAGE_KEYS.RULES, JSON.stringify(allRules));
    return newRule;
  },

  deleteRule: (ruleId: string) => {
    const rulesStr = localStorage.getItem(STORAGE_KEYS.RULES);
    const allRules = rulesStr ? JSON.parse(rulesStr) : [];
    const updatedRules = allRules.filter((r: Rule) => r.id !== ruleId);
    safeSetItem(STORAGE_KEYS.RULES, JSON.stringify(updatedRules));
  },

  // Day logs operations
  getDayLogs: (): DayLog[] => {
    const logsStr = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    return logsStr ? JSON.parse(logsStr) : [];
  },

  getTodayLog: (): DayLog | null => {
    const today = new Date().toISOString().split('T')[0];
    const logs = storage.getDayLogs();
    return logs.find(log => log.date === today) || null;
  },

  addDayLog: (log: Omit<DayLog, 'id'>): DayLog => {
    const logs = storage.getDayLogs();
    const newLog = { ...log, id: Date.now().toString() };
    logs.push(newLog);
    safeSetItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    
    // Update user stats
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      const updates: Partial<User> = {
        totalPoints: currentUser.totalPoints + log.pointsEarned,
      };
      
      if (log.isClean) {
        updates.cleanDays = currentUser.cleanDays + 1;
        updates.currentStreak = currentUser.currentStreak + 1;
      } else {
        updates.forfeitDays = currentUser.forfeitDays + 1;
        updates.currentStreak = 0; // FIX: reset streak on forfeit (streak saver in DailyCheck.tsx restores it after)
      }
      
      storage.updateCurrentUser(updates);
    }
    
    return newLog;
  },

  // Journal operations
  getJournalEntries: (): JournalEntry[] => {
    const entriesStr = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    return entriesStr ? JSON.parse(entriesStr) : [];
  },

  addJournalEntry: (entry: Omit<JournalEntry, 'id'>): JournalEntry => {
    const entries = storage.getJournalEntries();
    const newEntry = { ...entry, id: Date.now().toString() };
    entries.push(newEntry);
    safeSetItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
    return newEntry;
  },

  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => {
    const entries = storage.getJournalEntries();
    const index = entries.findIndex(e => e.id === id);
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updates };
      safeSetItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
    }
  },

  deleteJournalEntry: (id: string) => {
    const entries = storage.getJournalEntries().filter(e => e.id !== id);
    safeSetItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
  },

  // Backtesting Journal operations
  getBacktestingEntries: (): JournalEntry[] => {
    const entriesStr = localStorage.getItem(STORAGE_KEYS.BACKTESTING_ENTRIES);
    return entriesStr ? JSON.parse(entriesStr) : [];
  },

  addBacktestingEntry: (entry: Omit<JournalEntry, 'id'>): JournalEntry => {
    const entries = storage.getBacktestingEntries();
    const newEntry = { ...entry, id: Date.now().toString() };
    entries.push(newEntry);
    safeSetItem(STORAGE_KEYS.BACKTESTING_ENTRIES, JSON.stringify(entries));
    return newEntry;
  },

  updateBacktestingEntry: (id: string, updates: Partial<JournalEntry>) => {
    const entries = storage.getBacktestingEntries();
    const index = entries.findIndex(e => e.id === id);
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updates };
      safeSetItem(STORAGE_KEYS.BACKTESTING_ENTRIES, JSON.stringify(entries));
    }
  },

  deleteBacktestingEntry: (id: string) => {
    const entries = storage.getBacktestingEntries().filter(e => e.id !== id);
    safeSetItem(STORAGE_KEYS.BACKTESTING_ENTRIES, JSON.stringify(entries));
  },

  // Journal field definitions
  getJournalFields: (): JournalFieldDefinition[] => {
    const fieldsStr = localStorage.getItem(STORAGE_KEYS.CUSTOM_FIELDS);
    return fieldsStr ? JSON.parse(fieldsStr) : [];
  },

  addJournalField: (field: Omit<JournalFieldDefinition, 'id'>): JournalFieldDefinition => {
    const fields = storage.getJournalFields();
    const newField = { ...field, id: Date.now().toString() };
    fields.push(newField);
    safeSetItem(STORAGE_KEYS.CUSTOM_FIELDS, JSON.stringify(fields));
    return newField;
  },

  deleteJournalField: (id: string) => {
    const fields = storage.getJournalFields().filter(f => f.id !== id);
    safeSetItem(STORAGE_KEYS.CUSTOM_FIELDS, JSON.stringify(fields));
  },

  // Strategies
  getStrategies: (): Strategy[] => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) return [];
    
    const strategiesStr = localStorage.getItem(STORAGE_KEYS.STRATEGIES);
    if (!strategiesStr) return [];
    
    try {
      const allStrategies = JSON.parse(strategiesStr);
      return allStrategies.filter((s: Strategy) => s.userId === currentUser.id);
    } catch {
      return [];
    }
  },

  addStrategy: (strategy: Omit<Strategy, 'id'>): Strategy => {
    const strategies = JSON.parse(localStorage.getItem(STORAGE_KEYS.STRATEGIES) || '[]');
    const newStrategy: Strategy = {
      ...strategy,
      id: generateUniqueId(),
    };
    strategies.push(newStrategy);
    
    try {
      localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strategies));
    } catch (e) {
      console.error('Storage full, cleaning up...');
      cleanupOldData();
      localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strategies));
    }
    
    return newStrategy;
  },

  deleteStrategy: (strategyId: string): void => {
    const strategies = JSON.parse(localStorage.getItem(STORAGE_KEYS.STRATEGIES) || '[]');
    const filtered = strategies.filter((s: Strategy) => s.id !== strategyId);
    localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(filtered));
  },

  // Posts operations
  getPosts: (): Post[] => {
    const postsStr = localStorage.getItem(STORAGE_KEYS.POSTS);
    return postsStr ? JSON.parse(postsStr) : [];
  },

  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'timestamp'>): Post => {
    const posts = storage.getPosts();
    const newPost: Post = {
      ...post,
      id: generateUniqueId(),
      likes: 0,
      comments: [],
      timestamp: Date.now(),
    };
    posts.unshift(newPost);
    safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return newPost;
  },

  likePost: (postId: string) => {
    const posts = storage.getPosts();
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.likes += 1;
      safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }
  },

  addComment: (postId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => {
    const posts = storage.getPosts();
    const post = posts.find(p => p.id === postId);
    if (post) {
      const newComment: Comment = {
        ...comment,
        id: generateUniqueId(),
        timestamp: Date.now(),
      };
      post.comments.push(newComment);
      safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }
  },

  deletePost: (postId: string) => {
    const posts = storage.getPosts().filter(p => p.id !== postId);
    safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  },

  // Activities operations
  getActivities: (): Activity[] => {
    const activitiesStr = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return activitiesStr ? JSON.parse(activitiesStr) : [];
  },

  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>): Activity => {
    const activities = storage.getActivities();
    const newActivity: Activity = {
      ...activity,
      id: generateUniqueId(),
      timestamp: Date.now(),
    };
    activities.unshift(newActivity);
    safeSetItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    return newActivity;
  },

  // Onboarding
  isOnboardingComplete: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
  },

  setOnboardingComplete: () => {
    safeSetItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  },

  // Storage management
  getStorageInfo: () => {
    return {
      totalSize: getStorageSizeMB().toFixed(2) + ' MB',
      journals: storage.getJournalEntries().length,
      backtesting: storage.getBacktestingEntries().length,
      posts: storage.getPosts().length,
      activities: storage.getActivities().length,
    };
  },

  manualCleanup: () => {
    cleanupOldData();
    return storage.getStorageInfo();
  },

  // Follow/Unfollow functionality
  followUser: (userId: string) => {
    const following = storage.getFollowing();
    if (!following.includes(userId)) {
      following.push(userId);
      safeSetItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(following));
    }
  },

  unfollowUser: (userId: string) => {
    const following = storage.getFollowing();
    const updated = following.filter(id => id !== userId);
    safeSetItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(updated));
  },

  getFollowing: (): string[] => {
    const followingStr = localStorage.getItem(STORAGE_KEYS.FOLLOWING);
    return followingStr ? JSON.parse(followingStr) : [];
  },

  isFollowing: (userId: string): boolean => {
    const following = storage.getFollowing();
    return following.includes(userId);
  },

  // Groups
  getGroups: (): Group[] => {
    const groupsStr = localStorage.getItem(STORAGE_KEYS.GROUPS);
    return groupsStr ? JSON.parse(groupsStr) : [];
  },

  addGroup: (group: Omit<Group, 'id' | 'createdAt'>): Group => {
    const groups = storage.getGroups();
    const newGroup: Group = {
      ...group,
      id: generateUniqueId(),
      createdAt: Date.now(),
    };
    groups.push(newGroup);
    safeSetItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    return newGroup;
  },

  updateGroup: (id: string, updates: Partial<Group>) => {
    const groups = storage.getGroups();
    const index = groups.findIndex(g => g.id === id);
    if (index !== -1) {
      groups[index] = { ...groups[index], ...updates };
      safeSetItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    }
  },

  deleteGroup: (id: string) => {
    const groups = storage.getGroups().filter(g => g.id !== id);
    safeSetItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  },

  // Join Requests
  getJoinRequests: (): JoinRequest[] => {
    const requestsStr = localStorage.getItem(STORAGE_KEYS.JOIN_REQUESTS);
    return requestsStr ? JSON.parse(requestsStr) : [];
  },

  addJoinRequest: (request: Omit<JoinRequest, 'id' | 'timestamp'>): JoinRequest => {
    const requests = storage.getJoinRequests();
    const newRequest: JoinRequest = {
      ...request,
      id: generateUniqueId(),
      timestamp: Date.now(),
    };
    requests.push(newRequest);
    safeSetItem(STORAGE_KEYS.JOIN_REQUESTS, JSON.stringify(requests));
    return newRequest;
  },

  updateJoinRequest: (id: string, updates: Partial<JoinRequest>) => {
    const requests = storage.getJoinRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index !== -1) {
      requests[index] = { ...requests[index], ...updates };
      safeSetItem(STORAGE_KEYS.JOIN_REQUESTS, JSON.stringify(requests));
    }
  },

  deleteJoinRequest: (id: string) => {
    const requests = storage.getJoinRequests().filter(r => r.id !== id);
    safeSetItem(STORAGE_KEYS.JOIN_REQUESTS, JSON.stringify(requests));
  },

  // Credit Transactions
  getCreditTransactions: (): CreditTransaction[] => {
    const transactionsStr = localStorage.getItem(STORAGE_KEYS.CREDIT_TRANSACTIONS);
    return transactionsStr ? JSON.parse(transactionsStr) : [];
  },

  addCreditTransaction: (transaction: Omit<CreditTransaction, 'id' | 'timestamp'>): CreditTransaction => {
    const transactions = storage.getCreditTransactions();
    const newTransaction: CreditTransaction = {
      ...transaction,
      id: generateUniqueId(),
      timestamp: Date.now(),
    };
    transactions.push(newTransaction);
    safeSetItem(STORAGE_KEYS.CREDIT_TRANSACTIONS, JSON.stringify(transactions));
    return newTransaction;
  },

  updateCreditTransaction: (id: string, updates: Partial<CreditTransaction>) => {
    const transactions = storage.getCreditTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates };
      safeSetItem(STORAGE_KEYS.CREDIT_TRANSACTIONS, JSON.stringify(transactions));
    }
  },

  deleteCreditTransaction: (id: string) => {
    const transactions = storage.getCreditTransactions().filter(t => t.id !== id);
    safeSetItem(STORAGE_KEYS.CREDIT_TRANSACTIONS, JSON.stringify(transactions));
  },

  // User Credits
  getUserCredits: (): UserCredits[] => {
    const creditsStr = localStorage.getItem(STORAGE_KEYS.USER_CREDITS);
    return creditsStr ? JSON.parse(creditsStr) : [];
  },

  addUserCredits: (credits: Omit<UserCredits, 'transactions'>): UserCredits => {
    const userCredits = storage.getUserCredits();
    const newCredits: UserCredits = {
      ...credits,
      transactions: [],
    };
    userCredits.push(newCredits);
    safeSetItem(STORAGE_KEYS.USER_CREDITS, JSON.stringify(userCredits));
    return newCredits;
  },

  updateUserCredits: (userId: string, updates: Partial<UserCredits>) => {
    const userCredits = storage.getUserCredits();
    const index = userCredits.findIndex(c => c.userId === userId);
    if (index !== -1) {
      userCredits[index] = { ...userCredits[index], ...updates };
      safeSetItem(STORAGE_KEYS.USER_CREDITS, JSON.stringify(userCredits));
    }
  },

  deleteUserCredits: (userId: string) => {
    const userCredits = storage.getUserCredits().filter(c => c.userId !== userId);
    safeSetItem(STORAGE_KEYS.USER_CREDITS, JSON.stringify(userCredits));
  },

  // Group Channels
  getGroupChannels: (groupId: string): GroupChannel[] => {
    const channelsStr = localStorage.getItem(STORAGE_KEYS.GROUP_CHANNELS);
    if (!channelsStr) return [];
    const allChannels: GroupChannel[] = JSON.parse(channelsStr);
    return allChannels.filter(c => c.groupId === groupId);
  },

  addGroupChannel: (channel: Omit<GroupChannel, 'id' | 'createdAt'>): GroupChannel => {
    const channels = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUP_CHANNELS) || '[]');
    const newChannel: GroupChannel = {
      ...channel,
      id: generateUniqueId(),
      createdAt: Date.now(),
    };
    channels.push(newChannel);
    safeSetItem(STORAGE_KEYS.GROUP_CHANNELS, JSON.stringify(channels));
    return newChannel;
  },

  deleteGroupChannel: (channelId: string) => {
    const channels = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUP_CHANNELS) || '[]');
    const filtered = channels.filter((c: GroupChannel) => c.id !== channelId);
    safeSetItem(STORAGE_KEYS.GROUP_CHANNELS, JSON.stringify(filtered));
    
    const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUP_MESSAGES) || '[]');
    const filteredMessages = messages.filter((m: GroupMessage) => m.channelId !== channelId);
    safeSetItem(STORAGE_KEYS.GROUP_MESSAGES, JSON.stringify(filteredMessages));
  },

  // Group Messages
  getGroupMessages: (channelId: string): GroupMessage[] => {
    const messagesStr = localStorage.getItem(STORAGE_KEYS.GROUP_MESSAGES);
    if (!messagesStr) return [];
    const allMessages: GroupMessage[] = JSON.parse(messagesStr);
    return allMessages.filter(m => m.channelId === channelId).sort((a, b) => a.timestamp - b.timestamp);
  },

  addGroupMessage: (message: Omit<GroupMessage, 'id' | 'timestamp'>): GroupMessage => {
    const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUP_MESSAGES) || '[]');
    const newMessage: GroupMessage = {
      ...message,
      id: generateUniqueId(),
      timestamp: Date.now(),
    };
    messages.push(newMessage);
    safeSetItem(STORAGE_KEYS.GROUP_MESSAGES, JSON.stringify(messages));
    return newMessage;
  },

  updateGroupMessage: (messageId: string, updates: Partial<GroupMessage>) => {
    const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUP_MESSAGES) || '[]');
    const index = messages.findIndex((m: GroupMessage) => m.id === messageId);
    if (index !== -1) {
      messages[index] = { ...messages[index], ...updates, edited: true, editedAt: Date.now() };
      safeSetItem(STORAGE_KEYS.GROUP_MESSAGES, JSON.stringify(messages));
    }
  },

  deleteGroupMessage: (messageId: string) => {
    const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUP_MESSAGES) || '[]');
    const filtered = messages.filter((m: GroupMessage) => m.id !== messageId);
    safeSetItem(STORAGE_KEYS.GROUP_MESSAGES, JSON.stringify(filtered));
  },

  // Achievements
  addAchievement: (userId: string, achievement: Omit<Achievement, 'id' | 'earnedAt'>): Achievement => {
    const allUsers = storage.getAllUsers();
    const userIndex = allUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return { ...achievement, id: '', earnedAt: 0 };
    
    const user = allUsers[userIndex];
    const achievements = user.achievements || [];
    
    const newAchievement: Achievement = {
      ...achievement,
      id: generateUniqueId(),
      earnedAt: Date.now(),
    };
    
    achievements.push(newAchievement);
    user.achievements = achievements;
    
    const trophyCount = achievements.filter(a => a.type === 'trophy').length;
    
    if (achievement.type === 'trophy' && trophyCount % 10 === 0) {
      user.totalPoints = (user.totalPoints || 0) + 100;
      console.log(`🏆 Trophy Milestone! ${trophyCount} trophies = +100 bonus points`);
    }
    
    allUsers[userIndex] = user;
    safeSetItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(allUsers));
    
    const currentUser = storage.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      storage.setCurrentUser(user);
    }
    
    return newAchievement;
  },

  awardChallengeWinnerAchievement: (
    userId: string,
    groupId: string,
    challengeId: string,
    challengeName: string,
    place: number
  ): Achievement | null => {
    if (place < 1 || place > 3) return null;
    
    const achievementTypes: { [key: number]: Achievement['type'] } = {
      1: 'trophy',
      2: 'medal',
      3: 'star',
    };
    
    const placeLabels: { [key: number]: string } = {
      1: '🥇 1st Place',
      2: '🥈 2nd Place',
      3: '🥉 3rd Place',
    };
    
    const achievement: Omit<Achievement, 'id' | 'earnedAt'> = {
      type: achievementTypes[place],
      title: `${placeLabels[place]} - ${challengeName}`,
      description: `Finished ${placeLabels[place]} in the group challenge`,
      source: 'group_challenge',
      groupId,
      challengeId,
    };
    
    return storage.addAchievement(userId, achievement);
  },

  // Mental Preparation
  getMentalPrepSettings: () => {
    const settingsStr = localStorage.getItem(STORAGE_KEYS.MENTAL_PREP_SETTINGS);
    return settingsStr ? JSON.parse(settingsStr) : null;
  },

  saveMentalPrepSettings: (settings: any) => {
    safeSetItem(STORAGE_KEYS.MENTAL_PREP_SETTINGS, JSON.stringify(settings));
  },

  getAffirmations: (): string[] => {
    const affirmationsStr = localStorage.getItem(STORAGE_KEYS.AFFIRMATIONS);
    return affirmationsStr ? JSON.parse(affirmationsStr) : [];
  },

  saveAffirmations: (affirmations: string[]) => {
    safeSetItem(STORAGE_KEYS.AFFIRMATIONS, JSON.stringify(affirmations));
  },

  trackMentalPrepCompletion: (completed: boolean) => {
    const tracking = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENTAL_PREP_TRACKING) || '[]');
    tracking.push({
      date: new Date().toISOString(),
      completed,
      timestamp: Date.now(),
    });
    safeSetItem(STORAGE_KEYS.MENTAL_PREP_TRACKING, JSON.stringify(tracking));
  },

  getMentalPrepTracking: () => {
    const trackingStr = localStorage.getItem(STORAGE_KEYS.MENTAL_PREP_TRACKING);
    return trackingStr ? JSON.parse(trackingStr) : [];
  },

  // Daily check lock helpers (used by DailyCheck.tsx)
  isDailyCheckLocked: (): boolean => {
    const user = storage.getCurrentUser();
    if (!user) return false;
    const last = parseInt(localStorage.getItem(`daily_check_last_${user.id}`) || '0', 10);
    if (!last) return false;
    const COOLDOWN_MS = 5 * 60 * 60 * 1000; // 5 hours
    return Date.now() - last < COOLDOWN_MS;
  },

  getDailyCheckCooldown: (): string | null => {
    const user = storage.getCurrentUser();
    if (!user) return null;
    const last = parseInt(localStorage.getItem(`daily_check_last_${user.id}`) || '0', 10);
    if (!last) return null;
    const COOLDOWN_MS = 5 * 60 * 60 * 1000;
    const remaining = COOLDOWN_MS - (Date.now() - last);
    if (remaining <= 0) return null;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  },
};

// League calculation
export const getLeague = (points: number): { name: string; color: string; icon: string } => {
  if (points >= 10000) return { name: 'Legendary', color: 'text-purple-500', icon: '👑' };
  if (points >= 5000) return { name: 'Master', color: 'text-yellow-500', icon: '🏆' };
  if (points >= 2500) return { name: 'Diamond', color: 'text-blue-400', icon: '💎' };
  if (points >= 1000) return { name: 'Platinum', color: 'text-cyan-400', icon: '⭐' };
  if (points >= 500) return { name: 'Gold', color: 'text-yellow-400', icon: '🥇' };
  if (points >= 250) return { name: 'Silver', color: 'text-gray-400', icon: '🥈' };
  return { name: 'Bronze', color: 'text-orange-400', icon: '🥉' };
};

// Discipline rate calculation
export const getDisciplineRate = (cleanDays: number, totalDays: number): number => {
  if (totalDays === 0) return 0;
  return Math.round((cleanDays / totalDays) * 100);
};

export const checkDemotion = (userId: string): boolean => {
  const logs = storage.getDayLogs();
  const userLogs = logs.filter((l: any) => l.userId === userId);
  if (userLogs.length < 7) return false;
  const last7 = userLogs.slice(-7);
  const cleanCount = last7.filter((l: any) => l.isClean).length;
  return cleanCount < 3;
};
