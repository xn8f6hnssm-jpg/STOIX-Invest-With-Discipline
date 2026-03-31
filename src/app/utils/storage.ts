// Local storage utilities for demo app
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

// ── Image compression before upload ──────────────────────────────────────────
async function compressImage(base64Image: string, maxWidthPx = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidthPx) {
          height = Math.round((height * maxWidthPx) / width);
          width = maxWidthPx;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(base64Image); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => resolve(base64Image);
      img.src = base64Image;
    } catch {
      resolve(base64Image);
    }
  });
}

// ── Upload to Supabase Storage with retry + bucket organization ───────────────
async function uploadImageToStorage(
  base64Image: string,
  userId: string,
  entryId?: string,
  fieldName?: string,
  folder: 'journal' | 'dailycheck' | 'profile' = 'journal'
): Promise<string> {
  // Skip if already a URL (already uploaded)
  if (base64Image.startsWith('http')) return base64Image;
  // Skip empty
  if (!base64Image || base64Image.length < 100) return base64Image;

  // Compress before upload (max 1200px wide, 80% quality)
  let imageToUpload = base64Image;
  try {
    imageToUpload = await compressImage(base64Image, 1200, 0.8);
  } catch { /* use original if compression fails */ }

  // Max file size: 5MB base64 ≈ 3.75MB binary
  const MAX_BASE64_LEN = 5 * 1024 * 1024 * 1.37;
  if (imageToUpload.length > MAX_BASE64_LEN) {
    console.warn('Image too large, compressing more aggressively');
    try { imageToUpload = await compressImage(base64Image, 800, 0.6); } catch { }
  }

  const bucketPath = `users/${userId}/${folder}/${entryId || Date.now()}_${fieldName || 'img'}.jpg`;

  // Retry logic — 3 attempts
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ecfd718d/upload-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            base64Image: imageToUpload,
            userId,
            entryId,
            fieldName,
            bucketPath,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Upload attempt ${attempt} failed:`, errText);
        if (attempt === 3) return base64Image; // final fallback
        await new Promise(r => setTimeout(r, 1000 * attempt)); // backoff
        continue;
      }

      const data = await response.json();
      return data.url || base64Image;
    } catch (error) {
      console.error(`Upload attempt ${attempt} error:`, error);
      if (attempt === 3) return base64Image;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  return base64Image;
}

// ── Storage usage monitor ─────────────────────────────────────────────────────
export function getStorageUsageMB(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) total += (localStorage.getItem(key)?.length || 0);
  }
  return parseFloat((total / (1024 * 1024)).toFixed(2));
}

export function getStorageWarningLevel(): 'ok' | 'warning' | 'critical' {
  const mb = getStorageUsageMB();
  if (mb > 4) return 'critical';
  if (mb > 2.5) return 'warning';
  return 'ok';
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
  streakSavers?: number; // Number of streak savers available (2 per month)
  streakSaversUsed?: number; // Total used over time
  doubleXPDaysRemaining?: number; // Number of double XP days available (5 per month, random)
  lastDoubleXPReset?: number; // Timestamp of last monthly reset
  activeDoubleXPDate?: string; // Date when double XP is active (YYYY-MM-DD)
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
  strategiesSectionName?: string; // Custom name for "All Strategies" section
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
  isCritical?: boolean; // ⭐ Critical rule toggle
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
  pnl?: number; // NEW: Optional P&L field for tracking actual dollar gains/losses
  isNoTradeDay?: boolean;
  pointsAwarded?: boolean;
  timestamp?: number;
  strategyId?: string; // NEW: Link to strategy
  reflection?: {
    questions: Record<string, string>;
    insights: string[];
  };
  // Investment Thesis fields (for Long Term Hold users)
  assetName?: string; // Required for investors
  action?: 'buy' | 'hold' | 'sell'; // Investment action
  investmentThesis?: string; // Why buying this asset
  invalidationCondition?: string; // What would make them sell
  plannedHoldTime?: string; // Expected hold duration
  thesisReviewDates?: string[]; // Dates when thesis was reviewed
  sellReason?: 'thesis_broken' | 'emotional_reaction' | 'planned_exit'; // Why selling
}

export interface JournalFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'checkbox' | 'dropdown' | 'datetime' | 'time' | 'image';
  options?: string[]; // For dropdown
}

export interface Strategy {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string; // For visual distinction
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorUsername: string;
  type: 'free' | 'paid';
  price?: number; // Monthly price in USD for paid groups
  memberCount: number;
  members: string[]; // User IDs
  admins: string[]; // User IDs with admin privileges
  inviteCode: string; // Unique code for instant joining
  isPublic: boolean; // Can be discovered in search
  coverImage?: string;
  createdAt: number;
  challenges?: GroupChallenge[]; // Challenges within the group
  channels?: GroupChannel[]; // Chat channels/tabs within the group
}

export interface GroupChannel {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: number;
  isDefault?: boolean; // The default "general" channel
}

export interface GroupMessage {
  id: string;
  channelId: string;
  groupId: string;
  userId: string;
  username: string;
  content: string;
  mentions: string[]; // Array of mentioned userIds, or ["@everyone"]
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
  duration: number; // days
  participants: string[]; // User IDs
  startDate: string;
  endDate: string;
  prize?: string;
  rules: string[];
  leaderboard: { userId: string; points: number; username: string }[];
  status: 'upcoming' | 'active' | 'completed';
  createdBy: string; // User ID
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
  amount: number; // In USD
  source?: string; // e.g., "Group payment from user123"
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
  balance: number; // In USD
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
  relatedId?: string; // Post ID or Journal ID
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
  CHAT_MESSAGES: 'tradeforge_chat_messages', // NEW: Chat messages
  FOLLOWING: 'tradeforge_following', // NEW: Following users
  MENTAL_PREP_SETTINGS: 'tradeforge_mental_prep_settings', // NEW: Mental preparation settings
  AFFIRMATIONS: 'tradeforge_affirmations', // NEW: Personal affirmations
  MENTAL_PREP_TRACKING: 'tradeforge_mental_prep_tracking', // NEW: Mental prep completion tracking
  DIRECT_MESSAGES: 'tradeforge_direct_messages',
  NOTIFICATIONS: 'tradeforge_notifications',
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

// Check if storage is approaching limit (warn at 4MB, block at 4.5MB)
const checkStorageSpace = (): { canAdd: boolean; shouldWarn: boolean; sizeMB: number } => {
  const sizeMB = getStorageSizeMB();
  
  // Cleanup at 2.8MB to stay well below quota - more aggressive
  if (sizeMB > 2.8) {
    console.log(`⚠️ Storage approaching limit (${sizeMB.toFixed(2)} MB), running cleanup...`);
    cleanupOldData();
    // Recalculate after cleanup
    const newSizeMB = getStorageSizeMB();
    return {
      canAdd: newSizeMB < 4.5,
      shouldWarn: newSizeMB > 2.8,
      sizeMB: parseFloat(newSizeMB.toFixed(2))
    };
  }
  
  return {
    canAdd: sizeMB < 4.5, // Block new images at 4.5MB
    shouldWarn: sizeMB > 2.8, // Warn at 2.8MB
    sizeMB: parseFloat(sizeMB.toFixed(2))
  };
};

const cleanupOldData = () => {
  try {
    console.log(`💾 Storage before cleanup: ${getStorageSizeMB().toFixed(2)} MB`);
    
    // 1. Remove old posts (keep last 20 without images)
    try {
      const postsStr = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (postsStr) {
        const posts = JSON.parse(postsStr);
        // Keep only last 10 posts and strip images/photos (reduced from 15)
        const cleaned = posts.slice(-10).map((post: any) => ({
          ...post,
          photoUrl: '',
          images: [],
          journalData: post.journalData ? {
            ...post.journalData,
            customFields: {} // Remove custom field images
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
    
    // 2. Remove old activities (keep last 15, reduced from 20)
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
    
    // 3. Remove old daily logs (keep last 30 days, reduced from 45)
    try {
      const logsStr = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
      if (logsStr) {
        const logs = JSON.parse(logsStr);
        // Strip photos from all logs to save space, keep last 30
        const cleaned = logs.slice(-30).map((log: DayLog) => ({
          ...log,
          photoUrl: '' // Remove photos
        }));
        localStorage.removeItem(STORAGE_KEYS.DAILY_LOGS);
        localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(cleaned));
        console.log(`✅ Cleaned daily logs: ${logs.length} -> ${cleaned.length} (no photos)`);
      }
    } catch (logsError) {
      console.log('Daily logs cleanup failed, deleting entirely');
      localStorage.removeItem(STORAGE_KEYS.DAILY_LOGS);
    }
    
    // 4. For journal - KEEP ALL ENTRIES but remove screenshots to save space
    try {
      const journalStr = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
      if (journalStr) {
        const entries = JSON.parse(journalStr);
        // Keep images from last 5 entries ONLY (reduced from 20)
        const cleaned = entries.map((entry: JournalEntry, index: number) => {
          const isRecent = index >= entries.length - 5;
          if (isRecent) {
            // Keep recent entries with images
            return entry;
          }
          // Remove screenshots and image custom fields from older entries
          return {
            ...entry,
            screenshots: [], // Remove screenshots
            customFields: entry.customFields ? 
              Object.fromEntries(
                Object.entries(entry.customFields).map(([key, value]) => {
                  // Remove base64 images from custom fields
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
          // Keep last 100 entries without images
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
    
    // 5. For backtesting - Keep images from last 5, remove from older ones
    try {
      const backtestingStr = localStorage.getItem(STORAGE_KEYS.BACKTESTING_ENTRIES);
      if (backtestingStr) {
        const entries = JSON.parse(backtestingStr);
        const cleaned = entries.map((entry: JournalEntry, index: number) => {
          const isRecent = index >= entries.length - 5;
          if (isRecent) {
            return entry;
          }
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
    
    // 6. Clean chat messages - keep last 200 per channel
    try {
      const messagesStr = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      if (messagesStr) {
        const messages = JSON.parse(messagesStr);
        // Group by channel and keep last 200 per channel, remove file attachments
        const messagesByChannel: Record<string, any[]> = {};
        messages.forEach((msg: any) => {
          const key = `${msg.groupId}_${msg.channelId}`;
          if (!messagesByChannel[key]) messagesByChannel[key] = [];
          messagesByChannel[key].push({
            ...msg,
            fileUrl: undefined, // Remove file attachments
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
    // If cleanup itself fails, just nuke non-essential data
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
      e.code === 22 || // QuotaExceededError
      e.code === 1014 || // Firefox
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.error('❌ QUOTA EXCEEDED! Running emergency cleanup...');
      
      // Emergency cleanup - more aggressive
      cleanupOldData();
      
      // Try stripping images from ALL journal entries as emergency measure
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
      
      // Try again after aggressive cleanup
      try {
        localStorage.setItem(key, value);
        console.log('✅ Successfully saved after emergency cleanup');
        return true;
      } catch (retryError) {
        console.error('❌ Storage still full after emergency cleanup');
        
        // Final option: Alert user
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
  //Upload image helper (can be used before adding entry)
  uploadImage: uploadImageToStorage,
  
  // User operations
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  setCurrentUser: (user: User) => {
    safeSetItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    // Also save to all users list
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
      
      // Also update in all users list
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
        streakSavers: 2, // Premium users get 2 streak savers per month
        streakSaversUsed: 0,
        doubleXPDaysRemaining: 5, // 5 double XP days per month (random)
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
    
    // Check if already active today
    const today = new Date().toISOString().split('T')[0];
    if (currentUser.activeDoubleXPDate === today) {
      return false; // Already active
    }
    
    // Reset monthly allowance if needed
    const now = Date.now();
    const lastReset = currentUser.lastDoubleXPReset || 0;
    const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);
    
    let daysRemaining = currentUser.doubleXPDaysRemaining || 0;
    
    // Reset on the first day of the month
    if (daysSinceReset >= 30) {
      daysRemaining = 5;
      storage.updateCurrentUser({
        doubleXPDaysRemaining: 5,
        lastDoubleXPReset: now,
      });
    }
    
    // Use a double XP day
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

  // Update the account rules limits object (maxDailyLoss, maxOverallDrawdown, etc.) on the user
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
    
    // Filter rules by current user ID (don't migrate old rules automatically)
    return allRules.filter((rule: Rule) => rule.userId === currentUser.id);
  },

  addRule: (rule: Omit<Rule, 'id'>): Rule => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) throw new Error('No user logged in');
    
    // Get ALL rules from storage (not filtered)
    const rulesStr = localStorage.getItem(STORAGE_KEYS.RULES);
    const allRules = rulesStr ? JSON.parse(rulesStr) : [];
    
    const newRule = { ...rule, id: crypto.randomUUID(), userId: currentUser.id };
    allRules.push(newRule);
    safeSetItem(STORAGE_KEYS.RULES, JSON.stringify(allRules));
    return newRule;
  },

  deleteRule: (ruleId: string) => {
    // Get ALL rules, delete the one, save back ALL rules
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

  // Returns true if user is within the 5-hour cooldown window
  isDailyCheckLocked: (): boolean => {
    const user = storage.getCurrentUser();
    if (!user) return false;
    const last = localStorage.getItem(`daily_check_last_${user.id}`);
    if (!last) return false;
    const elapsed = Date.now() - parseInt(last);
    return elapsed < 5 * 60 * 60 * 1000;
  },

  // Returns remaining cooldown as "Xh Ym" or null if not locked
  getDailyCheckCooldown: (): string | null => {
    const user = storage.getCurrentUser();
    if (!user) return null;
    const last = localStorage.getItem(`daily_check_last_${user.id}`);
    if (!last) return null;
    const elapsed = Date.now() - parseInt(last);
    const total = 5 * 60 * 60 * 1000;
    if (elapsed >= total) return null;
    const remaining = total - elapsed;
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return `${h}h ${m}m`;
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
        totalPoints: (currentUser.totalPoints || 0) + log.pointsEarned,
      };
      
      if (log.isClean) {
        updates.cleanDays = (currentUser.cleanDays || 0) + 1;
        updates.currentStreak = (currentUser.currentStreak || 0) + 1;
      } else {
        updates.forfeitDays = (currentUser.forfeitDays || 0) + 1;
        // Reset streak on forfeit (broken rules)
        updates.currentStreak = 0;
      }
      
      storage.updateCurrentUser(updates);

      // Store cooldown timestamp for 5-hour lockout
      localStorage.setItem(`daily_check_last_${currentUser.id}`, Date.now().toString());
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
    
    // Also delete all messages in this channel
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
    
    if (userIndex === -1) return { ...achievement, id: '', earnedAt: 0 }; // User not found
    
    const user = allUsers[userIndex];
    const achievements = user.achievements || [];
    
    const newAchievement: Achievement = {
      ...achievement,
      id: generateUniqueId(),
      earnedAt: Date.now(),
    };
    
    achievements.push(newAchievement);
    user.achievements = achievements;
    
    // Check for trophy milestone rewards (every 10 trophies = 100 points)
    const trophyCount = achievements.filter(a => a.type === 'trophy').length;
    
    // Award bonus if just reached a milestone (divisible by 10)
    if (achievement.type === 'trophy' && trophyCount % 10 === 0) {
      user.totalPoints = (user.totalPoints || 0) + 100;
      console.log(`🏆 Trophy Milestone! ${trophyCount} trophies = +100 bonus points`);
    }
    
    allUsers[userIndex] = user;
    safeSetItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(allUsers));
    
    // Update current user if it's them
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
    if (place < 1 || place > 3) return null; // Only top 3 get achievements
    
    const achievementTypes: { [key: number]: Achievement['type'] } = {
      1: 'trophy',  // 1st place = trophy
      2: 'medal',   // 2nd place = medal
      3: 'star',    // 3rd place = star
    };
    
    const placeLabels = {
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

  // ── Direct Messages ──────────────────────────────────────────────────────
  getDirectMessages: (): any[] => {
    const str = localStorage.getItem(STORAGE_KEYS.DIRECT_MESSAGES);
    return str ? JSON.parse(str) : [];
  },

  getDMConversation: (userId1: string, userId2: string): any[] => {
    const all = storage.getDirectMessages();
    return all.filter(m =>
      (m.fromId === userId1 && m.toId === userId2) ||
      (m.fromId === userId2 && m.toId === userId1)
    ).sort((a, b) => a.timestamp - b.timestamp);
  },

  getDMConversations: (userId: string): any[] => {
    const all = storage.getDirectMessages();
    const partnerIds = new Set<string>();
    all.forEach(m => {
      if (m.fromId === userId) partnerIds.add(m.toId);
      if (m.toId === userId) partnerIds.add(m.fromId);
    });
    return Array.from(partnerIds).map(partnerId => {
      const msgs = storage.getDMConversation(userId, partnerId);
      const last = msgs[msgs.length - 1];
      const allUsers = storage.getAllUsers();
      const partner = allUsers.find(u => u.id === partnerId);
      const unread = msgs.filter(m => m.toId === userId && !m.read).length;
      return { partnerId, partner, lastMessage: last, unreadCount: unread };
    }).sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
  },

  sendDirectMessage: (fromId: string, toId: string, text: string): any => {
    const msg = {
      id: `dm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromId,
      toId,
      text,
      timestamp: Date.now(),
      read: false,
    };
    const all = storage.getDirectMessages();
    all.push(msg);
    safeSetItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify(all));
    // Create notification for recipient
    storage.addNotification({
      userId: toId,
      type: 'dm',
      fromId,
      text: text.length > 50 ? text.slice(0, 50) + '...' : text,
    });
    return msg;
  },

  markDMsAsRead: (currentUserId: string, partnerId: string) => {
    const all = storage.getDirectMessages();
    const updated = all.map(m =>
      m.fromId === partnerId && m.toId === currentUserId ? { ...m, read: true } : m
    );
    safeSetItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify(updated));
  },

  // ── Notifications ────────────────────────────────────────────────────────
  getNotifications: (userId: string): any[] => {
    const str = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const all = str ? JSON.parse(str) : [];
    return all.filter((n: any) => n.userId === userId)
      .sort((a: any, b: any) => b.timestamp - a.timestamp);
  },

  addNotification: (data: { userId: string; type: string; fromId?: string; text?: string; relatedId?: string }) => {
    const notif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      timestamp: Date.now(),
      read: false,
    };
    const str = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const all = str ? JSON.parse(str) : [];
    all.push(notif);
    // Keep max 100 notifications
    const trimmed = all.slice(-100);
    safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(trimmed));
    return notif;
  },

  markNotificationsAsRead: (userId: string) => {
    const str = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const all = str ? JSON.parse(str) : [];
    const updated = all.map((n: any) => n.userId === userId ? { ...n, read: true } : n);
    safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },

  getUnreadNotificationCount: (userId: string): number => {
    return storage.getNotifications(userId).filter((n: any) => !n.read).length;
  },
};

