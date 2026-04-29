import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { BookOpen, Plus, Upload, Camera, X, Calendar, TrendingUp, TrendingDown, Minus, Lock, Pencil, Check, Edit2, Trash2 } from 'lucide-react';
import { storage, JournalEntry, JournalFieldDefinition } from '../utils/storage';
import { PremiumGate } from '../components/PremiumGate';
import { PremiumUpgradeModal } from '../components/PremiumUpgradeModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { JournalList } from '../components/JournalList';
import { StrategyManager } from '../components/StrategyManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Settings } from 'lucide-react';
import { RevengeTradingAlert } from '../components/RevengeTradingAlert';
import { PreTradeChecklist } from '../components/PreTradeChecklist';
import { BehaviorRiskAlert, BehaviorRiskType } from '../components/BehaviorRiskAlert';

// ── User-specific field storage helpers ──────────────────────────────────────
// Fields are stored per-user so different accounts have independent field sets
const getUserFieldsKey = (userId: string) => `tradeforge_journal_fields_${userId}`;

const getUserFields = (userId: string): any[] => {
  try {
    return JSON.parse(localStorage.getItem(getUserFieldsKey(userId)) || '[]');
  } catch { return []; }
};

const saveUserFields = (userId: string, fields: any[]) => {
  localStorage.setItem(getUserFieldsKey(userId), JSON.stringify(fields));
  // Sync to Supabase so fields appear on all devices
  storage.syncUserFieldsToSupabase(userId, fields);
};


// Trading journal with live and backtesting tabs

// Sort entries newest first
// Get local date string YYYY-MM-DD without timezone shift
const getTodayLocal = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
};
const sortNewest = (arr: any[]) => [...arr].sort((a, b) => {
  const dateB = new Date(b.date).getTime();
  const dateA = new Date(a.date).getTime();
  if (dateB !== dateA) return dateB - dateA;
  return (b.timestamp || 0) - (a.timestamp || 0);
});

// FIX: Randomize journal points between 8 and 12
const getRandomJournalPoints = () => Math.floor(Math.random() * 5) + 8;

