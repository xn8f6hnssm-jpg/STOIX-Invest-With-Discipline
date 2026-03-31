import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Zap, Star, RefreshCw, AlertCircle, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { storage } from '../utils/storage';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { syncRulesForCurrentUser, forceReloadRules, diagnoseRulesIssue, recoverOrphanedRules } from '../utils/rulesSync';
import { toast } from 'sonner';

const RULE_CATEGORIES = [
  { value: 'psychology', label: 'Psychology' },
  { value: 'entry', label: 'Entry' },
  { value: 'exit', label: 'Exit' },
  { value: 'risk', label: 'Risk Management' },
  { value: 'discipline', label: 'General' },
];

const INVESTOR_CATEGORIES = [
  { value: 'psychology', label: 'Psychology' },
  { value: 'entry', label: 'Buying Criteria' },
  { value: 'exit', label: 'Selling Criteria' },
  { value: 'risk', label: 'Risk Management' },
  { value: 'discipline', label: 'Discipline' },
];

const COMMON_RULES = [
  { title: 'No revenge trading', description: 'Wait at least 15 minutes after a loss before taking another trade', tag: 'psychology' },
  { title: 'Risk max 1% per trade', description: 'Never risk more than 1% of total account on a single trade', tag: 'risk' },
  { title: 'Follow my trading plan', description: 'Only take setups that match my predefined criteria', tag: 'discipline' },
  { title: 'Wait for confirmation', description: 'Don\'t enter until all entry criteria are met', tag: 'entry' },
  { title: 'Set stop loss before entry', description: 'Always know my exit point before entering a trade', tag: 'risk' },
  { title: 'Take profit at target', description: 'Don\'t get greedy - stick to my profit targets', tag: 'exit' },
  { title: 'Max 3 trades per day', description: 'Limit daily trades to avoid overtrading', tag: 'discipline' },
  { title: 'Journal every trade', description: 'Document all trades immediately after closing', tag: 'discipline' },
];

const COMMON_INVESTOR_PRINCIPLES = [
  { title: 'Never panic sell', description: 'Stay calm during market volatility and trust my thesis', tag: 'psychology' },
  { title: 'Only invest long term', description: 'Focus on 3-5 year time horizons, not short term gains', tag: 'discipline' },
  { title: 'Diversify positions', description: 'Don\'t put all capital into a single investment', tag: 'risk' },
  { title: 'Follow my investment thesis', description: 'Only buy assets that match my investment criteria', tag: 'entry' },
  { title: 'Ignore short term noise', description: 'Don\'t react to daily price movements', tag: 'psychology' },
  { title: 'Only invest in companies I understand', description: 'Never buy something I can\'t explain', tag: 'entry' },
  { title: 'Review thesis quarterly', description: 'Check if my original investment thesis still holds', tag: 'discipline' },
  { title: 'Never chase hype', description: 'Avoid FOMO - stick to my investment strategy', tag: 'psychology' },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'psychology':
      return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
    case 'entry':
      return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20';
    case 'exit':
      return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20';
    case 'risk':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
    case 'discipline':
      return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
    default:
      return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
  }
};

