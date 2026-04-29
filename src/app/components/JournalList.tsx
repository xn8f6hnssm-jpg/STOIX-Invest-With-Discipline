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
      case 'win': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'loss': return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-yellow-500" />;
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
            className={`hover:shadow-md transition-shadow ${isWorstDay ? 'ring-2 ring-red-500 border-red-500 bg-red-500/5' : ''}`}
          >
            <CardContent className="pt-4 px-3 pb-3">
              {isWorstDay && (
                <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm font-semibold text-red-500 text-center">🔥 Your Worst Day - Review what went wrong</p>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    {getResultIcon(entry.result)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header row — date + badges, wraps on mobile */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <p className="font-semibold text-sm">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                    {isBacktesting && (
                      <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs">BACKTEST</Badge>
                    )}
                    {entry.isNoTradeDay ? (
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">NO TRADE DAY</Badge>
                    ) : (
                      <Badge className={`${getResultBadge(entry.result)} text-xs`}>{entry.result.toUpperCase()}</Badge>
                    )}
                    {entry.riskReward > 0 && !entry.action && (
                      <Badge variant="outline" className="text-xs">R:R {entry.riskReward}</Badge>
                    )}
                    {entry.action === 'sell' && entry.riskReward !== undefined && entry.riskReward !== 0 && (
                      <Badge variant="outline" className={`text-xs ${entry.riskReward >= 0 ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}`}>
                        {entry.riskReward > 0 ? '+' : ''}{entry.riskReward}%
                      </Badge>
                    )}
                    {entry.action && entry.assetName && (
                      <Badge className={`text-xs ${entry.action === 'buy' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                        {entry.action.toUpperCase()}: {entry.assetName}
                      </Badge>
                    )}
                  </div>

                  {/* Investment Thesis */}
                  {entry.action === 'buy' && entry.investmentThesis && (
                    <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Investment Thesis:</p>
                      <p className="text-xs text-muted-foreground italic">"{entry.investmentThesis}"</p>
                    </div>
                  )}

                  {entry.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">{entry.description}</p>
                  )}

                  {entry.screenshots && entry.screenshots.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {entry.screenshots.map((img, i) => (
                        <img key={i} src={img} alt={`Screenshot ${i + 1}`} className="w-full h-20 object-cover rounded" />
                      ))}
                    </div>
                  )}

                  {entry.customFields && Object.keys(entry.customFields).length > 0 && (
                    <div className="text-xs text-muted-foreground mb-2 space-y-1">
                      {Object.entries(entry.customFields).map(([key, value]) => {
                        const fieldDef = customFields.find(f => f.name === key);
                        if (!value || value === '') return null;
                        if (fieldDef?.type === 'image' && typeof value === 'string' && value.startsWith('data:image')) {
                          return (
                            <div key={key} className="space-y-1">
                              <span className="font-medium">{key}:</span>
                              <img src={value} alt={key} className="w-full max-w-xs h-24 object-cover rounded border" />
                            </div>
                          );
                        }
                        if (fieldDef?.type === 'image') {
                          return <div key={key}><span className="font-medium">{key}:</span> <span className="italic">(no image)</span></div>;
                        }
                        let displayValue = String(value);
                        if (fieldDef?.type === 'checkbox') displayValue = value === true || value === 'true' ? '✓' : '✗';
                        return <div key={key}><span className="font-medium">{key}:</span> {displayValue}</div>;
                      })}
                    </div>
                  )}

                  {/* Action buttons — wrap on mobile */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {isLongTermHold && entry.action === 'buy' && onCreateSellEntry && (
                      <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-8" onClick={() => onCreateSellEntry(entry)}>
                        <TrendingDown className="w-3.5 h-3.5 mr-1" /> SOLD
                      </Button>
                    )}
                    {!entry.isNoTradeDay && !entry.action && (
                      <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => onReviewTrade(entry.id)}>
                        Review Trade
                      </Button>
                    )}
                    {!isBacktesting && (
                      <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => onShareJournal(entry)}>
                        <Share2 className="w-3.5 h-3.5 mr-1" /> Share
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => onEditEntry(entry)}>
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
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
