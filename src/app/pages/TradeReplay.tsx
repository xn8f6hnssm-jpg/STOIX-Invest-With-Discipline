import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { storage } from '../utils/storage';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { generateTradeInsights } from '../utils/clientAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Sparkles, Brain, AlertCircle } from 'lucide-react';

export function TradeReplay() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<any>(null);
  const [reflection, setReflection] = useState({
    step1: '',
    step2: '',
    step3: '',
    step4: '',
  });
  const [aiInsights, setAiInsights] = useState<string[] | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const isPremium = storage.isPremium();

  useEffect(() => {
    const entries = storage.getJournalEntries();
    const found = entries.find(e => e.id === entryId);
    if (found) {
      setEntry(found);
      // Load existing reflection if any
      if (found.reflection) {
        setReflection(found.reflection);
      }
      // Auto-load AI insights if premium AND has any data to analyze
      if (isPremium && hasAnalyzableData(found)) {
        loadAiInsights(found);
      }
    }
  }, [entryId, isPremium]);

  // Check if trade has enough data for AI analysis
  const hasAnalyzableData = (trade: any): boolean => {
    return !!(
      trade.description || 
      (trade.tags && trade.tags.length > 0) ||
      (trade.customFields && Object.keys(trade.customFields).length > 0) ||
      trade.riskReward > 0
    );
  };

  const loadAiInsights = async (tradeEntry: any) => {
    setIsLoadingInsights(true);
    setInsightsError(null);
    
    try {
      // TRY CLIENT-SIDE FIRST (always works, instant)
      console.log('💻 Generating client-side insights...');
      const insights = generateTradeInsights(tradeEntry);
      setAiInsights(insights);
      console.log('✅ Insights generated');
    } catch (err: any) {
      console.error('❌ Insights generation error:', err);
      setInsightsError(err.message || 'Failed to generate trade insights');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleSaveReflection = () => {
    if (entry) {
      // Update entry with reflection
      const entries = storage.getJournalEntries();
      const updated = entries.map(e =>
        e.id === entry.id ? { ...e, reflection } : e
      );
      localStorage.setItem('tradeforge_journal_entries', JSON.stringify(updated));
      alert('Reflection saved!');
      navigate('/app/journal');
    }
  };

  if (!entry) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Trade entry not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win':
        return <TrendingUp className="w-6 h-6 text-green-500" />;
      case 'loss':
        return <TrendingDown className="w-6 h-6 text-red-500" />;
      default:
        return <Minus className="w-6 h-6 text-yellow-500" />;
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl pb-24">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/app/journal')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Journal
      </Button>

      <h1 className="text-2xl font-bold mb-6">Trade Review & Reflection</h1>

      {/* Trade Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getResultIcon(entry.result)}
            <span>Trade Summary</span>
            <Badge className={getResultBadge(entry.result)}>
              {entry.result.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold">
                {new Date(entry.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            {entry.riskReward > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Risk:Reward</p>
                <p className="font-semibold text-blue-500">{entry.riskReward}</p>
              </div>
            )}
          </div>

          {entry.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Trade Notes</p>
              <p className="text-sm whitespace-pre-wrap">{entry.description}</p>
            </div>
          )}

          {entry.tags && entry.tags.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Chart Screenshot */}
          {entry.screenshots && entry.screenshots.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Chart Screenshot</p>
              <div className="grid grid-cols-2 gap-2">
                {entry.screenshots.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Screenshot ${i + 1}`}
                    className="w-full rounded-lg border"
                  />
                ))}
              </div>
            </div>
          )}

          {entry.customFields && Object.keys(entry.customFields).length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Custom Fields</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(entry.customFields).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground">{key}</p>
                    <p className="text-sm font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Reflection */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Reflection</CardTitle>
          <p className="text-sm text-muted-foreground">
            Answer these questions to improve your trading discipline
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Step 1: Why did you take this trade?
            </Label>
            <Textarea
              value={reflection.step1}
              onChange={(e) => setReflection({ ...reflection, step1: e.target.value })}
              placeholder="What was your analysis? What setup did you see?"
              rows={3}
            />
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Step 2: Did the setup follow your trading rules?
            </Label>
            <Textarea
              value={reflection.step2}
              onChange={(e) => setReflection({ ...reflection, step2: e.target.value })}
              placeholder="Which rules did you follow? Which did you break?"
              rows={3}
            />
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Step 3: Did you manage the trade according to your plan?
            </Label>
            <Textarea
              value={reflection.step3}
              onChange={(e) => setReflection({ ...reflection, step3: e.target.value })}
              placeholder="Did you move your stop loss? Exit too early or late?"
              rows={3}
            />
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Step 4: Did emotions affect your decisions?
            </Label>
            <Textarea
              value={reflection.step4}
              onChange={(e) => setReflection({ ...reflection, step4: e.target.value })}
              placeholder="Were you fearful, greedy, or FOMO? How did it affect the trade?"
              rows={3}
            />
          </div>

          <Button onClick={handleSaveReflection} className="w-full">
            Save Reflection
          </Button>
        </CardContent>
      </Card>

      {/* AI Coaching Insights */}
      {isPremium && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <CardTitle>AI Trading Coach</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Personalized insights based on your trade notes and reflection
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingInsights && (
              <div className="text-center py-8">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 mx-auto"></div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">Analyzing your trade...</p>
              </div>
            )}
            
            {insightsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {insightsError}
                </AlertDescription>
              </Alert>
            )}
            
            {aiInsights && aiInsights.length > 0 && (
              <div className="space-y-3">
                {aiInsights.map((insight: string, index: number) => (
                  <div 
                    key={index} 
                    className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                  >
                    <div className="flex gap-3">
                      <Brain className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm leading-relaxed">{insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!aiInsights && !isLoadingInsights && !insightsError && hasAnalyzableData(entry) && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Get AI-powered coaching insights based on your trade data
                </p>
                <Button onClick={() => loadAiInsights(entry)} variant="outline">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Insights
                </Button>
              </div>
            )}
            
            {!aiInsights && !isLoadingInsights && !insightsError && !hasAnalyzableData(entry) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Add trade notes, tags, custom fields, or risk:reward to receive AI coaching insights
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}