export function EditRules() {
  const currentUser = storage.getCurrentUser();
  const [rules, setRules] = useState(storage.getRules().filter(r => r.userId === currentUser?.id));
  const [newRule, setNewRule] = useState({ title: '', description: '', tag: 'discipline', isCritical: false });
  const [editingRule, setEditingRule] = useState<{ id: string; title: string; description: string; tag: string; isCritical: boolean } | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(() => {
    const saved = localStorage.getItem('editRules_templatesExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const isLongTermHold = currentUser?.tradingStyle === 'Long Term Hold';
  const categories = isLongTermHold ? INVESTOR_CATEGORIES : RULE_CATEGORIES;
  const commonTemplates = isLongTermHold ? COMMON_INVESTOR_PRINCIPLES : COMMON_RULES;

  // Reload rules when component mounts to ensure we have the latest data
  useEffect(() => {
    console.log('🔍 EditRules - Component mounted');
    console.log('🔍 EditRules - Current user:', currentUser);
    console.log('🔍 EditRules - Current user ID:', currentUser?.id);
    
    const allStorageRules = storage.getRules();
    console.log('🔍 EditRules - ALL rules in storage:', allStorageRules);
    console.log('🔍 EditRules - Number of rules in storage:', allStorageRules.length);
    
    // DEBUG: Log the raw localStorage data
    const rawRulesData = localStorage.getItem('tradeforge_rules');
    console.log('🔍 EditRules - RAW localStorage data:', rawRulesData);
    
    let loadedRules = allStorageRules.filter(r => r.userId === currentUser?.id);
    console.log('🔍 EditRules - Rules for current user:', loadedRules);
    console.log('🔍 EditRules - Number of user rules:', loadedRules.length);
    
    // If no rules found, attempt automatic recovery
    if (loadedRules.length === 0) {
      console.log('ℹ️ EditRules - No rules found yet. Checking for recovery options...');
      
      if (allStorageRules.length > 0) {
        // Check for orphaned rules
        const allUsers = storage.getAllUsers();
        console.log('🔍 All users in system:', allUsers);
        const validUserIds = allUsers.map(u => u.id);
        console.log('🔍 Valid user IDs:', validUserIds);
        const orphanedRules = allStorageRules.filter(r => !validUserIds.includes(r.userId));
        console.log('🔍 Orphaned rules:', orphanedRules);
        
        if (orphanedRules.length > 0 && currentUser) {
          console.log(`🔧 Found ${orphanedRules.length} orphaned rules. Migrating to current user...`);
          
          // Migrate orphaned rules to current user
          const updatedRules = allStorageRules.map(rule => {
            if (!validUserIds.includes(rule.userId)) {
              console.log(`🔧 Migrating rule "${rule.title}" from userId ${rule.userId} to ${currentUser.id}`);
              return { ...rule, userId: currentUser.id };
            }
            return rule;
          });
          
          localStorage.setItem('tradeforge_rules', JSON.stringify(updatedRules));
          loadedRules = updatedRules.filter(r => r.userId === currentUser.id);
          
          console.log(`✅ Migrated ${orphanedRules.length} rules to user ${currentUser.id}`);
          toast.success(`Recovered ${orphanedRules.length} rules!`);
        } else {
          // Check if any rules exist with slightly different userId format
          console.log('🔍 Checking for userId mismatches...');
          allStorageRules.forEach(rule => {
            console.log(`Rule: "${rule.title}" - userId: "${rule.userId}" - Match: ${rule.userId === currentUser?.id}`);
          });
        }
      } else {
        console.log('⚠️ No rules found in storage at all. Check if onboarding saved them correctly.');
      }
    }
    
    setRules(loadedRules);
    
    if (loadedRules.length === 0) {
      console.log('ℹ️ EditRules - No rules found for user:', currentUser?.id, '(this is normal for new users)');
      console.log('🔍 EditRules - All unique user IDs in rules:', [...new Set(allStorageRules.map(r => r.userId))]);
    } else {
      console.log('✅ EditRules - Successfully loaded', loadedRules.length, 'rules');
    }
  }, [currentUser?.id]);

  const handleAddRule = () => {
    if (!currentUser || !newRule.title) return;

    const rule = storage.addRule({
      userId: currentUser.id,
      title: newRule.title,
      description: newRule.description,
      tag: newRule.tag,
      isCritical: newRule.isCritical,
    });

    const updatedRules = [...rules, rule];
    // Sort by category
    updatedRules.sort((a, b) => {
      const categoryOrder = ['psychology', 'entry', 'exit', 'risk', 'discipline'];
      const aIndex = categoryOrder.indexOf(a.tag);
      const bIndex = categoryOrder.indexOf(b.tag);
      return aIndex - bIndex;
    });
    setRules(updatedRules);
    
    // Sync User.rules array
    storage.updateCurrentUser({
      rules: updatedRules.map(r => r.title),
    });
    
    setNewRule({ title: '', description: '', tag: 'discipline', isCritical: false });
    toast.success('Rule added!');
  };

  const handleEditRule = (rule: typeof rules[0]) => {
    setEditingRule({
      id: rule.id,
      title: rule.title,
      description: rule.description || '',
      tag: rule.tag,
      isCritical: rule.isCritical || false
    });
    
    // Scroll to top to show edit form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };
  
  // Scroll to edit form when editingRule changes
  useEffect(() => {
    if (editingRule && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingRule]);

  const handleUpdateRule = () => {
    if (!currentUser || !editingRule || !editingRule.title) return;

    const allRules = storage.getRules();
    const updatedAllRules = allRules.map(r => 
      r.id === editingRule.id 
        ? { ...r, title: editingRule.title, description: editingRule.description, tag: editingRule.tag, isCritical: editingRule.isCritical }
        : r
    );
    localStorage.setItem('tradeforge_rules', JSON.stringify(updatedAllRules));

    const updatedRules = updatedAllRules.filter(r => r.userId === currentUser.id);
    // Sort by category
    updatedRules.sort((a, b) => {
      const categoryOrder = ['psychology', 'entry', 'exit', 'risk', 'discipline'];
      const aIndex = categoryOrder.indexOf(a.tag);
      const bIndex = categoryOrder.indexOf(b.tag);
      return aIndex - bIndex;
    });
    setRules(updatedRules);
    
    // Sync User.rules array
    storage.updateCurrentUser({
      rules: updatedRules.map(r => r.title),
    });
    
    setEditingRule(null);
    toast.success('Rule updated!');
  };

  const handleCancelEdit = () => {
    setEditingRule(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    storage.deleteRule(ruleId);
    const updatedRules = rules.filter(r => r.id !== ruleId);
    setRules(updatedRules);
    
    // Sync User.rules array
    storage.updateCurrentUser({
      rules: updatedRules.map(r => r.title),
    });
    toast.success('Rule deleted!');
  };

  const handleAddCommonRule = (commonRule: { title: string, description: string, tag: string }) => {
    if (!currentUser) return;

    const rule = storage.addRule({
      userId: currentUser.id,
      title: commonRule.title,
      description: commonRule.description,
      tag: commonRule.tag,
    });

    const updatedRules = [...rules, rule];
    // Sort by category
    updatedRules.sort((a, b) => {
      const categoryOrder = ['psychology', 'entry', 'exit', 'risk', 'discipline'];
      const aIndex = categoryOrder.indexOf(a.tag);
      const bIndex = categoryOrder.indexOf(b.tag);
      return aIndex - bIndex;
    });
    setRules(updatedRules);
    
    // Sync User.rules array
    storage.updateCurrentUser({
      rules: updatedRules.map(r => r.title),
    });
    toast.success('Rule added from templates!');
  };

  const handleSyncRules = () => {
    syncRulesForCurrentUser();
    toast.success('Rules synced successfully!');
  };

  const handleForceReloadRules = () => {
    const result = forceReloadRules();
    if (result.success) {
      // Reload the rules display
      const allRules = storage.getRules();
      const myRules = allRules.filter(r => r.userId === currentUser?.id);
      setRules(myRules);
      toast.success(`Reloaded ${result.rulesCount} rules!`);
    } else {
      toast.error('Failed to reload rules');
    }
  };

  const handleDiagnoseRulesIssue = () => {
    const diagnosis = diagnoseRulesIssue();
    console.log('🔍 Diagnosis:', diagnosis);
    toast.info(diagnosis.diagnosis, { duration: 5000 });
  };

  const handleRecoverOrphanedRules = () => {
    const result = recoverOrphanedRules();
    if (result.success && result.migratedCount > 0) {
      // Reload the rules display
      const allRules = storage.getRules();
      const myRules = allRules.filter(r => r.userId === currentUser?.id);
      setRules(myRules);
      toast.success(`Recovered ${result.migratedCount} orphaned rules!`);
    } else if (result.success && result.migratedCount === 0) {
      toast.info('No orphaned rules found.');
    } else {
      toast.error('Failed to recover rules');
    }
  };

  const handleToggleStar = (ruleId: string) => {
    if (!currentUser) return;

    const allRules = storage.getRules();
    const ruleToUpdate = allRules.find(r => r.id === ruleId);
    if (!ruleToUpdate) return;

    const updatedAllRules = allRules.map(r => 
      r.id === ruleId 
        ? { ...r, isCritical: !r.isCritical }
        : r
    );
    localStorage.setItem('tradeforge_rules', JSON.stringify(updatedAllRules));

    const updatedRules = updatedAllRules.filter(r => r.userId === currentUser.id);
    setRules(updatedRules);
    
    // Sync User.rules array
    storage.updateCurrentUser({
      rules: updatedRules.map(r => r.title),
    });
    
    toast.success(ruleToUpdate.isCritical ? 'Rule unstarred' : 'Rule starred!');
  };
  
  const toggleTemplates = () => {
    const newState = !isTemplatesExpanded;
    setIsTemplatesExpanded(newState);
    localStorage.setItem('editRules_templatesExpanded', JSON.stringify(newState));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Rules</h1>
        <p className="text-muted-foreground">Manage your trading rules and discipline system</p>
      </div>

      {editingRule ? (
        <Card ref={editFormRef} className="mb-8 border-2 border-primary/20 animate-in fade-in-50 slide-in-from-top-5 duration-300">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Rule</h2>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>Rule Title</Label>
              <Input
                placeholder="e.g., No revenge trading"
                value={editingRule.title}
                onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Why is this rule important?"
                value={editingRule.description}
                onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={editingRule.tag}
                onValueChange={(value) => setEditingRule({ ...editingRule, tag: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className={`w-5 h-5 ${editingRule.isCritical ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                <div>
                  <Label className="cursor-pointer">Critical Rule</Label>
                  <p className="text-xs text-muted-foreground">Prioritized in RevengeX reminders</p>
                </div>
              </div>
              <Switch
                checked={editingRule.isCritical}
                onCheckedChange={(checked) => setEditingRule({ ...editingRule, isCritical: checked })}
              />
            </div>

            <Button onClick={handleUpdateRule} disabled={!editingRule.title} className="w-full">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Add New Rule</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Title</Label>
                <Input
                  placeholder="e.g., No revenge trading"
                  value={newRule.title}
                  onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newRule.tag}
                  onValueChange={(value) => setNewRule({ ...newRule, tag: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Why is this rule important?"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className={`w-5 h-5 ${newRule.isCritical ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                <div>
                  <Label className="cursor-pointer">Critical Rule</Label>
                  <p className="text-xs text-muted-foreground">Prioritized in RevengeX reminders</p>
                </div>
              </div>
              <Switch
                checked={newRule.isCritical}
                onCheckedChange={(checked) => setNewRule({ ...newRule, isCritical: checked })}
              />
            </div>

            <Button onClick={handleAddRule} disabled={!newRule.title} className="w-full" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Your Rules</h2>
            <p className="text-sm text-muted-foreground mt-1">{rules.length} total rules across all categories</p>
          </div>
        </div>

        {rules.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-lg mb-2">No rules yet</p>
              <p className="text-sm text-muted-foreground">Add your first trading rule above to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {categories.map(category => {
              const categoryRules = rules.filter(r => r.tag === category.value);
              if (categoryRules.length === 0) return null;
              
              return (
                <div key={category.value} className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b-2" style={{
                    borderColor: category.value === 'psychology' ? 'rgb(168 85 247 / 0.3)' :
                                 category.value === 'entry' ? 'rgb(34 197 94 / 0.3)' :
                                 category.value === 'exit' ? 'rgb(239 68 68 / 0.3)' :
                                 category.value === 'risk' ? 'rgb(245 158 11 / 0.3)' :
                                 'rgb(100 116 139 / 0.3)'
                  }}>
                    <Badge
                      variant="secondary"
                      className={`text-sm px-3 py-1 ${getCategoryColor(category.value)}`}
                    >
                      {category.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {categoryRules.length} {categoryRules.length === 1 ? 'rule' : 'rules'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryRules.map((rule) => (
                      <Card key={rule.id} className="group hover:shadow-md transition-all duration-200 hover:border-primary/30">
                        <CardContent className="pt-5 pb-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {rule.isCritical && (
                                    <Star className="w-4 h-4 fill-amber-500 text-amber-500 flex-shrink-0" />
                                  )}
                                  <h3 className="font-semibold text-base leading-tight">{rule.title}</h3>
                                </div>
                                {rule.description && (
                                  <p className="text-sm text-muted-foreground leading-relaxed">{rule.description}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStar(rule.id);
                                }}
                                title={rule.isCritical ? "Unstar rule" : "Star as critical rule"}
                              >
                                <Star className={`w-4 h-4 ${rule.isCritical ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                              </Button>
                            </div>
                            
                            <div className="flex gap-2 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                                onClick={() => handleEditRule(rule)}
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 text-destructive hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => handleDeleteRule(rule.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <button 
          onClick={toggleTemplates}
          className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Rule Templates</h2>
            <Badge variant="secondary" className="text-xs">
              {commonTemplates.length} templates
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Quick add common {isLongTermHold ? 'investment principles' : 'trading rules'}</p>
            {isTemplatesExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>
        
        {isTemplatesExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in-50 slide-in-from-top-3 duration-300">
            {commonTemplates.map((commonRule) => (
              <Card key={commonRule.title} className="group hover:shadow-md transition-all duration-200 hover:border-primary/20">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{commonRule.title}</h3>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getCategoryColor(commonRule.tag)}`}
                        >
                          {commonRule.tag}
                        </Badge>
                      </div>
                      {commonRule.description && (
                        <p className="text-sm text-muted-foreground">{commonRule.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAddCommonRule(commonRule)}
                      className="text-primary hover:text-primary hover:bg-primary/10 flex-shrink-0"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t">
        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Advanced Tools</h3>
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            </div>
          </summary>
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncRules}
              className="text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Rules
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceReloadRules}
              className="text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Force Reload
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiagnoseRulesIssue}
              className="text-blue-600 hover:text-blue-700"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Diagnose
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecoverOrphanedRules}
              className="text-blue-600 hover:text-blue-700"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Recover
            </Button>
          </div>
        </details>
      </div>
    </div>
  );
}