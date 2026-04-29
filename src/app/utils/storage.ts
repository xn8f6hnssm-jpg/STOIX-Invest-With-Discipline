// Storage utilities — Supabase primary, localStorage cache
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { supabase } from './supabase';

// ── Image compression ─────────────────────────────────────────────────────────
async function compressImage(base64Image: string, maxWidthPx = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidthPx) { height = Math.round((height * maxWidthPx) / width); width = maxWidthPx; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(base64Image); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64Image);
      img.src = base64Image;
    } catch { resolve(base64Image); }
  });
}

async function uploadImageToStorage(
  base64Image: string, userId: string, entryId?: string, fieldName?: string,
  folder: 'journal' | 'dailycheck' | 'profile' = 'journal'
): Promise<string> {
  if (!base64Image || base64Image.length < 100) return base64Image;
  if (base64Image.startsWith('http')) return base64Image; // Already a URL

  try {
    // Compress first
    let imageToUpload = base64Image;
    try { imageToUpload = await compressImage(base64Image, 1200, 0.8); } catch {}

    // Convert base64 to blob
    const base64Data = imageToUpload.split(',')[1];
    const mimeType = imageToUpload.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
    const byteChars = atob(base64Data);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArray], { type: mimeType });

    const fileName = `${userId}/${folder}/${entryId || Date.now()}_${fieldName || 'img'}.jpg`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

    if (error) {
      console.error('Storage upload error:', error);
      return base64Image;
    }

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
    return urlData.publicUrl || base64Image;
  } catch (err) {
    console.error('uploadImageToStorage error:', err);
    return base64Image;
  }
}

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

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string; email: string; password: string; username: string; name: string;
  tradingStyle: string; instruments: string[]; rules: string[];
  totalPoints: number; cleanDays: number; forfeitDays: number; currentStreak: number;
  followers: number; following: number; isVerified: boolean; profilePicture?: string;
  isPremium?: boolean; premiumSince?: number; streakSavers?: number; streakSaversUsed?: number;
  doubleXPDaysRemaining?: number; lastDoubleXPReset?: number; activeDoubleXPDate?: string;
  achievements?: Achievement[];
  accountRules?: { maxDailyLoss?: number; maxOverallDrawdown?: number; maxContracts?: number; consistencyRules?: string; };
  accountProtectionMode?: boolean; preTradeChecklistEnabled?: boolean; strategiesSectionName?: string;
}

export interface Achievement {
  id: string; type: 'trophy' | 'medal' | 'star'; title: string; description: string;
  earnedAt: number; source: 'group_challenge' | 'milestone' | 'special';
  groupId?: string; challengeId?: string;
}

export interface AccountRule {
  id: string; title: string; description?: string; userId: string;
}

export interface Rule {
  id: string; userId: string; title: string; description: string; tag: string; isCritical?: boolean;
}

export interface DayLog {
  id: string; userId: string; date: string; isClean: boolean; photoUrl: string;
  note: string; forfeitCompleted?: string; pointsEarned: number; journalEntry?: string; posted: boolean;
}

export interface JournalEntry {
  id: string; userId: string; date: string; result: 'win' | 'loss' | 'breakeven';
  description: string; screenshots?: string[]; customFields?: Record<string, any>;
  riskReward?: number; pnl?: number; isNoTradeDay?: boolean; pointsAwarded?: boolean;
  timestamp?: number; strategyId?: string;
  reflection?: { questions: Record<string, string>; insights: string[]; };
  assetName?: string; action?: 'buy' | 'hold' | 'sell'; investmentThesis?: string;
  invalidationCondition?: string; plannedHoldTime?: string; thesisReviewDates?: string[];
  sellReason?: 'thesis_broken' | 'emotional_reaction' | 'planned_exit';
  beResolution?: 'continued_win' | 'continued_loss' | 'stayed_breakeven';
}

export interface JournalFieldDefinition {
  id: string; name: string;
  type: 'text' | 'number' | 'checkbox' | 'dropdown' | 'datetime' | 'time' | 'image';
  options?: string[];
}

export interface Strategy {
  id: string; userId: string; name: string; description?: string; color: string; createdAt: number;
}

export interface Group {
  id: string; name: string; description: string; creatorId: string; creatorUsername: string;
  type: 'free' | 'paid'; price?: number; memberCount: number; members: string[]; admins: string[];
  inviteCode: string; isPublic: boolean; coverImage?: string; createdAt: number;
  challenges?: GroupChallenge[]; channels?: GroupChannel[];
}

export interface GroupChannel {
  id: string; groupId: string; name: string; description?: string;
  createdBy: string; createdAt: number; isDefault?: boolean;
}

export interface GroupMessage {
  id: string; channelId: string; groupId: string; userId: string; username: string;
  content: string; mentions: string[];
  attachments?: { type: 'image' | 'file'; url: string; name: string; size?: number; }[];
  timestamp: number; edited?: boolean; editedAt?: number;
}

export interface GroupChallenge {
  id: string; groupId: string; name: string; description: string; duration: number;
  participants: string[]; startDate: string; endDate: string; prize?: string; rules: string[];
  leaderboard: { userId: string; points: number; username: string }[];
  status: 'upcoming' | 'active' | 'completed'; createdBy: string; createdAt: number;
}

export interface JoinRequest {
  id: string; groupId: string; userId: string; username: string; message?: string;
  status: 'pending' | 'approved' | 'rejected'; timestamp: number;
}

export interface CreditTransaction {
  id: string; userId: string; type: 'earn' | 'withdrawal' | 'refund'; amount: number;
  source?: string; status: 'completed' | 'pending' | 'failed'; timestamp: number;
  withdrawalDetails?: { bankName?: string; accountLast4?: string; processedAt?: number; };
}

export interface UserCredits {
  userId: string; balance: number; totalEarned: number; totalWithdrawn: number;
  transactions: CreditTransaction[];
}

export interface Post {
  id: string; userId: string; username: string; avatarUrl?: string; league: string;
  isVerified: boolean; type: 'clean' | 'forfeit' | 'general' | 'journal';
  photoUrl: string; images?: string[]; caption: string; likes: number;
  comments: Comment[]; timestamp: number;
  journalData?: { result: 'win' | 'loss' | 'breakeven'; isNoTradeDay?: boolean; riskReward?: number; date: string; customFields: Record<string, any>; };
}

export interface Comment {
  id: string; userId: string; username: string; text: string; timestamp: number;
}

export interface Activity {
  id: string; userId: string; type: 'post' | 'journal' | 'clean_day' | 'forfeit_day';
  description: string; timestamp: number; relatedId?: string;
}

// ── localStorage keys (cache) ─────────────────────────────────────────────────
const KEYS = {
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
  DIRECT_MESSAGES: 'tradeforge_direct_messages',
  NOTIFICATIONS: 'tradeforge_notifications',
};

let idCounter = 0;
const generateUniqueId = (): string => {
  idCounter++;
  return `${Date.now()}-${idCounter}-${Math.random().toString(36).substring(2, 9)}`;
};