// League calculation
export const getLeague = (points: number): { name: string; color: string; icon: string; roman: string; tier: string; division: number } => {
  // Exact league progression per spec — roman numerals I II III
  if (points >= 7000) return { name: 'Platinum', tier: 'Platinum', division: 1, color: 'text-cyan-300',   icon: 'platinum', roman: 'I'   };
  if (points >= 6500) return { name: 'Platinum', tier: 'Platinum', division: 2, color: 'text-cyan-300',   icon: 'platinum', roman: 'II'  };
  if (points >= 6000) return { name: 'Platinum', tier: 'Platinum', division: 3, color: 'text-cyan-300',   icon: 'platinum', roman: 'III' };
  if (points >= 5500) return { name: 'Diamond',  tier: 'Diamond',  division: 1, color: 'text-blue-400',   icon: 'diamond',  roman: 'I'   };
  if (points >= 5000) return { name: 'Diamond',  tier: 'Diamond',  division: 2, color: 'text-blue-400',   icon: 'diamond',  roman: 'II'  };
  if (points >= 4500) return { name: 'Diamond',  tier: 'Diamond',  division: 3, color: 'text-blue-400',   icon: 'diamond',  roman: 'III' };
  if (points >= 4000) return { name: 'Gold',     tier: 'Gold',     division: 1, color: 'text-yellow-400', icon: 'gold',     roman: 'I'   };
  if (points >= 3500) return { name: 'Gold',     tier: 'Gold',     division: 2, color: 'text-yellow-400', icon: 'gold',     roman: 'II'  };
  if (points >= 3000) return { name: 'Gold',     tier: 'Gold',     division: 3, color: 'text-yellow-400', icon: 'gold',     roman: 'III' };
  if (points >= 2500) return { name: 'Silver',   tier: 'Silver',   division: 1, color: 'text-gray-300',   icon: 'silver',   roman: 'I'   };
  if (points >= 2000) return { name: 'Silver',   tier: 'Silver',   division: 2, color: 'text-gray-300',   icon: 'silver',   roman: 'II'  };
  if (points >= 1500) return { name: 'Silver',   tier: 'Silver',   division: 3, color: 'text-gray-300',   icon: 'silver',   roman: 'III' };
  if (points >= 1000) return { name: 'Bronze',   tier: 'Bronze',   division: 1, color: 'text-amber-600',  icon: 'bronze',   roman: 'I'   };
  if (points >= 500)  return { name: 'Bronze',   tier: 'Bronze',   division: 2, color: 'text-amber-600',  icon: 'bronze',   roman: 'II'  };
  return               { name: 'Bronze',   tier: 'Bronze',   division: 3, color: 'text-amber-600',  icon: 'bronze',   roman: 'III' };
};

// Check demotion: if last 30 logged days discipline < 40%, demote one division
export const checkDemotion = (userId: string): boolean => {
  const logs = (localStorage.getItem('tradeforge_daily_logs'));
  if (!logs) return false;
  const allLogs: any[] = JSON.parse(logs).filter((l: any) => l.userId === userId);
  const last30 = allLogs.slice(-30);
  if (last30.length < 10) return false; // need enough data
  const cleanCount = last30.filter((l: any) => l.isClean).length;
  const rate = Math.round((cleanCount / last30.length) * 100);
  return rate < 40;
};

// Discipline rate calculation
export const getDisciplineRate = (cleanDays: number, totalDays: number): number => {
  if (totalDays === 0) return 0;
  return Math.round((cleanDays / totalDays) * 100);
};