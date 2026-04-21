import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { X, Plus, Star } from 'lucide-react';
import { storage } from '../../utils/storage';
import { Switch } from '../../components/ui/switch';

interface Rule {
  id: string;
  title: string;
  description: string;
  category: string;
  isCritical: boolean;
}

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

const INVESTOR_QUICK_ADD_TEMPLATES = [
  'Never panic sell',
  'Only invest long term',
  'Diversify positions',
  'Follow my investment thesis',
  'Ignore short term noise',
  'Only invest in companies I understand',
  'Never chase hype',
];

export function OnboardingRules() {
  const navigate = useNavigate();
  const [tradingStyle, setTradingStyle] = useState('');
  const [rules, setRules] = useState<Rule[]>([
    { id: crypto.randomUUID(), title: '', description: '', category: 'discipline', isCritical: false },
    { id: crypto.randomUUID(), title: '', description: '', category: 'discipline', isCritical: false },
    { id: crypto.randomUUID(), title: '', description: '', category: 'discipline', isCritical: false },
    { id: crypto.randomUUID(), title: '', description: '', category: 'discipline', isCritical: false },
    { id: crypto.randomUUID(), title: '', description: '', category: 'discipline', isCritical: false }
  ]);
  const [justAddedRule, setJustAddedRule] = useState(false);

  const isLongTermHold = tradingStyle === 'Long Term Hold';
  const minRulesRequired = isLongTermHold ? 3 : 5;
  const categories = isLongTermHold ? INVESTOR_CATEGORIES : RULE_CATEGORIES;

  useEffect(() => {
    const user = storage.getCurrentUser();
    console.log('🔍 OnboardingRules mounted');
    console.log('👤 Current user from localStorage:', user);
    console.log('📦 Raw localStorage currentUser:', localStorage.getItem('tradeforge_currentUser'));

    if (!user) {
      console.error('❌ No user found in localStorage!');
      alert('Error: No user logged in. Please restart onboarding.');
      navigate('/');
      return;
    }

    console.log('✅ User found, ID:', user.id);

    const profileData = sessionStorage.getItem('onboarding_profile');
    if (profileData) {
      const profile = JSON.parse(profileData);
      setTradingStyle(profile.tradingStyle);
      storage.updateCurrentUser({
        tradingStyle: profile.tradingStyle,
        instruments: profile.instruments,
      });
      console.log('✅ Applied onboarding profile data:', profile);
    }
  }, [navigate]);

  const addRule = () => {
    setRules([...rules, {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      category: 'discipline',
      isCritical: false
    }]);
    setJustAddedRule(true);
    setTimeout(() => setJustAddedRule(false), 1000);
  };

  const removeRule = (index: number) => {
    if (rules.length > 5) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const updateRule = (index: number, field: 'title' | 'description' | 'category' | 'isCritical', value: string | boolean) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const user = storage.getCurrentUser();
    if (!user) {
      console.error('❌ No user found during rule submission!');
      console.error('localStorage currentUser:', localStorage.getItem('tradeforge_currentUser'));
      alert('Error: No user logged in. Please restart onboarding.');
      return;
    }

    console.log('=== ONBOARDING RULES SUBMISSION ===');
    console.log('Current User:', user);
    console.log('User ID:', user.id);
    console.log('User Email:', user.email);

    const validRules = rules.filter(r => r.title.trim() !== '');

    if (validRules.length < minRulesRequired) {
      alert(`Please add at least ${minRulesRequired} trading rules before continuing.`);
      return;
    }

    console.log('💾 STARTING RULE SAVE PROCESS');
    console.log('👤 Current User ID:', user.id);
    console.log('📝 Valid Rules to Save:', validRules);

    const existingRules = storage.getRules().filter(r => r.userId === user.id);
    console.log('📊 Existing rules before save:', existingRules.length);

    const savedRuleIds: string[] = [];
    validRules.forEach((rule, index) => {
      try {
        const savedRule = storage.addRule({
          userId: user.id,
          title: rule.title,
          description: rule.description,
          tag: rule.category,
          isCritical: rule.isCritical
        });
        savedRuleIds.push(savedRule.id);
        console.log(`✅ [${index + 1}/${validRules.length}] Saved rule:`, savedRule);
      } catch (error) {
        console.error(`❌ Failed to save rule ${index + 1}:`, error);
      }
    });

    const verifyRules = storage.getRules();
    const myRules = verifyRules.filter(r => r.userId === user.id);

    myRules.sort((a, b) => {
      const categoryOrder = ['psychology', 'entry', 'exit', 'risk', 'discipline'];
      const aIndex = categoryOrder.indexOf(a.tag);
      const bIndex = categoryOrder.indexOf(b.tag);
      return aIndex - bIndex;
    });

    console.log('🔍 VERIFICATION - All rules in storage:', verifyRules);
    console.log('🔍 VERIFICATION - My rules in storage (sorted):', myRules);
    console.log('🔍 VERIFICATION - localStorage raw:', localStorage.getItem('tradeforge_rules'));

    const expectedTotal = existingRules.length + validRules.length;
    if (myRules.length !== expectedTotal) {
      console.error('❌ SAVE FAILED! Expected', expectedTotal, 'but found', myRules.length);
      console.error('Existing rules:', existingRules.length, '+ New rules:', validRules.length, '= Expected:', expectedTotal, ', Actual:', myRules.length);
      if (myRules.length >= validRules.length) {
        console.log('✅ At least all new rules were saved, continuing...');
      } else {
        alert('Error saving rules. Please try again or add them later in Edit Rules.');
      }
    } else {
      console.log('✅ VERIFICATION PASSED - All rules saved successfully!');
    }

    const ruleStrings = myRules.map(r => r.title);
    storage.updateCurrentUser({
      rules: ruleStrings,
    });

    console.log('✅ Updated user.rules array:', ruleStrings);
    console.log('✅ Final user object:', storage.getCurrentUser());

    sessionStorage.setItem('just_completed_onboarding', 'true');

    sessionStorage.removeItem('onboarding_user');
    sessionStorage.removeItem('onboarding_profile');

    storage.setOnboardingComplete();

    console.log('✅ ONBOARDING COMPLETE - Navigating to app...');
    navigate('/app');
  };

  const handleSkip = () => {
    sessionStorage.setItem('just_completed_onboarding', 'true');
    sessionStorage.removeItem('onboarding_user');
    sessionStorage.removeItem('onboarding_profile');
    storage.setOnboardingComplete();
    navigate('/app');
  };

  const hasValidRule = rules.some(r => r.title.trim() !== '');
  const validRulesCount = rules.filter(r => r.title.trim() !== '').length;
  const canSubmit = validRulesCount >= minRulesRequired;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {isLongTermHold ? 'Your Investing Principles' : 'Your Trading Rules'}
          </CardTitle>
          <CardDescription>
            {isLongTermHold
              ? `Add at least ${minRulesRequired} principles you follow to avoid emotional investing decisions.`
              : `Add at least ${minRulesRequired} rules. These are your commitments to disciplined trading.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick Add Templates for Long Term Hold Users */}
            {isLongTermHold && validRulesCount < minRulesRequired && (
              <div className="space-y-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Label className="text-sm font-medium">Quick Add Templates</Label>
                <p className="text-xs text-muted-foreground">Tap to add common investing principles (you can edit them after):</p>
                <div className="flex flex-wrap gap-2">
                  {INVESTOR_QUICK_ADD_TEMPLATES.map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const emptyIndex = rules.findIndex(r => r.title.trim() === '');
                        if (emptyIndex !== -1) {
                          updateRule(emptyIndex, 'title', template);
                        } else {
                          setRules([...rules, {
                            id: crypto.randomUUID(),
                            title: template,
                            description: '',
                            category: 'discipline',
                            isCritical: false
                          }]);
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-full transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {rules.map((rule, index) => (
                <div key={rule.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-medium">
                      {isLongTermHold ? 'Principle' : 'Rule'} {index + 1}
                    </Label>
                    {rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRule(index)}
                        className="p-1 hover:bg-destructive/10 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`rule-title-${rule.id}`}>
                      {isLongTermHold ? 'Principle' : 'Rule'}
                    </Label>
                    <Input
                      id={`rule-title-${rule.id}`}
                      placeholder={isLongTermHold
                        ? 'e.g., Never panic sell during market dips'
                        : 'e.g., Only take trades 9:30-11am'
                      }
                      value={rule.title}
                      onChange={(e) => updateRule(index, 'title', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`rule-description-${rule.id}`}>Description (optional)</Label>
                    <Textarea
                      id={`rule-description-${rule.id}`}
                      placeholder={isLongTermHold
                        ? 'Add more details about this principle...'
                        : 'Add more details about this rule...'
                      }
                      value={rule.description}
                      onChange={(e) => updateRule(index, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`rule-category-${rule.id}`}>Category</Label>
                    <select
                      id={`rule-category-${rule.id}`}
                      value={rule.category}
                      onChange={(e) => updateRule(index, 'category', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className={`w-4 h-4 ${rule.isCritical ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                      <div>
                        <Label htmlFor={`rule-critical-${rule.id}`} className="cursor-pointer">
                          {isLongTermHold ? 'Critical Principle' : 'Critical Rule'}
                        </Label>
                        <p className="text-xs text-muted-foreground">Prioritized in RevengeX reminders</p>
                      </div>
                    </div>
                    <Switch
                      id={`rule-critical-${rule.id}`}
                      checked={rule.isCritical}
                      onCheckedChange={(checked) => updateRule(index, 'isCritical', checked)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addRule}
              className={`w-full transition-all ${justAddedRule ? 'bg-green-500/20 border-green-500 scale-95' : ''}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isLongTermHold ? 'Add Another Principle' : 'Add Another Rule'} {justAddedRule ? '✓' : ''}
            </Button>

            {validRulesCount < minRulesRequired && (
              <div className="text-center text-sm text-muted-foreground">
                {validRulesCount} of {minRulesRequired} {isLongTermHold ? 'principles' : 'rules'} added · {minRulesRequired - validRulesCount} more needed
              </div>
            )}

            {validRulesCount >= minRulesRequired && (
              <div className="text-center text-sm text-green-600 dark:text-green-400">
                ✓ {validRulesCount} {isLongTermHold ? 'principles' : 'rules'} added · Ready to continue
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/onboarding/profile')}
                className="flex-1"
              >
                Back
              </Button>
              {/* FIX: Skip button text color changed to black (dark:text-white for dark mode) */}
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="flex-1 text-black dark:text-white"
              >
                Skip for now
              </Button>
              <Button type="submit" className="flex-1" disabled={!canSubmit}>
                Complete Setup
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
