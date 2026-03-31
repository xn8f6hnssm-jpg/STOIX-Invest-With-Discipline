import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Minus, Share2, Plus, Edit } from 'lucide-react';
import type { JournalEntry, JournalFieldDefinition } from '../utils/storage';
import { storage } from '../utils/storage';

interface JournalListProps {
  entries: JournalEntry[];
  customFields: JournalFieldDefinition[];
  onShareJournal: (entry: JournalEntry) => void;
  onAddEntry: () => void;
  onReviewTrade: (entryId: string) => void;
  onEditEntry: (entry: JournalEntry) => void;
  onCreateSellEntry?: (buyEntry: JournalEntry) => void;
  isBacktesting?: boolean;
  highlightDate?: string | null;
}

export function JournalList({ entries, customFields, onShareJournal, onAddEntry, onReviewTrade, onEditEntry, onCreateSellEntry, isBacktesting = false, highlightDate }: JournalListProps) {
  const user = storage.getCurrentUser();
  const isLongTermHold = user?.tradingStyle === 'Long Term Hold';
  
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

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            {isBacktesting ? 'No backtesting entries yet' : 'No journal entries yet'}
          </p>
          <Button onClick={onAddEntry}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Entry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isWorstDay = highlightDate && entry.date === highlightDate;
        return (
          <Card 
            key={entry.id} 
            data-date={entry.date}
            className={`hover:shadow-md transition-shadow ${
              isWorstDay ? 'ring-2 ring-red-500 border-red-500 bg-red-500/5' : ''
            }`}
          >
            <CardContent className="pt-4">
              {isWorstDay && (
                <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm font-semibold text-red-500 text-center">
                    🔥 Your Worst Day - Review what went wrong
                  </p>
                </div>
              )}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {getResultIcon(entry.result)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold text-sm">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  {isBacktesting && (
                    <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                      BACKTEST
                    </Badge>
                  )}
                  {entry.isNoTradeDay ? (
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      NO TRADE DAY
                    </Badge>
                  ) : (
                    <Badge className={getResultBadge(entry.result)}>
                      {entry.result.toUpperCase()}
                    </Badge>
                  )}
                  {entry.riskReward > 0 && !entry.action && (
                    <Badge variant="outline" className="text-xs">
                      R:R {entry.riskReward}
                    </Badge>
                  )}
                  {/* Show % Gain for Long Term Hold SELL entries */}
                  {entry.action === 'sell' && entry.riskReward !== undefined && entry.riskReward !== 0 && (
                    <Badge variant="outline" className={`text-xs ${entry.riskReward >= 0 ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}`}>
                      {entry.riskReward > 0 ? '+' : ''}{entry.riskReward}%
                    </Badge>
                  )}
                  {/* Show action and asset name for Long Term Hold */}
                  {entry.action && entry.assetName && (
                    <Badge className={entry.action === 'buy' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}>
                      {entry.action.toUpperCase()}: {entry.assetName}
                    </Badge>
                  )}
                </div>

                {/* Show Investment Thesis for BUY entries */}
                {entry.action === 'buy' && entry.investmentThesis && (
                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Investment Thesis:</p>
                    <p className="text-xs text-muted-foreground italic">"{entry.investmentThesis}"</p>
                  </div>
                )}
                
                {entry.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                    {entry.description}
                  </p>
                )}

                {entry.screenshots && entry.screenshots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {entry.screenshots.map((img, i) => (
                      <img key={i} src={img} alt={`Screenshot ${i + 1}`} className="w-full h-20 object-cover rounded" />
                    ))}
                  </div>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {entry.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {entry.customFields && Object.keys(entry.customFields).length > 0 && (
                  <div className="text-xs text-muted-foreground mb-2 space-y-2">
                    {Object.entries(entry.customFields).map(([key, value]) => {
                      // Get field definition to check type
                      const fieldDef = customFields.find(f => f.name === key);
                      
                      // Skip empty values
                      if (!value || value === '') return null;
                      
                      // Debug logging
                      if (fieldDef?.type === 'image') {
                        console.log(`Image field "${key}":`, {
                          hasValue: !!value,
                          valueType: typeof value,
                          valueLength: typeof value === 'string' ? value.length : 0,
                          isBase64: typeof value === 'string' && value.startsWith('data:image'),
                          preview: typeof value === 'string' ? value.substring(0, 50) : value
                        });
                      }
                      
                      // Handle image fields separately
                      if (fieldDef?.type === 'image' && typeof value === 'string' && value.startsWith('data:image')) {
                        return (
                          <div key={key} className="space-y-1">
                            <span className="font-medium">{key}:</span>
                            <img 
                              src={value} 
                              alt={key} 
                              className="w-full max-w-xs h-24 object-cover rounded border" 
                            />
                          </div>
                        );
                      }
                      
                      // Show placeholder if image field exists but no image
                      if (fieldDef?.type === 'image') {
                        return (
                          <div key={key} className="space-y-1">
                            <span className="font-medium">{key}:</span>
                            <div className="text-xs text-muted-foreground italic">
                              (Image removed to save storage space)
                            </div>
                          </div>
                        );
                      }
                      
                      let displayValue = String(value);
                      
                      // Format checkbox values with ✓ or ✗
                      if (fieldDef?.type === 'checkbox') {
                        displayValue = value === true || value === 'true' ? '✓' : '✗';
                      }
                      // Format time values
                      else if (fieldDef?.type === 'time' && value) {
                        // Time value is stored as "HH:MM" format from time input
                        // Just display it directly without converting to Date
                        displayValue = String(value);
                      }
                      
                      return (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {displayValue}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  {/* SOLD button - Only for Long Term Hold users with BUY entries */}
                  {isLongTermHold && entry.action === 'buy' && onCreateSellEntry && (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => onCreateSellEntry(entry)}
                    >
                      <TrendingDown className="w-4 h-4 mr-2" />
                      SOLD
                    </Button>
                  )}

                  {!entry.isNoTradeDay && !entry.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReviewTrade(entry.id)}
                    >
                      Review Trade
                    </Button>
                  )}

                  {!isBacktesting && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onShareJournal(entry)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share to Feed
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditEntry(entry)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Entry
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}