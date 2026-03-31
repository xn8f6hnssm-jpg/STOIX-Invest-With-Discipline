import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Trash2, Lightbulb, Pencil, Check, X } from 'lucide-react';
import { storage, Strategy } from '../utils/storage';

interface StrategyManagerProps {
  onStrategyCreated?: (strategy: Strategy) => void;
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function StrategyManager({ onStrategyCreated }: StrategyManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  
  const strategies = storage.getStrategies();
  const currentUser = storage.getCurrentUser();

  const handleCreate = () => {
    if (!name.trim()) {
      alert('Please enter a strategy name');
      return;
    }

    const newStrategy = storage.addStrategy({
      userId: currentUser?.id || 'guest',
      name: name.trim(),
      description: description.trim(),
      color: selectedColor,
      createdAt: Date.now(),
    });

    setName('');
    setDescription('');
    setSelectedColor(PRESET_COLORS[0]);
    
    if (onStrategyCreated) {
      onStrategyCreated(newStrategy);
    }
    
    setIsOpen(false);
  };

  const handleDelete = (strategyId: string) => {
    if (confirm('Delete this strategy? Journal entries will not be deleted.')) {
      storage.deleteStrategy(strategyId);
      // Force re-render by closing and reopening
      setIsOpen(false);
      setTimeout(() => setIsOpen(true), 0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Manage Strategies
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Strategy Manager
          </DialogTitle>
          <DialogDescription>
            Organize your journal by creating different trading strategies
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Strategy */}
          <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
            <h3 className="font-semibold text-sm">Create New Strategy</h3>
            
            <div className="space-y-2">
              <Label htmlFor="strategy-name">Strategy Name *</Label>
              <Input
                id="strategy-name"
                placeholder="e.g., Gold ORB, IFVG Scalping, London Session..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy-description">Description (Optional)</Label>
              <Input
                id="strategy-description"
                placeholder="Brief description of this strategy..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Color Tag</Label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleCreate} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Strategy
            </Button>
          </div>

          {/* Existing Strategies */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Your Strategies ({strategies.length})</h3>
            
            {strategies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No strategies yet. Create one above!
              </div>
            ) : (
              <div className="space-y-2">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: strategy.color }}
                      />
                      <div>
                        <p className="font-medium text-sm">{strategy.name}</p>
                        {strategy.description && (
                          <p className="text-xs text-muted-foreground">{strategy.description}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(strategy.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}