export function Journal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'live' | 'backtesting'>('live');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all'); // NEW: Strategy filter
  const [entries, setEntries] = useState(sortNewest(storage.getJournalEntries().filter(e => e.userId === (storage.getCurrentUser()?.id || ''))));
  const [backtestingEntries, setBacktestingEntries] = useState(sortNewest(storage.getBacktestingEntries()));
  const currentUserId = storage.getCurrentUser()?.id || '';
  const [customFields, setCustomFields] = useState(getUserFields(currentUserId));
  const [strategies, setStrategies] = useState(storage.getStrategies()); // NEW: Strategies
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFieldsDialogOpen, setIsFieldsDialogOpen] = useState(false);
  const [showRevengeTradingAlert, setShowRevengeTradingAlert] = useState(false);
  const [showPreTradeChecklist, setShowPreTradeChecklist] = useState(false);
  const [showBehaviorRiskAlert, setShowBehaviorRiskAlert] = useState(false);
  const [behaviorRiskType, setBehaviorRiskType] = useState<BehaviorRiskType>('revenge_trading');
  const isPremium = storage.isPremium();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const FREE_FIELD_LIMIT = 3;
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null); // NEW: Track entry being edited
  const [worstDayDate, setWorstDayDate] = useState<string | null>(null); // NEW: Track worst day from RevengeX
  
  const user = storage.getCurrentUser();
  const isLongTermHold = user?.tradingStyle === 'Long Term Hold';
  const isPreTradeChecklistEnabled = storage.isPreTradeChecklistEnabled();

  // Check for worst day navigation from RevengeX
  useEffect(() => {
    const worstDay = localStorage.getItem('revengex_worst_day');
    if (worstDay) {
      setWorstDayDate(worstDay);
      // Clear it after reading
      localStorage.removeItem('revengex_worst_day');
      
      // Scroll to that date after a short delay to let the component render
      setTimeout(() => {
        const dateElement = document.querySelector(`[data-date="${worstDay}"]`);
        if (dateElement) {
          dateElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, []);

  // Strategy section name customization
  const [isEditingStrategiesName, setIsEditingStrategiesName] = useState(false);
  const [customStrategiesName, setCustomStrategiesName] = useState(
    user?.strategiesSectionName || 'All Strategies'
  );
  const [tempStrategiesName, setTempStrategiesName] = useState(customStrategiesName);

  const handleSaveStrategiesName = () => {
    if (tempStrategiesName.trim()) {
      storage.updateCurrentUser({ strategiesSectionName: tempStrategiesName.trim() });
      setCustomStrategiesName(tempStrategiesName.trim());
      setIsEditingStrategiesName(false);
    }
  };

  const handleCancelStrategiesName = () => {
    setTempStrategiesName(customStrategiesName);
    setIsEditingStrategiesName(false);
  };

  const [newEntry, setNewEntry] = useState({
    date: getTodayLocal(),
    result: 'breakeven' as 'win' | 'loss' | 'breakeven',
    description: '',
    riskReward: 0,
    pnl: undefined as number | undefined, // NEW: Optional P&L field
    customFields: {} as Record<string, any>,
    screenshots: [] as string[],
    isNoTradeDay: false,
    strategyId: selectedStrategy === 'all' ? undefined : selectedStrategy, // NEW: Link to strategy
    // Investment fields for Long Term Hold users
    assetName: '',
    action: 'buy' as 'buy' | 'hold' | 'sell',
    investmentThesis: '',
    invalidationCondition: '',
    plannedHoldTime: '',
    sellReason: undefined as 'thesis_broken' | 'emotional_reaction' | 'planned_exit' | undefined,
    beResolution: undefined as 'continued_win' | 'continued_loss' | 'stayed_breakeven' | undefined,
  });
  const [hiddenFieldsForEntry, setHiddenFieldsForEntry] = useState<string[]>([]);
  // NEW: Track which optional preset fields the user has hidden for this entry
  const [hiddenSystemFields, setHiddenSystemFields] = useState<string[]>([]);
  const hideSystem = (field: string) => setHiddenSystemFields(prev => [...prev, field]);
  const showingSystem = (field: string) => !hiddenSystemFields.includes(field);
  const [newField, setNewField] = useState({
    name: '',
    type: 'text' as 'text' | 'number' | 'checkbox' | 'dropdown' | 'time' | 'image',
    options: [] as string[],
    category: 'confluence' as 'confluence' | 'time' | 'trade_number' | 'emotion' | 'other',
    otherLabel: '',
  });
  const [newFieldOption, setNewFieldOption] = useState('');
  const [editingField, setEditingField] = useState<any | null>(null);
  const [editFieldOption, setEditFieldOption] = useState('');
  const fieldsDialogScrollRef = useRef<HTMLDivElement>(null);

  // Check if points are available (6 hour cooldown)
  const checkPointsAvailable = () => {
    const user = storage.getCurrentUser();
    if (!user) return false;

    const entries = storage.getJournalEntries();
    const userEntries = entries.filter(e => e.userId === user.id && e.pointsAwarded);
    const lastPointsEntry = userEntries.length > 0 ? userEntries[userEntries.length - 1] : null;
    const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
    return !lastPointsEntry || (lastPointsEntry.timestamp && lastPointsEntry.timestamp < sixHoursAgo);
  };

  // Handle clicking "Add Entry" button - shows Pre-Trade Checklist if enabled
  const handleAddEntryClick = () => {
    // Skip checklist when editing existing entries
    if (editingEntry) {
      setIsDialogOpen(true);
      return;
    }

    // Show Pre-Trade Checklist if enabled for Premium users
    if (isPremium && isPreTradeChecklistEnabled && !newEntry.isNoTradeDay) {
      setShowPreTradeChecklist(true);
    } else {
      setIsDialogOpen(true);
    }
  };

  // Handle Pre-Trade Checklist completion
  const handlePreTradeChecklistComplete = (followedRules: boolean) => {
    setShowPreTradeChecklist(false);
    // You can track whether rules were followed if needed
    // For now, just proceed to add the entry
    setIsDialogOpen(true);
  };

  const handleAddEntry = () => {
    const user = storage.getCurrentUser();
    if (!user) return;

    // EMOTIONAL SELLING DETECTION (for Long Term Hold users selling)
    if (isLongTermHold && newEntry.action === 'sell' && !editingEntry) {
      // Find the original BUY entry for this asset to retrieve thesis
      const allEntries = storage.getJournalEntries();
      const originalBuyEntry = allEntries
        .filter(e => e.assetName === newEntry.assetName && e.action === 'buy')
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];

      // Show emotional selling detection prompt
      const confirmSell = window.confirm(
        `🚨 EMOTIONAL SELLING DETECTION\n\n` +
        `You're about to log a SELL for ${newEntry.assetName || 'this asset'}.\n\n` +
        (originalBuyEntry?.investmentThesis 
          ? `Your Original Thesis:\n"${originalBuyEntry.investmentThesis}"\n\n`
          : '') +
        `Question: Is your thesis broken or are you reacting to price?\n\n` +
        `• Click OK if your thesis is broken and you should sell\n` +
        `• Click CANCEL if you're having an emotional reaction`
      );

      if (!confirmSell) {
        // User clicked cancel - they're having an emotional reaction
        alert(
          `✅ GOOD DECISION!\n\n` +
          `You recognized this was an emotional reaction.\n\n` +
          `Remember your original thesis and stay disciplined.`
        );
        return; // Don't save the entry
      }

      // If they clicked OK, ask them to confirm the sell reason
      if (!newEntry.customFields?.whySell) {
        alert('Please fill in the "Why did you sell?" field before continuing.');
        return;
      }
    }

    if (editingEntry) {
      // UPDATE EXISTING ENTRY
      const allEntries = activeTab === 'backtesting' 
        ? storage.getBacktestingEntries() 
        : storage.getJournalEntries();
      
      const updatedEntries = allEntries.map(e =>
        e.id === editingEntry.id
          ? {
              ...e,
              date: newEntry.date,
              result: newEntry.result,
              description: newEntry.description,
              riskReward: newEntry.riskReward,
              customFields: newEntry.customFields,
              screenshots: newEntry.screenshots,
              isNoTradeDay: newEntry.isNoTradeDay,
              strategyId: newEntry.strategyId,
              // Investment fields
              assetName: newEntry.assetName,
              action: newEntry.action,
              investmentThesis: newEntry.investmentThesis,
              invalidationCondition: newEntry.invalidationCondition,
              plannedHoldTime: newEntry.plannedHoldTime,
            }
          : e
      );

      // Save to localStorage
      if (activeTab === 'backtesting') {
        localStorage.setItem('tradeforge_backtesting_entries', JSON.stringify(updatedEntries));
        setBacktestingEntries(sortNewest(updatedEntries));
      } else {
        localStorage.setItem('tradeforge_journal_entries', JSON.stringify(updatedEntries));
        setEntries(sortNewest(updatedEntries));
      }

      // Reset form and close dialog
      setEditingEntry(null);
      setNewEntry({
        date: getTodayLocal(),
        result: 'breakeven',
        description: '',
        riskReward: 0,
        pnl: undefined,
        customFields: {},
        screenshots: [],
        isNoTradeDay: false,
        strategyId: selectedStrategy === 'all' ? undefined : selectedStrategy,
        // Investment fields
        assetName: '',
        action: 'buy' as 'buy' | 'hold' | 'sell',
        investmentThesis: '',
        invalidationCondition: '',
        plannedHoldTime: '',
        sellReason: undefined,
      });
      setHiddenFieldsForEntry([]);
      setHiddenSystemFields([]);
      setIsDialogOpen(false);
      return;
    }

    // ADD NEW ENTRY (existing logic)
    if (activeTab === 'backtesting') {
      // Add backtesting entry (no points awarded)
      const entry = storage.addBacktestingEntry({
        userId: user.id,
        date: newEntry.date,
        result: isLongTermHold && newEntry.action === 'buy' ? 'breakeven' : newEntry.result,
        description: newEntry.description,
        riskReward: newEntry.riskReward,
        pnl: newEntry.pnl, // NEW: P&L field
        customFields: newEntry.customFields,
        screenshots: newEntry.screenshots,
        isNoTradeDay: newEntry.isNoTradeDay,
        pointsAwarded: false,
        timestamp: Date.now(),
        // Investment fields for Long Term Hold users
        assetName: isLongTermHold ? newEntry.assetName : undefined,
        action: isLongTermHold ? newEntry.action : undefined,
        investmentThesis: isLongTermHold ? newEntry.investmentThesis : undefined,
        invalidationCondition: isLongTermHold ? newEntry.invalidationCondition : undefined,
        plannedHoldTime: isLongTermHold ? newEntry.plannedHoldTime : undefined,
      });

      const updatedEntries = [entry, ...backtestingEntries];
      setBacktestingEntries(sortNewest(updatedEntries));
    } else {
      // Add live trading entry with points logic
      const entries = storage.getJournalEntries();
      const userEntries = entries.filter(e => e.userId === user.id && e.pointsAwarded);
      const lastPointsEntry = userEntries.length > 0 ? userEntries[userEntries.length - 1] : null;
      const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
      const shouldAwardPoints = !lastPointsEntry || (lastPointsEntry.timestamp && lastPointsEntry.timestamp < sixHoursAgo);

      const entry = storage.addJournalEntry({
        userId: user.id,
        date: newEntry.date,
        result: isLongTermHold && newEntry.action === 'buy' ? 'breakeven' : newEntry.result, // BUY entries have no result yet
        description: newEntry.description,
        riskReward: newEntry.riskReward,
        pnl: newEntry.pnl, // NEW: P&L field
        customFields: newEntry.customFields,
        screenshots: newEntry.screenshots,
        isNoTradeDay: newEntry.isNoTradeDay,
        pointsAwarded: shouldAwardPoints,
        timestamp: Date.now(),
        strategyId: newEntry.strategyId,
        beResolution: newEntry.beResolution,
        // Investment fields for Long Term Hold users
        assetName: isLongTermHold ? newEntry.assetName : undefined,
        action: isLongTermHold ? newEntry.action : undefined,
        investmentThesis: isLongTermHold ? newEntry.investmentThesis : undefined,
        invalidationCondition: isLongTermHold ? newEntry.invalidationCondition : undefined,
        plannedHoldTime: isLongTermHold ? newEntry.plannedHoldTime : undefined,
      });

      // FIX: Award points for both regular trades AND No Trade Days, with randomized 8-12 points
      if (shouldAwardPoints) {
        const pointsEarned = getRandomJournalPoints();
        storage.updateCurrentUser({
          totalPoints: user.totalPoints + pointsEarned,
        });
        toast.success(`+${pointsEarned} points earned! 🎯`);
      }

      const updatedEntries = [entry, ...entries];
      setEntries(sortNewest(updatedEntries));

      // Check for revenge trading pattern (only for live trading)
      const recentEntries = updatedEntries
        .filter(e => !e.isNoTradeDay)
        .slice(0, 5);
      
      if (recentEntries.length >= 3) {
        const hasRecentLoss = recentEntries.slice(1).some(e => e.result === 'loss');
        const multipleTradesAfterLoss = recentEntries.slice(0, 3).length === 3;
        
        if (hasRecentLoss && multipleTradesAfterLoss && entry.result === 'loss') {
          setShowRevengeTradingAlert(true);
        }
      }
    }

    setNewEntry({
      date: getTodayLocal(),
      result: 'breakeven',
      description: '',
      riskReward: 0,
      pnl: undefined,
      customFields: {},
      screenshots: [],
      isNoTradeDay: false,
      strategyId: selectedStrategy === 'all' ? undefined : selectedStrategy,
      // Investment fields
      assetName: '',
      action: 'buy' as 'buy' | 'hold' | 'sell',
      investmentThesis: '',
      invalidationCondition: '',
      plannedHoldTime: '',
      sellReason: undefined,
    });
    setHiddenFieldsForEntry([]);
    setHiddenSystemFields([]);
    setIsDialogOpen(false);
  };

  const handleAddField = () => {
    if (!newField.name) return;
    const field = {
      id: String(Date.now()),
      name: newField.name,
      type: newField.type,
      options: newField.type === 'dropdown' ? newField.options : undefined,
      category: newField.category,
      otherLabel: newField.category === 'other' ? newField.otherLabel : undefined,
    };
    const updated = [...customFields, field];
    saveUserFields(currentUserId, updated);
    setCustomFields(updated);
    setNewField({ name: '', type: 'text', options: [], category: 'confluence', otherLabel: '' });
    setNewFieldOption('');
  };

  const handleUpdateField = () => {
    if (!editingField?.name) return;
    const updated = customFields.map((f: any) => f.id === editingField.id ? {
      ...f,
      name: editingField.name,
      type: editingField.type,
      options: editingField.type === 'dropdown' ? (editingField.options || []) : undefined,
      category: editingField.category,
      otherLabel: editingField.category === 'other' ? editingField.otherLabel : undefined,
    } : f);
    saveUserFields(currentUserId, updated);
    setCustomFields(updated);
    setEditingField(null);
    setEditFieldOption('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEntry({
          ...newEntry,
          screenshots: [...newEntry.screenshots, reader.result as string],
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShareJournal = (entry: any) => {
    const user = storage.getCurrentUser();
    if (!user) return;

    // Format custom fields properly
    const customFieldsFormatted: Record<string, any> = {};
    if (entry.customFields && Object.keys(entry.customFields).length > 0) {
      const fieldDefinitions = getUserFields(currentUserId);

      Object.entries(entry.customFields).forEach(([key, value]) => {
        // Skip the redundant Confluences text field — individual checkbox fields already show this
        if (key.toLowerCase() === 'confluences') return;

        const fieldDef = fieldDefinitions.find(f => f.name === key);
        const isCheckbox = fieldDef?.type === 'checkbox' ||
          value === true || value === false ||
          value === 'true' || value === 'false';

        if (isCheckbox) {
          customFieldsFormatted[key] = (value === true || value === 'true') ? '✓' : '✗';
        } else if (fieldDef?.type === 'time') {
          customFieldsFormatted[key] = String(value);
        } else {
          customFieldsFormatted[key] = String(value);
        }
      });
    }

    const post = storage.addPost({
      userId: user.id,
      username: user.username,
      avatarUrl: user.profilePicture,
      league: user.totalPoints?.toString() || '0',
      isVerified: user.isVerified || false,
      photoUrl: entry.screenshots?.[0] || '',
      images: entry.screenshots || [],
      caption: entry.description || '',
      type: 'journal',
      journalData: {
        result: entry.result,
        isNoTradeDay: entry.isNoTradeDay,
        riskReward: entry.riskReward,
        date: entry.date,
        customFields: customFieldsFormatted,
      },
    });

    storage.addActivity({
      userId: user.id,
      type: 'journal',
      description: '📊 Shared a trade from journal',
      relatedId: post.id,
    });

    // Show confirmation
    toast.success('Trade shared to social feed! 📊');
  };

  // NEW: Handle editing an existing entry
  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      date: entry.date,
      result: entry.result,
      description: entry.description || '',
      riskReward: entry.riskReward || 0,
      customFields: entry.customFields || {},
      screenshots: entry.screenshots || [],
      isNoTradeDay: entry.isNoTradeDay || false,
      strategyId: entry.strategyId,
      // Investment fields
      assetName: entry.assetName || '',
      action: entry.action || 'buy',
      investmentThesis: entry.investmentThesis || '',
      invalidationCondition: entry.invalidationCondition || '',
      plannedHoldTime: entry.plannedHoldTime || '',
    });
    setHiddenFieldsForEntry([]);
    setIsDialogOpen(true);
  };

  // NEW: Handle creating a SELL entry from a BUY entry
  const handleCreateSellEntry = (buyEntry: JournalEntry) => {
    // FIX: Reset editingEntry so the form saves a new entry, not an update
    setEditingEntry(null);
    setNewEntry({
      date: getTodayLocal(),
      result: 'breakeven',
      description: '',
      riskReward: 0,
      customFields: {},
      screenshots: [],
      isNoTradeDay: false,
      strategyId: buyEntry.strategyId,
      // Pre-fill investment fields
      assetName: buyEntry.assetName || '',
      action: 'sell', // FIX: pre-set action to sell
      investmentThesis: '',
      invalidationCondition: '',
      plannedHoldTime: '',
    });
    setHiddenFieldsForEntry([]);
    setIsDialogOpen(true);
  };

  // NEW: Clear all journal entries
  const handleClearAllEntries = () => {
    if (confirm('⚠️ Are you sure you want to delete ALL journal entries? This cannot be undone!')) {
      // Clear all live trading entries
      const liveEntries = [...entries];
      liveEntries.forEach(entry => storage.deleteJournalEntry(entry.id));
      
      // Clear all backtesting entries
      const backtestEntries = [...backtestingEntries];
      backtestEntries.forEach(entry => storage.deleteBacktestingEntry(entry.id));
      
      // Update state
      setEntries([]);
      setBacktestingEntries([]);
      
      alert('✅ All journal entries have been cleared!');
    }
  };

  // Calculate stats
  const filteredEntries = selectedStrategy === 'all' 
    ? entries 
    : entries.filter(e => e.strategyId === selectedStrategy);
  
  const filteredBacktestingEntries = selectedStrategy === 'all'
    ? backtestingEntries
    : backtestingEntries.filter(e => e.strategyId === selectedStrategy);
  
  // For Long Term Hold, only count SELL entries in % Gain calculation
  const entriesForAvgCalc = isLongTermHold 
    ? filteredEntries.filter(e => e.action === 'sell')
    : filteredEntries;

  const stats = {
    totalTrades: isLongTermHold ? entriesForAvgCalc.length : filteredEntries.length,
    wins: entriesForAvgCalc.filter(e => e.result === 'win' || e.result === 'breakeven').length,
    losses: entriesForAvgCalc.filter(e => e.result === 'loss').length,
    winRate: entriesForAvgCalc.length > 0 ? Math.round((entriesForAvgCalc.filter(e => e.result === 'win' || e.result === 'breakeven').length / entriesForAvgCalc.length) * 100) : 0,
    avgRR: entriesForAvgCalc.length > 0 ? 
      (entriesForAvgCalc.reduce((sum, e) => sum + (e.riskReward || 0), 0) / entriesForAvgCalc.length).toFixed(2) : 
      '0.00',
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'loss':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getResultBadge = (result: string) => {
    const colors = {
      win: 'bg-green-500/10 text-green-500 border-green-500/20',
      loss: 'bg-red-500/10 text-red-500 border-red-500/20',
      breakeven: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    };
    return colors[result as keyof typeof colors] || colors.breakeven;
  };

  useEffect(() => {
    const user = storage.getCurrentUser();
    if (!user) return;

    const allEntries = storage.getJournalEntries();
    const userEntries = allEntries.filter(e => e.userId === user.id);
    
    // Debug: Log all entries to see what's stored
    console.log('📊 Total journal entries:', userEntries.length);
    console.log('📊 Entries with screenshots:', userEntries.filter(e => e.screenshots && e.screenshots.length > 0).length);
    console.log('📊 Entries with custom fields:', userEntries.filter(e => e.customFields && Object.keys(e.customFields).length > 0).length);
    
    // Debug: Log image custom fields
    userEntries.forEach((entry, idx) => {
      if (entry.customFields) {
        Object.entries(entry.customFields).forEach(([key, value]) => {
          if (typeof value === 'string' && value.startsWith('data:image')) {
            console.log(`✅ Entry #${idx} has image field "${key}" with ${value.length} chars`);
          } else if (typeof value === 'string' && value === '') {
            const fieldDef = getUserFields(currentUserId).find((f: any) => f.name === key);
            if (fieldDef?.type === 'image') {
              console.log(`❌ Entry #${idx} has EMPTY image field "${key}" (was removed by cleanup)`);
            }
          }
        });
      }
    });
    
    setEntries(sortNewest(userEntries));
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <PremiumUpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        feature="Unlimited Custom Fields"
        onUpgrade={() => {
          storage.upgradeToPremium();
          setShowUpgradeModal(false);
          window.location.reload();
        }}
      />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Trading Journal</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearAllEntries}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Dialog open={isFieldsDialogOpen} onOpenChange={setIsFieldsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Fields
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
              <div className="p-6 pb-0">
                <DialogHeader>
                  <DialogTitle>Customize Journal Fields</DialogTitle>
                  <DialogDescription>
                    Add, edit, or remove fields. Free users: 3 custom fields. Premium: unlimited.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="px-6 pb-6 overflow-y-auto" ref={fieldsDialogScrollRef} style={{ maxHeight: 'calc(90vh - 140px)' }}>
                <div className="space-y-5 pt-4">

                  {/* ── System fields (always present, cannot be removed) ── */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Built-in Fields (always included)</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { name: 'Date',          type: 'date'     },
                        { name: 'Result (W/L/BE)',type: 'dropdown' },
                        { name: 'Risk:Reward',   type: 'number'   },
                        { name: 'P&L ($)',       type: 'number'   },
                        { name: 'Description',   type: 'text'     },
                        { name: 'Screenshot',    type: 'image'    },
                      ].map(f => (
                        <div key={f.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-transparent">
                          <span className="text-sm font-medium">{f.name}</span>
                          <span className="text-xs text-muted-foreground">{f.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    {/* ── Free limit warning ── */}
                    {!isPremium && customFields.length >= FREE_FIELD_LIMIT && (
                      <PremiumGate
                        isPremium={false}
                        featureName="Unlimited Custom Fields"
                        description="Free users can add up to 3 custom fields. Upgrade to Premium for unlimited fields."
                        variant="banner"
                        onUpgrade={() => { setIsFieldsDialogOpen(false); setShowUpgradeModal(true); }}
                      />
                    )}

                    {/* ── Add / Edit form ── */}
                    {(!editingField) ? (
                      <div className="space-y-4">
                        <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                          {!isPremium && customFields.length >= FREE_FIELD_LIMIT ? 'Upgrade to add more' : 'Add New Field'}
                        </Label>

                        {/* Category */}
                        <div className="space-y-2">
                          <Label>Category <span className="text-xs text-muted-foreground font-normal">(tells AI what to analyse)</span></Label>
                          <div className="grid grid-cols-2 gap-2">
                            {([
                              { value: 'confluence',   label: 'Confluence / Setup', desc: 'e.g. OTE, CISD, Delta Flip', icon: '🎯' },
                              { value: 'time',         label: 'Entry Time',          desc: '09:45 — unlocks session analysis', icon: '⏱' },
                              { value: 'trade_number', label: 'Trade #',             desc: '1st, 2nd, 3rd trade of the day', icon: '🔢' },
                              { value: 'emotion',      label: 'Emotion / Mental',   desc: 'Confident, Calm, Revenge…', icon: '🧠' },
                              { value: 'other',        label: 'Other',              desc: 'Custom — you name it', icon: '📋' },
                            ] as const).map(cat => (
                              <button
                                key={cat.value}
                                type="button"
                                onClick={() => setNewField({ ...newField, category: cat.value, type: cat.value === 'time' ? 'time' : 'text' })}
                                className={`p-3 rounded-lg border text-left transition-all ${newField.category === cat.value ? 'border-primary bg-primary/10' : 'border-border bg-muted hover:border-primary/40'}`}
                              >
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span>{cat.icon}</span>
                                  <span className="font-semibold text-xs">{cat.label}</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-tight">{cat.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Other label */}
                        {newField.category === 'other' && (
                          <div className="space-y-2">
                            <Label>What does "Other" mean for this field?</Label>
                            <Input
                              placeholder="e.g. News Event, HTF Bias, Spread, Notes..."
                              value={newField.otherLabel}
                              onChange={e => setNewField({ ...newField, otherLabel: e.target.value })}
                            />
                          </div>
                        )}

                        {/* Field name */}
                        <div className="space-y-2">
                          <Label>Field Name</Label>
                          <Input
                            placeholder={
                              newField.category === 'confluence'   ? 'e.g. Confluences, ICT Concepts, Setup' :
                              newField.category === 'time'         ? 'e.g. Entry Time, Session' :
                              newField.category === 'trade_number' ? 'e.g. Trade Number' :
                              newField.category === 'emotion'      ? 'e.g. Emotion, Mindset' :
                              newField.otherLabel || 'Field name'
                            }
                            value={newField.name}
                            onChange={e => setNewField({ ...newField, name: e.target.value })}
                          />
                          {newField.category === 'time' && (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setNewField({ ...newField, name: 'Entry Time', type: 'time' })}
                                className="text-xs px-2 py-1 rounded bg-muted border hover:border-primary/40 transition-all">
                                + Entry Time
                              </button>
                              <button type="button" onClick={() => setNewField({ ...newField, name: 'Session', type: 'dropdown' })}
                                className="text-xs px-2 py-1 rounded bg-muted border hover:border-primary/40 transition-all">
                                + Session
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Field type */}
                        <div className="space-y-2">
                          <Label>Field Type</Label>
                          <Select value={newField.type} onValueChange={(v: any) => setNewField({ ...newField, type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {newField.category === 'time'
                                ? <>
                                    <SelectItem value="time">Time Picker</SelectItem>
                                    <SelectItem value="text">Text Box</SelectItem>
                                    <SelectItem value="dropdown">Dropdown (pick from list)</SelectItem>
                                  </>
                                : <>
                                    <SelectItem value="text">Text Box</SelectItem>
                                    <SelectItem value="checkbox">Checkbox (yes / no)</SelectItem>
                                    <SelectItem value="dropdown">Dropdown (pick from list)</SelectItem>
                                    {newField.category !== 'confluence' && newField.category !== 'emotion' && (
                                      <SelectItem value="number">Number</SelectItem>
                                    )}
                                  </>
                              }
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Dropdown options */}
                        {newField.type === 'dropdown' && (
                          <div className="space-y-2">
                            <Label>Dropdown Options</Label>
                            <div className="flex gap-2">
                              <Input placeholder="Add option" value={newFieldOption} onChange={e => setNewFieldOption(e.target.value)}
                                onKeyDown={e => { if (e.key==='Enter' && newFieldOption) { setNewField({ ...newField, options: [...newField.options, newFieldOption] }); setNewFieldOption(''); } }} />
                              <Button type="button" size="sm" onClick={() => { if (newFieldOption) { setNewField({ ...newField, options: [...newField.options, newFieldOption] }); setNewFieldOption(''); } }}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {newField.options.map((opt, i) => (
                                <Badge key={i} variant="secondary">{opt}
                                  <button onClick={() => setNewField({ ...newField, options: newField.options.filter((_,idx)=>idx!==i) })} className="ml-1"><X className="w-3 h-3"/></button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={handleAddField}
                          disabled={!newField.name || (!isPremium && customFields.length >= FREE_FIELD_LIMIT)}
                          className="w-full"
                        >
                          Add Field
                        </Button>
                      </div>
                    ) : (
                      /* ── Edit existing field ── */
                      <div className="space-y-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Editing: {editingField.name}</Label>
                          <button onClick={() => setEditingField(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4"/></button>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {([
                              { value: 'confluence',   label: 'Confluence / Setup', icon: '🎯' },
                              { value: 'time',         label: 'Entry Time',          icon: '⏱' },
                              { value: 'trade_number', label: 'Trade #',             icon: '🔢' },
                              { value: 'emotion',      label: 'Emotion / Mental',   icon: '🧠' },
                              { value: 'other',        label: 'Other',              icon: '📋' },
                            ] as const).map(cat => (
                              <button key={cat.value} type="button"
                                onClick={() => setEditingField({ ...editingField, category: cat.value })}
                                className={`p-2.5 rounded-lg border text-left text-xs font-semibold flex items-center gap-1.5 transition-all ${editingField.category === cat.value ? 'border-primary bg-primary/10' : 'border-border bg-muted'}`}
                              >
                                <span>{cat.icon}</span>{cat.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {editingField.category === 'other' && (
                          <div className="space-y-2">
                            <Label>What does "Other" mean?</Label>
                            <Input value={editingField.otherLabel||''} onChange={e => setEditingField({ ...editingField, otherLabel: e.target.value })} placeholder="e.g. News Event, HTF Bias…" />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Field Name</Label>
                          <Input value={editingField.name} onChange={e => setEditingField({ ...editingField, name: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                          <Label>Field Type</Label>
                          <Select value={editingField.type} onValueChange={(v: any) => setEditingField({ ...editingField, type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {editingField.category === 'time'
                                ? <><SelectItem value="time">Time Picker</SelectItem><SelectItem value="text">Text Box</SelectItem></>
                                : <><SelectItem value="text">Text Box</SelectItem><SelectItem value="checkbox">Checkbox</SelectItem><SelectItem value="dropdown">Dropdown</SelectItem><SelectItem value="number">Number</SelectItem></>
                              }
                            </SelectContent>
                          </Select>
                        </div>

                        {editingField.type === 'dropdown' && (
                          <div className="space-y-2">
                            <Label>Dropdown Options</Label>
                            <div className="flex gap-2">
                              <Input placeholder="Add option" value={editFieldOption} onChange={e => setEditFieldOption(e.target.value)}
                                onKeyDown={e => { if (e.key==='Enter' && editFieldOption) { setEditingField({ ...editingField, options: [...(editingField.options||[]), editFieldOption] }); setEditFieldOption(''); } }} />
                              <Button type="button" size="sm" onClick={() => { if (editFieldOption) { setEditingField({ ...editingField, options: [...(editingField.options||[]), editFieldOption] }); setEditFieldOption(''); } }}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(editingField.options||[]).map((opt: string, i: number) => (
                                <Badge key={i} variant="secondary">{opt}
                                  <button onClick={() => setEditingField({ ...editingField, options: editingField.options.filter((_:any,idx:number)=>idx!==i) })} className="ml-1"><X className="w-3 h-3"/></button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button onClick={handleUpdateField} className="flex-1">Save Changes</Button>
                          <Button variant="outline" onClick={() => setEditingField(null)} className="flex-1">Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Custom fields list ── */}
                  {customFields.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Your Custom Fields ({customFields.length}{!isPremium ? `/${FREE_FIELD_LIMIT}` : ''})</Label>
                      {customFields.map((field) => (
                        <div key={field.id} className="flex items-center justify-between p-3 bg-muted rounded-lg group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{field.name}</p>
                              {(field as any).category && (
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  (field as any).category === 'confluence'   ? 'bg-primary/20 text-primary' :
                                  (field as any).category === 'time'         ? 'bg-blue-500/20 text-blue-600' :
                                  (field as any).category === 'trade_number' ? 'bg-purple-500/20 text-purple-600' :
                                  (field as any).category === 'emotion'      ? 'bg-pink-500/20 text-pink-600' :
                                  'bg-muted-foreground/20 text-muted-foreground'
                                }`}>
                                  {({confluence:'🎯 Confluence', time:'⏱ Time', trade_number:'🔢 Trade #', emotion:'🧠 Emotion', other:'📋 Other'} as any)[(field as any).category] || (field as any).category}
                                  {(field as any).otherLabel && ` — ${(field as any).otherLabel}`}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">{field.type}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingField({ ...field }); setTimeout(() => fieldsDialogScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50); }}
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm"
                              onClick={() => { if (confirm(`Delete "${field.name}"? This removes it from all future entries.`)) { const updated = customFields.filter((f: any) => f.id !== field.id); saveUserFields(currentUserId, updated); setCustomFields(updated); if (editingField?.id === field.id) setEditingField(null); } }}
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {checkPointsAvailable() ? 'Add Entry +Points' : 'Add Entry'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
              <div className="p-6 pb-0">
                <DialogHeader>
                  <DialogTitle>{editingEntry ? 'Edit Journal Entry' : 'Add Journal Entry'}</DialogTitle>
                  <DialogDescription>Record your trading activity, including results, risk/reward ratios, and any additional notes or screenshots.</DialogDescription>
                </DialogHeader>
              </div>
              <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                <div className="space-y-4 pt-4">
                  {/* No Trade Day Option */}
                  <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                    <Checkbox
                      id="no-trade-day"
                      checked={newEntry.isNoTradeDay}
                      onCheckedChange={(checked) => setNewEntry({ ...newEntry, isNoTradeDay: !!checked })}
                    />
                    <Label htmlFor="no-trade-day" className="cursor-pointer">
                      No Trade Day (I stayed disciplined and didn't force trades)
                    </Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newEntry.date}
                        onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                      />
                    </div>

                    {/* Only show Result for non-Long Term Hold users, OR for Long Term Hold SELL entries */}
                    {(!isLongTermHold || newEntry.action === 'sell') && (
                      <div className="space-y-2">
                        <Label>Result</Label>
                        <Select
                          value={newEntry.result}
                          onValueChange={(value) => setNewEntry({ ...newEntry, result: value as any, beResolution: undefined })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="win">Win</SelectItem>
                            <SelectItem value="loss">Loss</SelectItem>
                            <SelectItem value="breakeven">Break Even</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* BE Resolution — only shown when result is breakeven */}
                  {newEntry.result === 'breakeven' && !newEntry.isNoTradeDay && !isLongTermHold && (
                    <div className="space-y-2">
                      <Label>How did it resolve? <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                      <Select
                        value={newEntry.beResolution || ''}
                        onValueChange={(value) => setNewEntry({ ...newEntry, beResolution: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="continued_win">✅ Continued to Win</SelectItem>
                          <SelectItem value="continued_loss">❌ Continued to Loss</SelectItem>
                          <SelectItem value="stayed_breakeven">➖ Stayed Breakeven</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Only show Risk:Reward for non-Long Term Hold users */}
                  {!isLongTermHold && showingSystem('rr') && (
                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <Label>Risk:Reward (optional)</Label>
                        <button onClick={() => hideSystem('rr')} className="text-muted-foreground hover:text-foreground" title="Hide field"><X className="w-3 h-3" /></button>
                      </div>
                      <Input
                        type="number"
                        onWheel={(e) => e.currentTarget.blur()}
                        step="0.1"
                        value={newEntry.riskReward === 0 ? '' : newEntry.riskReward}
                        onChange={(e) => setNewEntry({ ...newEntry, riskReward: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 1.5"
                      />
                    </div>
                  )}

                  {/* P&L field - shown for all users */}
                  {showingSystem('pnl') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>P&L (Profit/Loss in $) - Optional</Label>
                        <button onClick={() => hideSystem('pnl')} className="text-muted-foreground hover:text-foreground" title="Hide field"><X className="w-3 h-3" /></button>
                      </div>
                      <Input
                        type="number"
                          onWheel={(e) => e.currentTarget.blur()}
                        step="0.01"
                        value={newEntry.pnl ?? ''}
                        onChange={(e) => setNewEntry({ ...newEntry, pnl: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="e.g., 500 for +$500 or -200 for -$200"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter positive for profit, negative for loss. This helps calculate your worst trading day.
                      </p>
                    </div>
                  )}

                  {/* Show % Gain for Long Term Hold users on SELL entries */}
                  {isLongTermHold && newEntry.action === 'sell' && (
                    <div className="space-y-2">
                      <Label>% Gain/Loss</Label>
                      <Input
                        type="number"
                        onWheel={(e) => e.currentTarget.blur()}
                        step="0.01"
                        value={newEntry.riskReward === 0 ? '' : newEntry.riskReward}
                        onChange={(e) => setNewEntry({ ...newEntry, riskReward: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 25.5 for +25.5% or -10 for -10%"
                      />
                    </div>
                  )}

                  {showingSystem('description') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Description (optional)</Label>
                        <button onClick={() => hideSystem('description')} className="text-muted-foreground hover:text-foreground" title="Hide field"><X className="w-3 h-3" /></button>
                      </div>
                      <Textarea
                        value={newEntry.description}
                        onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                        placeholder="What happened? What did you learn?"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Screenshot Upload */}
                  {showingSystem('screenshot') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Trade Screenshot (optional)</Label>
                      <button onClick={() => hideSystem('screenshot')} className="text-muted-foreground hover:text-foreground" title="Hide field"><X className="w-3 h-3" /></button>
                    </div>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>
                    {newEntry.screenshots.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {newEntry.screenshots.map((img, i) => (
                          <div key={i} className="relative">
                            <img src={img} alt={`Screenshot ${i + 1}`} className="w-full h-20 object-cover rounded" />
                            <button
                              onClick={() => setNewEntry({
                                ...newEntry,
                                screenshots: newEntry.screenshots.filter((_, idx) => idx !== i),
                              })}
                              className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Custom Fields — grouped by category */}
                  {customFields.length > 0 && (() => {
                    const categories = [
                      { key: 'confluence',   label: 'Confluences / Setup', icon: '🎯', color: 'text-primary' },
                      { key: 'time',         label: 'Entry Time',           icon: '⏱', color: 'text-blue-500' },
                      { key: 'trade_number', label: 'Trade #',              icon: '🔢', color: 'text-purple-500' },
                      { key: 'emotion',      label: 'Emotion',              icon: '🧠', color: 'text-pink-500' },
                      { key: 'other',        label: 'Other',                icon: '📋', color: 'text-muted-foreground' },
                      { key: undefined,      label: 'Other Fields',         icon: '📋', color: 'text-muted-foreground' },
                    ];

                    const renderField = (field: any) => (
                      <div key={field.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">{field.name}</Label>
                          <Button
                            variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-40 hover:opacity-100"
                            onClick={() => {
                              setHiddenFieldsForEntry([...hiddenFieldsForEntry, field.id]);
                              const updatedFields = { ...newEntry.customFields };
                              delete updatedFields[field.name];
                              setNewEntry({ ...newEntry, customFields: updatedFields });
                            }}
                            title="Hide from this entry"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>

                        {field.type === 'checkbox' && (
                          <div
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer select-none border transition-all ${
                              newEntry.customFields[field.name] === true || newEntry.customFields[field.name] === 'true'
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-muted border-transparent'
                            }`}
                            onClick={() => setNewEntry({
                              ...newEntry,
                              customFields: {
                                ...newEntry.customFields,
                                [field.name]: !(newEntry.customFields[field.name] === true || newEntry.customFields[field.name] === 'true'),
                              },
                            })}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              newEntry.customFields[field.name] === true || newEntry.customFields[field.name] === 'true'
                                ? 'bg-green-500 border-green-500'
                                : 'border-muted-foreground/40 bg-background'
                            }`}>
                              {(newEntry.customFields[field.name] === true || newEntry.customFields[field.name] === 'true') && (
                                <span className="text-white text-xs font-bold">✓</span>
                              )}
                            </div>
                            <span className={`text-sm font-medium ${
                              newEntry.customFields[field.name] === true || newEntry.customFields[field.name] === 'true'
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-muted-foreground'
                            }`}>
                              {newEntry.customFields[field.name] === true || newEntry.customFields[field.name] === 'true' ? 'Present ✓' : 'Not present'}
                            </span>
                          </div>
                        )}
                        {field.type === 'text' && (
                          <Input
                            value={newEntry.customFields[field.name] || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, customFields: { ...newEntry.customFields, [field.name]: e.target.value } })}
                            placeholder={`Enter ${field.name}`}
                          />
                        )}
                        {field.type === 'number' && (
                          <Input
                            type="number"
                            onWheel={(e) => e.currentTarget.blur()}
                            value={newEntry.customFields[field.name] || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, customFields: { ...newEntry.customFields, [field.name]: parseFloat(e.target.value) || 0 } })}
                            placeholder={`Enter ${field.name}`}
                          />
                        )}
                        {field.type === 'dropdown' && (
                          <Select
                            value={newEntry.customFields[field.name] || ''}
                            onValueChange={(value) => setNewEntry({ ...newEntry, customFields: { ...newEntry.customFields, [field.name]: value } })}
                          >
                            <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                            <SelectContent>
                              {field.options?.map((opt: string) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {field.type === 'time' && (
                          <Input
                            type="time"
                            value={newEntry.customFields[field.name] || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, customFields: { ...newEntry.customFields, [field.name]: e.target.value } })}
                          />
                        )}
                        {field.type === 'image' && (
                          <div className="border-2 border-dashed rounded-lg p-4 text-center relative">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <input type="file" accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setNewEntry({ ...newEntry, customFields: { ...newEntry.customFields, [field.name]: reader.result as string } });
                                reader.readAsDataURL(file);
                              }
                            }} />
                            {newEntry.customFields[field.name] && (
                              <div className="mt-2">
                                <img src={newEntry.customFields[field.name]} alt={field.name} className="w-full h-20 object-cover rounded" />
                                <button onClick={() => setNewEntry({ ...newEntry, customFields: { ...newEntry.customFields, [field.name]: '' } })}
                                  className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );

                    return (
                      <div className="space-y-4 pt-2 border-t">
                        {categories.map(cat => {
                          const catFields = customFields.filter(f =>
                            !hiddenFieldsForEntry.includes(f.id) &&
                            ((cat.key === undefined && !(f as any).category) || (f as any).category === cat.key)
                          );
                          if (catFields.length === 0) return null;
                          return (
                            <div key={cat.key || 'uncategorised'} className="space-y-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{cat.icon}</span>
                                <span className={`text-xs font-bold uppercase tracking-wider ${cat.color}`}>{cat.label}</span>
                              </div>
                              {/* Confluence checkboxes get a compact grid layout */}
                              {cat.key === 'confluence' ? (
                                <div className="grid grid-cols-2 gap-2">
                                  {catFields.map(field => renderField(field))}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {catFields.map(field => renderField(field))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Investment Fields for Long Term Hold Users */}
                  {isLongTermHold && (
                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-lg font-semibold">
                          {newEntry.action === 'buy' ? '📈 Investment Entry Journal' : newEntry.action === 'sell' ? '📊 Investment Outcome Journal' : '💼 Investment Fields'}
                        </Label>
                      </div>

                      {/* Asset Name - Always show */}
                      <div className="space-y-2 p-3 bg-muted/50 rounded-lg relative">
                        <Label className="text-sm font-medium">Asset Name *</Label>
                        <Input
                          value={newEntry.assetName}
                          onChange={(e) => setNewEntry({
                            ...newEntry,
                            assetName: e.target.value,
                          })}
                          placeholder="e.g., AAPL, Bitcoin, Tesla"
                        />
                      </div>

                      {/* Action - Always show */}
                      <div className="space-y-2 p-3 bg-muted/50 rounded-lg relative">
                        <Label className="text-sm font-medium">Action *</Label>
                        <Select
                          value={newEntry.action}
                          onValueChange={(value) => setNewEntry({
                            ...newEntry,
                            action: value as 'buy' | 'hold' | 'sell',
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Show Original BUY Entry when action is SELL */}
                      {newEntry.action === 'sell' && newEntry.assetName && (() => {
                        const allEntries = storage.getJournalEntries();
                        const originalBuyEntry = allEntries
                          .filter(e => e.userId === user?.id && e.assetName === newEntry.assetName && e.action === 'buy')
                          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
                        
                        return originalBuyEntry ? (
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                            <p className="text-sm font-bold mb-3 flex items-center gap-2">
                              <span className="text-blue-600 dark:text-blue-400">🔗 Auto-Linked to Original BUY Entry</span>
                            </p>
                            <div className="space-y-2 text-xs">
                              <div>
                                <p className="font-semibold text-muted-foreground">Entry Date:</p>
                                <p className="text-foreground">{new Date(originalBuyEntry.date).toLocaleDateString()}</p>
                              </div>
                              {originalBuyEntry.investmentThesis && (
                                <div>
                                  <p className="font-semibold text-muted-foreground">Your Original Thesis:</p>
                                  <p className="text-foreground italic bg-white dark:bg-slate-900 p-2 rounded">"{originalBuyEntry.investmentThesis}"</p>
                                </div>
                              )}
                              {originalBuyEntry.invalidationCondition && (
                                <div>
                                  <p className="font-semibold text-muted-foreground">Invalidation Condition:</p>
                                  <p className="text-foreground">{originalBuyEntry.invalidationCondition}</p>
                                </div>
                              )}
                              {originalBuyEntry.plannedHoldTime && (
                                <div>
                                  <p className="font-semibold text-muted-foreground">Planned Hold Time:</p>
                                  <p className="text-foreground">{originalBuyEntry.plannedHoldTime}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-300 dark:border-yellow-700">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                              ⚠️ No matching BUY entry found for {newEntry.assetName}. Make sure the asset name matches exactly.
                            </p>
                          </div>
                        );
                      })()}

                      {/* BUY Fields */}
                      {newEntry.action === 'buy' && (
                        <>
                          <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg relative border-2 border-blue-200 dark:border-blue-800">
                            <Label className="text-sm font-medium">Investment Thesis * <span className="text-muted-foreground font-normal">(Why are you buying?)</span></Label>
                            <Textarea
                              value={newEntry.investmentThesis}
                              onChange={(e) => setNewEntry({
                                ...newEntry,
                                investmentThesis: e.target.value,
                              })}
                              placeholder="Explain your reason for this investment..."
                              rows={4}
                            />
                          </div>
                          <div className="space-y-2 p-3 bg-muted/50 rounded-lg relative">
                            <Label className="text-sm font-medium">Invalidation Condition <span className="text-muted-foreground font-normal">(When would your thesis be broken?)</span></Label>
                            <Textarea
                              value={newEntry.invalidationCondition}
                              onChange={(e) => setNewEntry({
                                ...newEntry,
                                invalidationCondition: e.target.value,
                              })}
                              placeholder="e.g., If price drops below $X, if fundamentals change..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2 p-3 bg-muted/50 rounded-lg relative">
                            <Label className="text-sm font-medium">Planned Hold Time</Label>
                            <Input
                              type="text"
                              value={newEntry.plannedHoldTime}
                              onChange={(e) => setNewEntry({
                                ...newEntry,
                                plannedHoldTime: e.target.value,
                              })}
                              placeholder="e.g., 1 year, 3-5 years, Long term"
                            />
                          </div>
                        </>
                      )}

                      {/* SELL Fields */}
                      {newEntry.action === 'sell' && (
                        <>
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm font-medium mb-2">💡 Investment Outcome Review</p>
                            <p className="text-xs text-muted-foreground">Reflect on your decision AFTER the investment completes</p>
                          </div>

                          <div className="space-y-2 p-3 bg-muted/50 rounded-lg relative">
                            <Label className="text-sm font-medium">Sell Reason *</Label>
                            <Select
                              value={newEntry.sellReason || ''}
                              onValueChange={(value) => setNewEntry({
                                ...newEntry,
                                sellReason: value as any,
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select reason..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planned_exit">✅ Planned Exit — target reached</SelectItem>
                                <SelectItem value="thesis_broken">📉 Thesis Broken — fundamentals changed</SelectItem>
                                <SelectItem value="emotional_reaction">⚠️ Emotional Reaction — price action</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 p-3 bg-muted/50 rounded-lg relative">
                            <Label className="text-sm font-medium">Did you follow your plan?</Label>
                            <Select
                              value={newEntry.customFields?.['followedPlan'] || ''}
                              onValueChange={(value) => setNewEntry({
                                ...newEntry,
                                customFields: { ...newEntry.customFields, followedPlan: value },
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">✅ Yes</SelectItem>
                                <SelectItem value="no">❌ No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 p-3 bg-muted/50 rounded-lg relative">
                            <Label className="text-sm font-medium">Was the thesis still valid?</Label>
                            <Select
                              value={newEntry.customFields?.['thesisValid'] || ''}
                              onValueChange={(value) => setNewEntry({
                                ...newEntry,
                                customFields: { ...newEntry.customFields, thesisValid: value },
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">✅ Yes, thesis was still valid</SelectItem>
                                <SelectItem value="no">❌ No, thesis was broken</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg relative border-2 border-blue-200 dark:border-blue-800">
                            <Label className="text-sm font-medium">Why did you sell? *</Label>
                            <Textarea
                              value={newEntry.customFields?.['whySell'] || ''}
                              onChange={(e) => setNewEntry({
                                ...newEntry,
                                customFields: { ...newEntry.customFields, whySell: e.target.value },
                              })}
                              placeholder="Explain your reason for selling..."
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2 p-3 bg-muted/50 rounded-lg relative">
                            <Label className="text-sm font-medium">Lesson Learned</Label>
                            <Textarea
                              value={newEntry.customFields?.['lessonLearned'] || ''}
                              onChange={(e) => setNewEntry({
                                ...newEntry,
                                customFields: { ...newEntry.customFields, lessonLearned: e.target.value },
                              })}
                              placeholder="What did you learn from this investment?"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2 p-3 bg-muted/50 rounded-lg relative">
                            <Label className="text-sm font-medium">Profit/Loss Result</Label>
                            <Input
                              type="text"
                              value={newEntry.customFields?.['profitLoss'] || ''}
                              onChange={(e) => setNewEntry({
                                ...newEntry,
                                customFields: { ...newEntry.customFields, profitLoss: e.target.value },
                              })}
                              placeholder="e.g., +25%, -10%, $500 profit"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <Button onClick={handleAddEntry} className="w-full">
                    {editingEntry ? 'Update Entry' : 'Add Entry'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Trading Stats */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Trading Statistics</h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalTrades}</div>
              <div className="text-xs text-muted-foreground">{isLongTermHold ? 'Completed' : 'Total Trades'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
              <div className="text-xs text-muted-foreground">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
              <div className="text-xs text-muted-foreground">Losses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.winRate}%</div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.avgRR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {isLongTermHold ? `${stats.avgRR > 0 ? '+' : ''}${stats.avgRR}%` : stats.avgRR}
              </div>
              <div className="text-xs text-muted-foreground">{isLongTermHold ? '% Gain' : 'Avg R:R'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Live Trading and Backtesting */}
      <Tabs defaultValue="live" className="w-full" onValueChange={(value) => {
        setActiveTab(value as 'live' | 'backtesting');
        // Reset custom fields when switching tabs so user starts fresh
        setNewEntry(prev => ({ ...prev, customFields: {}, screenshots: [], description: '', riskReward: 0, pnl: undefined, isNoTradeDay: false, beResolution: undefined }));
        setHiddenFieldsForEntry([]);
        setHiddenSystemFields([]);
      }}>
        {/* Strategy Selector */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2">
            {isEditingStrategiesName ? (
              <>
                <Input
                  value={tempStrategiesName}
                  onChange={(e) => setTempStrategiesName(e.target.value)}
                  placeholder="e.g., My Playbook"
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSaveStrategiesName}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelStrategiesName}>
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Select value={selectedStrategy} onValueChange={(value) => {
                setSelectedStrategy(value);
                // Reset entry form when switching strategies
                setNewEntry(prev => ({ ...prev, customFields: {}, screenshots: [], description: '', riskReward: 0, pnl: undefined, isNoTradeDay: false, beResolution: undefined, strategyId: value === 'all' ? undefined : value }));
                setHiddenFieldsForEntry([]);
                setHiddenSystemFields([]);
              }} className="flex-1">
                  <SelectTrigger>
                    <SelectValue placeholder={customStrategiesName} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{customStrategiesName}</SelectItem>
                    {strategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: strategy.color }}
                          />
                          {strategy.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9"
                  onClick={() => setIsEditingStrategiesName(true)}
                  title="Edit section name"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          <StrategyManager 
            onStrategyCreated={(strategy) => {
              setStrategies([...strategies, strategy]);
              setSelectedStrategy(strategy.id);
              // Reset entry form so user starts fresh with new strategy
              setNewEntry(prev => ({ ...prev, customFields: {}, screenshots: [], description: '', riskReward: 0, pnl: undefined, isNoTradeDay: false, beResolution: undefined, strategyId: strategy.id }));
              setHiddenFieldsForEntry([]);
              setHiddenSystemFields([]);
            }}
          />
        </div>
        
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="live">Live Trading</TabsTrigger>
          <TabsTrigger value="backtesting" disabled={!isPremium}>
            <div className="flex items-center gap-2">
              Backtesting
              {!isPremium && <Lock className="w-3 h-3" />}
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <JournalList 
            entries={filteredEntries}
            customFields={customFields}
            onShareJournal={handleShareJournal}
            onAddEntry={handleAddEntryClick}
            onEditEntry={handleEditEntry}
            onReviewTrade={(entryId) => navigate(`/app/trade-replay/${entryId}`)}
            onCreateSellEntry={handleCreateSellEntry}
            isBacktesting={false}
            highlightDate={worstDayDate}
          />
        </TabsContent>

        <TabsContent value="backtesting">
          {!isPremium ? (
            <Card>
              <CardContent className="py-12">
                <PremiumGate 
                  isPremium={false}
                  featureName="Backtesting Journal"
                  description="Track and analyze your backtesting results separately from live trading. Upgrade to Premium to unlock this feature."
                  variant="card"
                  onUpgrade={() => setShowUpgradeModal(true)}
                />
              </CardContent>
            </Card>
          ) : (
            <JournalList 
              entries={filteredBacktestingEntries}
              customFields={customFields}
              onShareJournal={() => {}}
              onAddEntry={handleAddEntryClick}
              onEditEntry={handleEditEntry}
              onReviewTrade={(entryId) => navigate(`/app/trade-replay/${entryId}`)}
              onCreateSellEntry={handleCreateSellEntry}
              isBacktesting={true}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Revenge Trading Alert */}
      {showRevengeTradingAlert && (
        <RevengeTradingAlert
          onClose={() => setShowRevengeTradingAlert(false)}
          onGoToRevengeX={() => {
            setShowRevengeTradingAlert(false);
            navigate('/app/revengex');
          }}
        />
      )}

      {/* Pre-Trade Checklist */}
      <PreTradeChecklist
        open={showPreTradeChecklist}
        onOpenChange={setShowPreTradeChecklist}
        onComplete={handlePreTradeChecklistComplete}
        tradingStyle={user?.tradingStyle}
      />

      {/* Behavior Risk Alert */}
      <BehaviorRiskAlert
        open={showBehaviorRiskAlert}
        onOpenChange={setShowBehaviorRiskAlert}
        riskType={behaviorRiskType}
        tradingStyle={user?.tradingStyle}
      />
    </div>
  );
}