const cleanupOldData = () => {
  try {
    // Trim posts to last 10 (keep images — they live in Supabase)
    try {
      const postsStr = localStorage.getItem(KEYS.POSTS);
      if (postsStr) {
        const posts = JSON.parse(postsStr);
        // Strip base64 images from old posts to save space, keep URLs
        const cleaned = posts.slice(-10).map((p: any) => ({
          ...p,
          photoUrl: p.photoUrl?.startsWith('data:image') ? '' : (p.photoUrl || ''),
          images: (p.images || []).filter((img: string) => !img.startsWith('data:image')),
          avatarUrl: p.avatarUrl?.startsWith('data:image') ? '' : (p.avatarUrl || ''),
        }));
        localStorage.removeItem(KEYS.POSTS);
        localStorage.setItem(KEYS.POSTS, JSON.stringify(cleaned));
      }
    } catch { localStorage.removeItem(KEYS.POSTS); }

    // Trim activities to last 15
    try {
      const activitiesStr = localStorage.getItem(KEYS.ACTIVITIES);
      if (activitiesStr) {
        const activities = JSON.parse(activitiesStr);
        localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(activities.slice(-15)));
      }
    } catch { localStorage.removeItem(KEYS.ACTIVITIES); }

    // Trim daily logs to last 30, only strip base64 photos (keep URLs)
    try {
      const logsStr = localStorage.getItem(KEYS.DAILY_LOGS);
      if (logsStr) {
        const logs = JSON.parse(logsStr);
        localStorage.setItem(KEYS.DAILY_LOGS, JSON.stringify(logs.slice(-30).map((l: DayLog) => ({
          ...l,
          // Only strip if it's base64, keep Supabase URLs
          photoUrl: l.photoUrl?.startsWith('data:image') ? '' : (l.photoUrl || '')
        }))));
      }
    } catch { localStorage.removeItem(KEYS.DAILY_LOGS); }

    // Strip images from older journal entries (keep last 5 with images)
    try {
      const journalStr = localStorage.getItem(KEYS.JOURNAL_ENTRIES);
      if (journalStr) {
        const entries = JSON.parse(journalStr);
        const cleaned = entries.map((e: JournalEntry, i: number) => {
          if (i >= entries.length - 5) return e;
          return {
            ...e, screenshots: [],
            customFields: e.customFields ? Object.fromEntries(Object.entries(e.customFields).map(([k, v]) =>
              [k, typeof v === 'string' && v.startsWith('data:image') ? '' : v]
            )) : {}
          };
        });
        localStorage.removeItem(KEYS.JOURNAL_ENTRIES);
        localStorage.setItem(KEYS.JOURNAL_ENTRIES, JSON.stringify(cleaned));
      }
    } catch { localStorage.removeItem(KEYS.JOURNAL_ENTRIES); }

    // Trim group messages to last 200 per channel
    try {
      const messagesStr = localStorage.getItem(KEYS.GROUP_MESSAGES);
      if (messagesStr) {
        const messages = JSON.parse(messagesStr);
        const byChannel: Record<string, any[]> = {};
        messages.forEach((m: any) => { if (!byChannel[m.channelId]) byChannel[m.channelId] = []; byChannel[m.channelId].push(m); });
        const cleaned = Object.values(byChannel).flatMap(msgs => msgs.slice(-200));
        localStorage.setItem(KEYS.GROUP_MESSAGES, JSON.stringify(cleaned));
      }
    } catch { localStorage.removeItem(KEYS.GROUP_MESSAGES); }
  } catch (error) {
    console.error('Cleanup error:', error);
    try {
      localStorage.removeItem(KEYS.POSTS);
      localStorage.removeItem(KEYS.ACTIVITIES);
      localStorage.removeItem(KEYS.DAILY_LOGS);
      localStorage.removeItem(KEYS.GROUP_MESSAGES);
    } catch {}
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.code === 22 || e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.error('❌ Storage quota exceeded, running cleanup...');
      cleanupOldData();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        console.error('❌ Storage still full after cleanup');
        return false;
      }
    }
    return false;
  }
};

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ── storage object ────────────────────────────────────────────────────────────
export const storage = {
  uploadImage: uploadImageToStorage,

  // ── User ──────────────────────────────────────────────────────────────────
  getCurrentUser: (): User | null => {
    const str = localStorage.getItem(KEYS.CURRENT_USER);
    return str ? JSON.parse(str) : null;
  },

  setCurrentUser: (user: User) => {
    safeSetItem(KEYS.CURRENT_USER, JSON.stringify(user));
    const allUsers = storage.getAllUsers();
    const idx = allUsers.findIndex(u => u.id === user.id);
    if (idx !== -1) allUsers[idx] = user; else allUsers.push(user);
    safeSetItem(KEYS.ALL_USERS, JSON.stringify(allUsers));
  },

  getAllUsers: (): User[] => {
    const str = localStorage.getItem(KEYS.ALL_USERS);
    return str ? JSON.parse(str) : [];
  },

  findUserByEmail: (email: string): User | null => storage.getAllUsers().find(u => u.email === email) || null,
  findUserByUsername: (username: string): User | null => storage.getAllUsers().find(u => u.username === username) || null,

  updateCurrentUser: (updates: Partial<User>) => {
    const user = storage.getCurrentUser();
    if (!user) return null;
    const updated = { ...user, ...updates };
    storage.setCurrentUser(updated);
    // Sync to Supabase in background
    supabase.from('users').upsert({
      id: updated.id, email: updated.email, username: updated.username, name: updated.name,
      trading_style: updated.tradingStyle, instruments: updated.instruments || [],
      total_points: updated.totalPoints || 0, clean_days: updated.cleanDays || 0,
      forfeit_days: updated.forfeitDays || 0, current_streak: updated.currentStreak || 0,
      is_premium: updated.isPremium || false, profile_picture: updated.profilePicture || null,
      achievements: updated.achievements || [], account_rules: updated.accountRules || {},
      account_protection_mode: updated.accountProtectionMode || false,
      pre_trade_checklist_enabled: updated.preTradeChecklistEnabled || false,
    }, { onConflict: 'id' }).then(({ error }) => {
      if (error) console.error('Supabase user update error:', error);
    });
    return updated;
  },

  updateUserProfilePicture: (userId: string, imageUrl: string) => {
    const user = storage.getCurrentUser();
    if (!user || user.id !== userId) return;

    if (imageUrl && imageUrl.startsWith('data:image')) {
      // Upload to Supabase Storage, save URL instead of base64
      uploadImageToStorage(imageUrl, userId, userId, 'profile', 'profile').then(url => {
        user.profilePicture = url;
        storage.setCurrentUser(user);
        // Sync URL to Supabase users table
        supabase.from('users').update({ profile_picture: url }).eq('id', userId)
          .then(({ error }) => { if (error) console.error('Profile pic URL sync error:', error); });
      });
    } else {
      user.profilePicture = imageUrl;
      storage.setCurrentUser(user);
    }
  },

  updateUser: (userId: string, updates: { name?: string; username?: string }) => {
    const user = storage.getCurrentUser();
    if (!user || user.id !== userId) return null;
    return storage.updateCurrentUser(updates);
  },

  // ── Premium ───────────────────────────────────────────────────────────────
  upgradeToPremium: () => storage.updateCurrentUser({ isPremium: true, premiumSince: Date.now(), streakSavers: 2, streakSaversUsed: 0, doubleXPDaysRemaining: 5, lastDoubleXPReset: Date.now() }),
  isPremium: (): boolean => storage.getCurrentUser()?.isPremium || false,

  useStreakSaver: (): boolean => {
    const user = storage.getCurrentUser();
    if (!user?.isPremium) return false;
    const savers = user.streakSavers || 0;
    if (savers > 0) { storage.updateCurrentUser({ streakSavers: savers - 1, streakSaversUsed: (user.streakSaversUsed || 0) + 1 }); return true; }
    return false;
  },

  activateDoubleXP: (): boolean => {
    const user = storage.getCurrentUser();
    if (!user?.isPremium) return false;
    const today = new Date().toISOString().split('T')[0];
    if (user.activeDoubleXPDate === today) return false;
    const now = Date.now();
    let daysRemaining = user.doubleXPDaysRemaining || 0;
    if ((now - (user.lastDoubleXPReset || 0)) >= 30 * 86400000) { daysRemaining = 5; storage.updateCurrentUser({ doubleXPDaysRemaining: 5, lastDoubleXPReset: now }); }
    if (daysRemaining > 0) { storage.updateCurrentUser({ doubleXPDaysRemaining: daysRemaining - 1, activeDoubleXPDate: today }); return true; }
    return false;
  },

  isDoubleXPActive: (): boolean => {
    const user = storage.getCurrentUser();
    if (!user?.isPremium) return false;
    return user.activeDoubleXPDate === new Date().toISOString().split('T')[0];
  },

  // ── Account Rules ─────────────────────────────────────────────────────────
  getAccountRules: (userId?: string): AccountRule[] => {
    const user = storage.getCurrentUser();
    if (!user?.isPremium) return [];
    const key = `account_rules_${userId || user.id}`;
    const str = localStorage.getItem(key);
    return str ? JSON.parse(str) : [];
  },

  addAccountRule: (userId: string, title: string, description?: string): AccountRule => {
    const user = storage.getCurrentUser();
    if (!user?.isPremium) throw new Error('Premium required');
    const rules = storage.getAccountRules(userId);
    const newRule: AccountRule = { id: `rule_${Date.now()}`, title, description, userId };
    localStorage.setItem(`account_rules_${userId}`, JSON.stringify([...rules, newRule]));
    return newRule;
  },

  updateAccountRules: (rules: { maxDailyLoss?: number; maxOverallDrawdown?: number; maxContracts?: number; consistencyRules?: string; }): boolean => {
    const user = storage.getCurrentUser();
    if (!user?.isPremium) return false;
    storage.updateCurrentUser({ accountRules: { ...user.accountRules, ...rules } });
    return true;
  },

  updateAccountRule: (ruleId: string, title: string, description?: string): boolean => {
    const user = storage.getCurrentUser();
    if (!user?.isPremium) return false;
    const rules = storage.getAccountRules(user.id);
    localStorage.setItem(`account_rules_${user.id}`, JSON.stringify(rules.map(r => r.id === ruleId ? { ...r, title, description } : r)));
    return true;
  },

  deleteAccountRule: (ruleId: string): boolean => {
    const user = storage.getCurrentUser();
    if (!user?.isPremium) return false;
    localStorage.setItem(`account_rules_${user.id}`, JSON.stringify(storage.getAccountRules(user.id).filter(r => r.id !== ruleId)));
    return true;
  },

  toggleAccountProtectionMode: (enabled: boolean): boolean => {
    if (!storage.isPremium()) return false;
    storage.updateCurrentUser({ accountProtectionMode: enabled });
    return true;
  },
  isAccountProtectionMode: (): boolean => storage.isPremium() ? (storage.getCurrentUser()?.accountProtectionMode || false) : false,

  togglePreTradeChecklist: (enabled: boolean): boolean => {
    if (!storage.isPremium()) return false;
    storage.updateCurrentUser({ preTradeChecklistEnabled: enabled });
    return true;
  },
  isPreTradeChecklistEnabled: (): boolean => storage.isPremium() ? (storage.getCurrentUser()?.preTradeChecklistEnabled || false) : false,

  // ── Rules ─────────────────────────────────────────────────────────────────
  getRules: (): Rule[] => {
    const user = storage.getCurrentUser();
    if (!user) return [];
    const str = localStorage.getItem(KEYS.RULES);
    const all: Rule[] = str ? JSON.parse(str) : [];
    return all.filter(r => r.userId === user.id);
  },

  addRule: (rule: Omit<Rule, 'id'>): Rule => {
    const user = storage.getCurrentUser();
    if (!user) throw new Error('No user');
    const all: Rule[] = JSON.parse(localStorage.getItem(KEYS.RULES) || '[]');
    const newRule = { ...rule, id: crypto.randomUUID(), userId: user.id };
    all.push(newRule);
    safeSetItem(KEYS.RULES, JSON.stringify(all));
    // Sync to Supabase
    supabase.from('rules').upsert({
      id: newRule.id, user_id: newRule.userId, title: newRule.title,
      description: newRule.description, tag: newRule.tag, is_critical: newRule.isCritical || false,
    }).then(({ error }) => { if (error) console.error('Rule sync error:', error); });
    return newRule;
  },

  deleteRule: (ruleId: string) => {
    const all: Rule[] = JSON.parse(localStorage.getItem(KEYS.RULES) || '[]');
    safeSetItem(KEYS.RULES, JSON.stringify(all.filter(r => r.id !== ruleId)));
    supabase.from('rules').delete().eq('id', ruleId).then(({ error }) => { if (error) console.error('Rule delete error:', error); });
  },

  // ── Day Logs ──────────────────────────────────────────────────────────────
  getDayLogs: (): DayLog[] => {
    const str = localStorage.getItem(KEYS.DAILY_LOGS);
    return str ? JSON.parse(str) : [];
  },

  getTodayLog: (): DayLog | null => {
    const today = new Date().toISOString().split('T')[0];
    return storage.getDayLogs().find(l => l.date === today) || null;
  },

  isDailyCheckLocked: (): boolean => {
    const user = storage.getCurrentUser();
    if (!user) return false;
    const last = localStorage.getItem(`daily_check_last_${user.id}`);
    if (!last) return false;
    return Date.now() - parseInt(last) < 5 * 3600000;
  },

  getDailyCheckCooldown: (): string | null => {
    const user = storage.getCurrentUser();
    if (!user) return null;
    const last = localStorage.getItem(`daily_check_last_${user.id}`);
    if (!last) return null;
    const elapsed = Date.now() - parseInt(last);
    if (elapsed >= 5 * 3600000) return null;
    const remaining = 5 * 3600000 - elapsed;
    return `${Math.floor(remaining / 3600000)}h ${Math.floor((remaining % 3600000) / 60000)}m`;
  },

  addDayLog: (log: Omit<DayLog, 'id'>): DayLog => {
    const logs = storage.getDayLogs();
    const newLog = { ...log, id: Date.now().toString() };
    logs.push(newLog);
    safeSetItem(KEYS.DAILY_LOGS, JSON.stringify(logs));
    const user = storage.getCurrentUser();
    if (user) {
      const updates: Partial<User> = { totalPoints: (user.totalPoints || 0) + log.pointsEarned };
      if (log.isClean) { updates.cleanDays = (user.cleanDays || 0) + 1; updates.currentStreak = (user.currentStreak || 0) + 1; }
      else { updates.forfeitDays = (user.forfeitDays || 0) + 1; updates.currentStreak = 0; }
      storage.updateCurrentUser(updates);
      localStorage.setItem(`daily_check_last_${user.id}`, Date.now().toString());
      const updatedUser = storage.getCurrentUser();
      if (updatedUser) {
        supabase.from('users').update({
          total_points: updatedUser.totalPoints,
          clean_days: updatedUser.cleanDays,
          forfeit_days: updatedUser.forfeitDays,
          current_streak: updatedUser.currentStreak,
        }).eq('id', updatedUser.id).then(({ error }) => {
          if (error) console.error('User points sync error:', error);
          else console.log('✅ User points synced:', updatedUser.totalPoints);
        });
      }
    }

    // Upload photo to Supabase Storage if base64, then sync log
    const syncLog = async () => {
      let photoUrl = newLog.photoUrl || '';

      if (photoUrl && photoUrl.startsWith('data:image')) {
        try {
          const uploadedUrl = await uploadImageToStorage(
            photoUrl, newLog.userId, newLog.id, 'photo', 'dailycheck'
          );
          if (uploadedUrl && !uploadedUrl.startsWith('data:image')) {
            photoUrl = uploadedUrl;
            // Update localStorage with the URL
            const updatedLogs = storage.getDayLogs().map(l =>
              l.id === newLog.id ? { ...l, photoUrl } : l
            );
            safeSetItem(KEYS.DAILY_LOGS, JSON.stringify(updatedLogs));
            console.log('✅ Day log photo uploaded to Storage:', photoUrl);
          }
        } catch (err) {
          console.error('Photo upload error:', err);
          photoUrl = ''; // Don't store base64 in Supabase
        }
      }

      await supabase.from('day_logs').upsert({
        id: newLog.id, user_id: newLog.userId, date: newLog.date, is_clean: newLog.isClean,
        photo_url: photoUrl || null, note: newLog.note || null,
        forfeit_completed: newLog.forfeitCompleted || null,
        points_earned: newLog.pointsEarned, posted: newLog.posted,
      }).then(({ error }) => {
        if (error) console.error('Day log sync error:', error);
        else console.log('✅ Day log synced to Supabase');
      });
    };

    syncLog();
    return newLog;
  },

  // ── Journal ───────────────────────────────────────────────────────────────
  getJournalEntries: (): JournalEntry[] => {
    const str = localStorage.getItem(KEYS.JOURNAL_ENTRIES);
    return str ? JSON.parse(str) : [];
  },

  addJournalEntry: (entry: Omit<JournalEntry, 'id'>): JournalEntry => {
    const entries = storage.getJournalEntries();
    const newEntry = { ...entry, id: Date.now().toString() };
    entries.push(newEntry);
    safeSetItem(KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
    // Sync to Supabase
    supabase.from('journal_entries').upsert({
      id: newEntry.id, user_id: newEntry.userId, date: newEntry.date, result: newEntry.result,
      description: newEntry.description || null, screenshots: newEntry.screenshots || [],
      custom_fields: newEntry.customFields || {}, risk_reward: newEntry.riskReward || null,
      pnl: newEntry.pnl || null, is_no_trade_day: newEntry.isNoTradeDay || false,
      points_awarded: newEntry.pointsAwarded || false, timestamp: newEntry.timestamp || Date.now(),
      strategy_id: newEntry.strategyId || null, asset_name: newEntry.assetName || null,
      action: newEntry.action || null, investment_thesis: newEntry.investmentThesis || null,
      sell_reason: newEntry.sellReason || null,
    }).then(({ data, error }) => { if (error) console.error('Journal entry sync error:', JSON.stringify(error)); else console.log('✅ Journal entry synced:', newEntry.id); });
    return newEntry;
  },

  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => {
    const entries = storage.getJournalEntries();
    const idx = entries.findIndex(e => e.id === id);
    if (idx !== -1) {
      entries[idx] = { ...entries[idx], ...updates };
      safeSetItem(KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
      supabase.from('journal_entries').update({
        result: updates.result, description: updates.description,
        custom_fields: updates.customFields, risk_reward: updates.riskReward,
        pnl: updates.pnl, screenshots: updates.screenshots,
      }).eq('id', id).then(({ error }) => { if (error) console.error('Journal update error:', error); });
    }
  },

  deleteJournalEntry: (id: string) => {
    safeSetItem(KEYS.JOURNAL_ENTRIES, JSON.stringify(storage.getJournalEntries().filter(e => e.id !== id)));
    supabase.from('journal_entries').delete().eq('id', id).then(({ error }) => { if (error) console.error('Journal delete error:', error); });
  },

  // ── Backtesting ───────────────────────────────────────────────────────────
  getBacktestingEntries: (): JournalEntry[] => {
    const str = localStorage.getItem(KEYS.BACKTESTING_ENTRIES);
    return str ? JSON.parse(str) : [];
  },

  addBacktestingEntry: (entry: Omit<JournalEntry, 'id'>): JournalEntry => {
    const entries = storage.getBacktestingEntries();
    const newEntry = { ...entry, id: Date.now().toString() };
    entries.push(newEntry);
    safeSetItem(KEYS.BACKTESTING_ENTRIES, JSON.stringify(entries));
    return newEntry;
  },

  updateBacktestingEntry: (id: string, updates: Partial<JournalEntry>) => {
    const entries = storage.getBacktestingEntries();
    const idx = entries.findIndex(e => e.id === id);
    if (idx !== -1) { entries[idx] = { ...entries[idx], ...updates }; safeSetItem(KEYS.BACKTESTING_ENTRIES, JSON.stringify(entries)); }
  },

  deleteBacktestingEntry: (id: string) => {
    safeSetItem(KEYS.BACKTESTING_ENTRIES, JSON.stringify(storage.getBacktestingEntries().filter(e => e.id !== id)));
  },

  // ── Journal Fields ────────────────────────────────────────────────────────
  getJournalFields: (): JournalFieldDefinition[] => {
    const str = localStorage.getItem(KEYS.CUSTOM_FIELDS);
    return str ? JSON.parse(str) : [];
  },

  addJournalField: (field: Omit<JournalFieldDefinition, 'id'>): JournalFieldDefinition => {
    const fields = storage.getJournalFields();
    const newField = { ...field, id: Date.now().toString() };
    fields.push(newField);
    safeSetItem(KEYS.CUSTOM_FIELDS, JSON.stringify(fields));
    return newField;
  },

  // Sync user-specific fields to Supabase
  syncUserFieldsToSupabase: (userId: string, fields: any[]) => {
    supabase.from('journal_fields').delete().eq('user_id', userId).then(() => {
      if (fields.length === 0) return;
      const rows = fields.map(f => ({
        id: String(f.id),
        user_id: userId,
        name: f.name,
        type: f.type,
        // Supabase options column is text[] — pass as array directly
        options: Array.isArray(f.options) ? f.options : [],
        category: f.category || 'confluence',
        other_label: f.otherLabel || null,
      }));
      supabase.from('journal_fields').insert(rows).then(({ error }) => {
        if (error) console.error('Journal fields sync error:', JSON.stringify(error));
        else console.log(`✅ Synced ${fields.length} journal fields to Supabase`);
      });
    });
  },

  deleteJournalField: (id: string) => {
    safeSetItem(KEYS.CUSTOM_FIELDS, JSON.stringify(storage.getJournalFields().filter(f => f.id !== id)));
  },

  // ── Strategies ────────────────────────────────────────────────────────────
  getStrategies: (): Strategy[] => {
    const user = storage.getCurrentUser();
    if (!user) return [];
    const str = localStorage.getItem(KEYS.STRATEGIES);
    if (!str) return [];
    return JSON.parse(str).filter((s: Strategy) => s.userId === user.id);
  },

  addStrategy: (strategy: Omit<Strategy, 'id'>): Strategy => {
    const strategies = JSON.parse(localStorage.getItem(KEYS.STRATEGIES) || '[]');
    const newStrategy: Strategy = { ...strategy, id: generateUniqueId() };
    strategies.push(newStrategy);
    safeSetItem(KEYS.STRATEGIES, JSON.stringify(strategies));
    supabase.from('strategies').upsert({
      id: newStrategy.id, user_id: newStrategy.userId, name: newStrategy.name,
      description: newStrategy.description || null, color: newStrategy.color,
    }).then(({ error }) => { if (error) console.error('Strategy sync error:', error); });
    return newStrategy;
  },

  deleteStrategy: (strategyId: string): void => {
    const strategies = JSON.parse(localStorage.getItem(KEYS.STRATEGIES) || '[]');
    safeSetItem(KEYS.STRATEGIES, JSON.stringify(strategies.filter((s: Strategy) => s.id !== strategyId)));
    supabase.from('strategies').delete().eq('id', strategyId).then(({ error }) => { if (error) console.error('Strategy delete error:', error); });
  },

  // ── Posts ─────────────────────────────────────────────────────────────────
  getPosts: (): Post[] => {
    const str = localStorage.getItem(KEYS.POSTS);
    return str ? JSON.parse(str) : [];
  },

  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'timestamp'>): Post => {
    const posts = storage.getPosts();
    const newPost: Post = {
      ...post,
      avatarUrl: post.avatarUrl?.startsWith('data:image') ? '' : (post.avatarUrl || ''),
      id: generateUniqueId(),
      likes: 0,
      comments: [],
      timestamp: Date.now(),
    };
    posts.unshift(newPost);
    safeSetItem(KEYS.POSTS, JSON.stringify(posts));

    // Upload images to Supabase Storage then sync post
    const uploadAndSync = async () => {
      try {
        let photoUrl = newPost.photoUrl || '';
        let images = newPost.images || [];

        // Upload main photo if base64
        if (photoUrl.startsWith('data:image')) {
          photoUrl = await uploadImageToStorage(photoUrl, newPost.userId, newPost.id, 'photo', 'dailycheck');
        }

        // Upload all images if base64
        images = await Promise.all(images.map(async (img, i) => {
          if (img.startsWith('data:image')) {
            return await uploadImageToStorage(img, newPost.userId, newPost.id, `img_${i}`, 'dailycheck');
          }
          return img;
        }));

        // Update local post with URLs
        const updatedPost = { ...newPost, photoUrl, images };
        const updatedPosts = storage.getPosts().map(p => p.id === newPost.id ? updatedPost : p);
        safeSetItem(KEYS.POSTS, JSON.stringify(updatedPosts));

        // Sync to Supabase with real URLs
        await supabase.from('posts').upsert({
          id: newPost.id, user_id: newPost.userId, username: newPost.username,
          avatar_url: newPost.avatarUrl || null,
          league: newPost.league, is_verified: newPost.isVerified, type: newPost.type,
          photo_url: photoUrl || null, images: images,
          caption: newPost.caption, likes: 0, journal_data: newPost.journalData || null,
          timestamp: newPost.timestamp,
        });
        console.log('✅ Post synced with images:', newPost.id);
      } catch (err) {
        console.error('Post upload/sync error:', err);
        // Still sync without images
        supabase.from('posts').upsert({
          id: newPost.id, user_id: newPost.userId, username: newPost.username,
          avatar_url: newPost.avatarUrl || null,
          league: newPost.league, is_verified: newPost.isVerified, type: newPost.type,
          photo_url: null, images: [],
          caption: newPost.caption, likes: 0, journal_data: newPost.journalData || null,
          timestamp: newPost.timestamp,
        }).then(({ error }) => { if (error) console.error('Post sync error:', error); });
      }
    };

    uploadAndSync();
    return newPost;
  },

  likePost: (postId: string) => {
    const user = storage.getCurrentUser();
    if (!user) return;
    const likedKey = `liked_posts_${user.id}`;
    const liked: string[] = JSON.parse(localStorage.getItem(likedKey) || '[]');
    if (liked.includes(postId)) return;
    liked.push(postId);
    localStorage.setItem(likedKey, JSON.stringify(liked));
    const posts = storage.getPosts();
    const post = posts.find(p => p.id === postId);
    if (post) { post.likes += 1; safeSetItem(KEYS.POSTS, JSON.stringify(posts)); }
  },

  hasLikedPost: (postId: string): boolean => {
    const user = storage.getCurrentUser();
    if (!user) return false;
    return JSON.parse(localStorage.getItem(`liked_posts_${user.id}`) || '[]').includes(postId);
  },

  getLikedPosts: (): string[] => {
    const user = storage.getCurrentUser();
    if (!user) return [];
    return JSON.parse(localStorage.getItem(`liked_posts_${user.id}`) || '[]');
  },

  addComment: (postId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => {
    const posts = storage.getPosts();
    const post = posts.find(p => p.id === postId);
    if (post) {
      const newComment: Comment = { ...comment, id: generateUniqueId(), timestamp: Date.now() };
      post.comments.push(newComment);
      safeSetItem(KEYS.POSTS, JSON.stringify(posts));
    }
  },

  deletePost: (postId: string) => {
    safeSetItem(KEYS.POSTS, JSON.stringify(storage.getPosts().filter(p => p.id !== postId)));
    supabase.from('posts').delete().eq('id', postId).then(({ error }) => { if (error) console.error('Post delete error:', error); });
  },

  // ── Activities ────────────────────────────────────────────────────────────
  getActivities: (): Activity[] => {
    const str = localStorage.getItem(KEYS.ACTIVITIES);
    return str ? JSON.parse(str) : [];
  },

  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>): Activity => {
    const activities = storage.getActivities();
    const newActivity: Activity = { ...activity, id: generateUniqueId(), timestamp: Date.now() };
    activities.unshift(newActivity);
    safeSetItem(KEYS.ACTIVITIES, JSON.stringify(activities));
    return newActivity;
  },

  // ── Onboarding ────────────────────────────────────────────────────────────
  isOnboardingComplete: (): boolean => localStorage.getItem(KEYS.ONBOARDING_COMPLETE) === 'true',
  setOnboardingComplete: () => safeSetItem(KEYS.ONBOARDING_COMPLETE, 'true'),

  getStorageInfo: () => ({
    totalSize: getStorageUsageMB().toFixed(2) + ' MB',
    journals: storage.getJournalEntries().length,
    backtesting: storage.getBacktestingEntries().length,
    posts: storage.getPosts().length,
    activities: storage.getActivities().length,
  }),

  manualCleanup: () => storage.getStorageInfo(),

  // ── Following ─────────────────────────────────────────────────────────────
  followUser: (userId: string) => {
    const user = storage.getCurrentUser();
    if (!user) return;
    const following = storage.getFollowing();
    if (following.includes(userId)) return;
    following.push(userId);
    safeSetItem(KEYS.FOLLOWING, JSON.stringify(following));
    storage.updateCurrentUser({ following: (user.following || 0) + 1 });
    const allUsers = storage.getAllUsers();
    const idx = allUsers.findIndex(u => u.id === userId);
    if (idx !== -1) { allUsers[idx].followers = (allUsers[idx].followers || 0) + 1; safeSetItem(KEYS.ALL_USERS, JSON.stringify(allUsers)); }
    supabase.from('following').upsert({ follower_id: user.id, following_id: userId }).then(({ error }) => { if (error) console.error('Follow sync error:', error); });
  },

  unfollowUser: (userId: string) => {
    const user = storage.getCurrentUser();
    if (!user) return;
    const following = storage.getFollowing().filter(id => id !== userId);
    safeSetItem(KEYS.FOLLOWING, JSON.stringify(following));
    storage.updateCurrentUser({ following: Math.max((user.following || 1) - 1, 0) });
    const allUsers = storage.getAllUsers();
    const idx = allUsers.findIndex(u => u.id === userId);
    if (idx !== -1) { allUsers[idx].followers = Math.max((allUsers[idx].followers || 1) - 1, 0); safeSetItem(KEYS.ALL_USERS, JSON.stringify(allUsers)); }
    supabase.from('following').delete().match({ follower_id: user.id, following_id: userId }).then(({ error }) => { if (error) console.error('Unfollow sync error:', error); });
  },

  getFollowing: (): string[] => JSON.parse(localStorage.getItem(KEYS.FOLLOWING) || '[]'),
  isFollowing: (userId: string): boolean => storage.getFollowing().includes(userId),

  // ── Groups ────────────────────────────────────────────────────────────────
  getGroups: (): Group[] => {
    const str = localStorage.getItem(KEYS.GROUPS);
    return str ? JSON.parse(str) : [];
  },

  addGroup: (group: Omit<Group, 'id' | 'createdAt'>): Group => {
    const groups = storage.getGroups();
    const newGroup: Group = { ...group, id: generateUniqueId(), createdAt: Date.now() };
    groups.push(newGroup);
    safeSetItem(KEYS.GROUPS, JSON.stringify(groups));
    supabase.from('groups').upsert({
      id: newGroup.id, name: newGroup.name, description: newGroup.description,
      creator_id: newGroup.creatorId, creator_username: newGroup.creatorUsername,
      type: newGroup.type, price: newGroup.price || null, member_count: newGroup.memberCount,
      members: newGroup.members, admins: newGroup.admins, invite_code: newGroup.inviteCode,
      is_public: newGroup.isPublic, challenges: newGroup.challenges || [],
    }).then(({ error }) => { if (error) console.error('Group sync error:', error); });
    return newGroup;
  },

  updateGroup: (id: string, updates: Partial<Group>) => {
    const groups = storage.getGroups();
    const idx = groups.findIndex(g => g.id === id);
    if (idx !== -1) {
      groups[idx] = { ...groups[idx], ...updates };
      safeSetItem(KEYS.GROUPS, JSON.stringify(groups));
      supabase.from('groups').update({
        name: updates.name, description: updates.description,
        member_count: updates.memberCount, members: updates.members,
        admins: updates.admins, challenges: updates.challenges,
      }).eq('id', id).then(({ error }) => { if (error) console.error('Group update error:', error); });
    }
  },

  deleteGroup: (id: string) => {
    safeSetItem(KEYS.GROUPS, JSON.stringify(storage.getGroups().filter(g => g.id !== id)));
    supabase.from('groups').delete().eq('id', id).then(({ error }) => { if (error) console.error('Group delete error:', error); });
  },

  // ── Join Requests ─────────────────────────────────────────────────────────
  getJoinRequests: (): JoinRequest[] => {
    const str = localStorage.getItem(KEYS.JOIN_REQUESTS);
    return str ? JSON.parse(str) : [];
  },

  addJoinRequest: (request: Omit<JoinRequest, 'id' | 'timestamp'>): JoinRequest => {
    const requests = storage.getJoinRequests();
    const newRequest: JoinRequest = { ...request, id: generateUniqueId(), timestamp: Date.now() };
    requests.push(newRequest);
    safeSetItem(KEYS.JOIN_REQUESTS, JSON.stringify(requests));
    supabase.from('join_requests').upsert({
      id: newRequest.id, group_id: newRequest.groupId, user_id: newRequest.userId,
      username: newRequest.username, status: newRequest.status, timestamp: newRequest.timestamp,
    }).then(({ error }) => { if (error) console.error('Join request sync error:', error); });
    return newRequest;
  },

  updateJoinRequest: (id: string, updates: Partial<JoinRequest>) => {
    const requests = storage.getJoinRequests();
    const idx = requests.findIndex(r => r.id === id);
    if (idx !== -1) {
      requests[idx] = { ...requests[idx], ...updates };
      safeSetItem(KEYS.JOIN_REQUESTS, JSON.stringify(requests));
      supabase.from('join_requests').update({ status: updates.status }).eq('id', id).then(({ error }) => { if (error) console.error('Join request update error:', error); });
    }
  },

  deleteJoinRequest: (id: string) => {
    safeSetItem(KEYS.JOIN_REQUESTS, JSON.stringify(storage.getJoinRequests().filter(r => r.id !== id)));
  },

  // ── Credits ───────────────────────────────────────────────────────────────
  getCreditTransactions: (): CreditTransaction[] => {
    const str = localStorage.getItem(KEYS.CREDIT_TRANSACTIONS);
    return str ? JSON.parse(str) : [];
  },

  addCreditTransaction: (transaction: Omit<CreditTransaction, 'id' | 'timestamp'>): CreditTransaction => {
    const transactions = storage.getCreditTransactions();
    const newTransaction: CreditTransaction = { ...transaction, id: generateUniqueId(), timestamp: Date.now() };
    transactions.push(newTransaction);
    safeSetItem(KEYS.CREDIT_TRANSACTIONS, JSON.stringify(transactions));
    return newTransaction;
  },

  updateCreditTransaction: (id: string, updates: Partial<CreditTransaction>) => {
    const transactions = storage.getCreditTransactions();
    const idx = transactions.findIndex(t => t.id === id);
    if (idx !== -1) { transactions[idx] = { ...transactions[idx], ...updates }; safeSetItem(KEYS.CREDIT_TRANSACTIONS, JSON.stringify(transactions)); }
  },

  deleteCreditTransaction: (id: string) => {
    safeSetItem(KEYS.CREDIT_TRANSACTIONS, JSON.stringify(storage.getCreditTransactions().filter(t => t.id !== id)));
  },

  getUserCredits: (): UserCredits[] => {
    const str = localStorage.getItem(KEYS.USER_CREDITS);
    return str ? JSON.parse(str) : [];
  },

  addUserCredits: (credits: Omit<UserCredits, 'transactions'>): UserCredits => {
    const all = storage.getUserCredits();
    const newCredits: UserCredits = { ...credits, transactions: [] };
    all.push(newCredits);
    safeSetItem(KEYS.USER_CREDITS, JSON.stringify(all));
    return newCredits;
  },

  updateUserCredits: (userId: string, updates: Partial<UserCredits>) => {
    const all = storage.getUserCredits();
    const idx = all.findIndex(c => c.userId === userId);
    if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; safeSetItem(KEYS.USER_CREDITS, JSON.stringify(all)); }
  },

  deleteUserCredits: (userId: string) => {
    safeSetItem(KEYS.USER_CREDITS, JSON.stringify(storage.getUserCredits().filter(c => c.userId !== userId)));
  },

  // ── Group Channels ────────────────────────────────────────────────────────
  getGroupChannels: (groupId: string): GroupChannel[] => {
    const str = localStorage.getItem(KEYS.GROUP_CHANNELS);
    if (!str) return [];
    return JSON.parse(str).filter((c: GroupChannel) => c.groupId === groupId);
  },

  addGroupChannel: (channel: Omit<GroupChannel, 'id' | 'createdAt'>): GroupChannel => {
    const channels = JSON.parse(localStorage.getItem(KEYS.GROUP_CHANNELS) || '[]');
    const newChannel: GroupChannel = { ...channel, id: generateUniqueId(), createdAt: Date.now() };
    channels.push(newChannel);
    safeSetItem(KEYS.GROUP_CHANNELS, JSON.stringify(channels));
    supabase.from('group_channels').upsert({
      id: newChannel.id, group_id: newChannel.groupId, name: newChannel.name,
      description: newChannel.description || null, created_by: newChannel.createdBy,
      is_default: newChannel.isDefault || false,
    }).then(({ error }) => { if (error) console.error('Channel sync error:', error); });
    return newChannel;
  },

  deleteGroupChannel: (channelId: string) => {
    const channels = JSON.parse(localStorage.getItem(KEYS.GROUP_CHANNELS) || '[]');
    safeSetItem(KEYS.GROUP_CHANNELS, JSON.stringify(channels.filter((c: GroupChannel) => c.id !== channelId)));
    const messages = JSON.parse(localStorage.getItem(KEYS.GROUP_MESSAGES) || '[]');
    safeSetItem(KEYS.GROUP_MESSAGES, JSON.stringify(messages.filter((m: GroupMessage) => m.channelId !== channelId)));
    supabase.from('group_channels').delete().eq('id', channelId).then(({ error }) => { if (error) console.error('Channel delete error:', error); });
  },

  // ── Group Messages ────────────────────────────────────────────────────────
  getGroupMessages: (channelId: string): GroupMessage[] => {
    const str = localStorage.getItem(KEYS.GROUP_MESSAGES);
    if (!str) return [];
    return JSON.parse(str).filter((m: GroupMessage) => m.channelId === channelId).sort((a: GroupMessage, b: GroupMessage) => a.timestamp - b.timestamp);
  },

  addGroupMessage: (message: Omit<GroupMessage, 'id' | 'timestamp'>): GroupMessage => {
    const messages = JSON.parse(localStorage.getItem(KEYS.GROUP_MESSAGES) || '[]');
    const newMessage: GroupMessage = { ...message, id: generateUniqueId(), timestamp: Date.now() };
    messages.push(newMessage);
    safeSetItem(KEYS.GROUP_MESSAGES, JSON.stringify(messages));
    supabase.from('group_messages').upsert({
      id: newMessage.id, channel_id: newMessage.channelId, group_id: newMessage.groupId,
      user_id: newMessage.userId, username: newMessage.username, content: newMessage.content,
      mentions: newMessage.mentions || [], attachments: newMessage.attachments || [],
      timestamp: newMessage.timestamp,
    }).then(({ error }) => { if (error) console.error('Message sync error:', error); });
    return newMessage;
  },

  updateGroupMessage: (messageId: string, updates: Partial<GroupMessage>) => {
    const messages = JSON.parse(localStorage.getItem(KEYS.GROUP_MESSAGES) || '[]');
    const idx = messages.findIndex((m: GroupMessage) => m.id === messageId);
    if (idx !== -1) {
      messages[idx] = { ...messages[idx], ...updates, edited: true, editedAt: Date.now() };
      safeSetItem(KEYS.GROUP_MESSAGES, JSON.stringify(messages));
    }
  },

  deleteGroupMessage: (messageId: string) => {
    const messages = JSON.parse(localStorage.getItem(KEYS.GROUP_MESSAGES) || '[]');
    safeSetItem(KEYS.GROUP_MESSAGES, JSON.stringify(messages.filter((m: GroupMessage) => m.id !== messageId)));
    supabase.from('group_messages').delete().eq('id', messageId).then(({ error }) => { if (error) console.error('Message delete error:', error); });
  },

  // ── Achievements ──────────────────────────────────────────────────────────
  addAchievement: (userId: string, achievement: Omit<Achievement, 'id' | 'earnedAt'>): Achievement => {
    const allUsers = storage.getAllUsers();
    const idx = allUsers.findIndex(u => u.id === userId);
    if (idx === -1) return { ...achievement, id: '', earnedAt: 0 };
    const user = allUsers[idx];
    const achievements = user.achievements || [];
    const newAchievement: Achievement = { ...achievement, id: generateUniqueId(), earnedAt: Date.now() };
    achievements.push(newAchievement);
    user.achievements = achievements;
    const trophyCount = achievements.filter(a => a.type === 'trophy').length;
    if (achievement.type === 'trophy' && trophyCount % 10 === 0) user.totalPoints = (user.totalPoints || 0) + 100;
    allUsers[idx] = user;
    safeSetItem(KEYS.ALL_USERS, JSON.stringify(allUsers));
    const currentUser = storage.getCurrentUser();
    if (currentUser && currentUser.id === userId) storage.setCurrentUser(user);
    return newAchievement;
  },

  awardChallengeWinnerAchievement: (userId: string, groupId: string, challengeId: string, challengeName: string, place: number): Achievement | null => {
    if (place < 1 || place > 3) return null;
    const types: Record<number, Achievement['type']> = { 1: 'trophy', 2: 'medal', 3: 'star' };
    const labels: Record<number, string> = { 1: '🥇 1st Place', 2: '🥈 2nd Place', 3: '🥉 3rd Place' };
    return storage.addAchievement(userId, {
      type: types[place], title: `${labels[place]} - ${challengeName}`,
      description: `Finished ${labels[place]} in the group challenge`,
      source: 'group_challenge', groupId, challengeId,
    });
  },

  // ── Mental Prep ───────────────────────────────────────────────────────────
  getMentalPrepSettings: () => {
    const str = localStorage.getItem(KEYS.MENTAL_PREP_SETTINGS);
    return str ? JSON.parse(str) : null;
  },
  saveMentalPrepSettings: (settings: any) => safeSetItem(KEYS.MENTAL_PREP_SETTINGS, JSON.stringify(settings)),

  getAffirmations: (): string[] => {
    const user = storage.getCurrentUser();
    const key = user ? `tradeforge_affirmations_${user.id}` : KEYS.AFFIRMATIONS;
    const str = localStorage.getItem(key);
    if (!str && user) { const old = localStorage.getItem(KEYS.AFFIRMATIONS); if (old) return JSON.parse(old); }
    return str ? JSON.parse(str) : [];
  },

  saveAffirmations: (affirmations: string[]) => {
    const user = storage.getCurrentUser();
    const key = user ? `tradeforge_affirmations_${user.id}` : KEYS.AFFIRMATIONS;
    safeSetItem(key, JSON.stringify(affirmations));
  },

  trackMentalPrepCompletion: (completed: boolean) => {
    const tracking = JSON.parse(localStorage.getItem(KEYS.MENTAL_PREP_TRACKING) || '[]');
    tracking.push({ date: new Date().toISOString(), completed, timestamp: Date.now() });
    safeSetItem(KEYS.MENTAL_PREP_TRACKING, JSON.stringify(tracking));
  },

  getMentalPrepTracking: () => {
    const str = localStorage.getItem(KEYS.MENTAL_PREP_TRACKING);
    return str ? JSON.parse(str) : [];
  },

  // ── Direct Messages ───────────────────────────────────────────────────────
  getDirectMessages: (): any[] => {
    const str = localStorage.getItem(KEYS.DIRECT_MESSAGES);
    return str ? JSON.parse(str) : [];
  },

  getDMConversation: (userId1: string, userId2: string): any[] => {
    return storage.getDirectMessages().filter(m =>
      (m.fromId === userId1 && m.toId === userId2) || (m.fromId === userId2 && m.toId === userId1)
    ).sort((a, b) => a.timestamp - b.timestamp);
  },

  getDMConversations: (userId: string): any[] => {
    const all = storage.getDirectMessages();
    const partnerIds = new Set<string>();
    all.forEach(m => { if (m.fromId === userId) partnerIds.add(m.toId); if (m.toId === userId) partnerIds.add(m.fromId); });
    return Array.from(partnerIds).map(partnerId => {
      const msgs = storage.getDMConversation(userId, partnerId);
      const partner = storage.getAllUsers().find(u => u.id === partnerId);
      return { partnerId, partner, lastMessage: msgs[msgs.length - 1], unreadCount: msgs.filter(m => m.toId === userId && !m.read).length };
    }).sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
  },

  sendDirectMessage: (fromId: string, toId: string, text: string, imageUrl?: string): any => {
    const msg = { id: `dm_${Date.now()}`, fromId, toId, text, imageUrl: imageUrl || null, timestamp: Date.now(), read: false };
    const all = storage.getDirectMessages();
    all.push(msg);
    safeSetItem(KEYS.DIRECT_MESSAGES, JSON.stringify(all));
    supabase.from('direct_messages').upsert({
      id: msg.id, from_id: fromId, to_id: toId, text: text || null,
      image_url: imageUrl || null, read: false, timestamp: msg.timestamp,
    }).then(({ error }) => { if (error) console.error('DM sync error:', error); });
    storage.addNotification({ userId: toId, type: 'dm', fromId, text: text.length > 50 ? text.slice(0, 50) + '...' : text });
    return msg;
  },

  deleteDMMessage: (msgId: string, userId1: string, userId2: string) => {
    const key = `dm_${[userId1, userId2].sort().join('_')}`;
    try {
      const msgs = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(msgs.filter((m: any) => m.id !== msgId)));
    } catch {}
    const all = storage.getDirectMessages().filter((m: any) => m.id !== msgId);
    safeSetItem(KEYS.DIRECT_MESSAGES, JSON.stringify(all));
    supabase.from('direct_messages').delete().eq('id', msgId).then(({ error }) => { if (error) console.error('DM delete error:', error); });
  },

  markDMsAsRead: (currentUserId: string, partnerId: string) => {
    const all = storage.getDirectMessages().map(m =>
      m.fromId === partnerId && m.toId === currentUserId ? { ...m, read: true } : m
    );
    safeSetItem(KEYS.DIRECT_MESSAGES, JSON.stringify(all));
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  getNotifications: (userId: string): any[] => {
    const str = localStorage.getItem(KEYS.NOTIFICATIONS);
    return (str ? JSON.parse(str) : []).filter((n: any) => n.userId === userId).sort((a: any, b: any) => b.timestamp - a.timestamp);
  },

  addNotification: (data: { userId: string; type: string; fromId?: string; text?: string; relatedId?: string }) => {
    const notif = { id: `notif_${Date.now()}`, ...data, timestamp: Date.now(), read: false };
    const str = localStorage.getItem(KEYS.NOTIFICATIONS);
    const all = str ? JSON.parse(str) : [];
    all.push(notif);
    safeSetItem(KEYS.NOTIFICATIONS, JSON.stringify(all.slice(-100)));
    return notif;
  },

  markNotificationsAsRead: (userId: string) => {
    const str = localStorage.getItem(KEYS.NOTIFICATIONS);
    const all = str ? JSON.parse(str) : [];
    safeSetItem(KEYS.NOTIFICATIONS, JSON.stringify(all.map((n: any) => n.userId === userId ? { ...n, read: true } : n)));
  },

  getUnreadNotificationCount: (userId: string): number => storage.getNotifications(userId).filter((n: any) => !n.read).length,
};

// ── League calculation ────────────────────────────────────────────────────────
export const getLeague = (points: number): { name: string; color: string; icon: string; roman: string; tier: string; division: number } => {
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

export const checkDemotion = (userId: string): boolean => {
  const logs = localStorage.getItem('tradeforge_daily_logs');
  if (!logs) return false;
  const last30 = JSON.parse(logs).filter((l: any) => l.userId === userId).slice(-30);
  if (last30.length < 10) return false;
  return Math.round(last30.filter((l: any) => l.isClean).length / last30.length * 100) < 40;
};

export const getDisciplineRate = (cleanDays: number, totalDays: number): number => {
  if (totalDays === 0) return 0;
  return Math.round((cleanDays / totalDays) * 100);
};
