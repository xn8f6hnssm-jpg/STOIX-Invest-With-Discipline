import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Brain, Quote, Heart, Wind, Book, Plus, Trash2, Edit2, CheckCircle2, Settings, Film, BookOpen, Swords, Lightbulb, Trophy } from 'lucide-react';
import { storage } from '../utils/storage';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { motion, AnimatePresence } from 'motion/react';
import { Checkbox } from '../components/ui/checkbox';

const TRADING_QUOTES = [
  "The market pays you to be disciplined. It charges you for being emotional.",
  "Your job is not to predict the next move. Your job is to execute your edge with consistency.",
  "Every time you break a rule, you are training yourself to break rules.",
  "Profitable trading is boring. Exciting trading is expensive.",
  "The trader who survives is not the most intelligent — it's the most disciplined.",
  "Your worst losses will never come from bad setups. They will come from good setups you managed poorly.",
  "Revenge trading is not a strategy. It is a confession that you have lost control.",
  "The market will test your discipline before it rewards your edge.",
  "A losing trade followed by a winning trade is a recovery. A losing trade followed by a larger trade is a disaster.",
  "You are not trading the market. You are trading your own psychology.",
  "Professional traders do not chase. They wait. They have done this long enough to know the difference.",
  "Every rule you set exists because a past version of you ignored it and paid the price.",
  "Risk management is not a defensive skill. It is the foundation of every profitable career.",
  "The trader who takes three clean setups beats the trader who takes ten mediocre ones every time.",
  "When you feel the urge to deviate from your plan, that is the exact moment to follow it more strictly.",
  "Patience is your real edge. Most traders lose because they cannot sit still.",
  "Two consecutive losses is not a slump. It is a signal to reduce size and review your process.",
  "Consistency is not exciting. But it compounds. And compounding is everything.",
];

const CATEGORIZED_QUOTES = {
  movies: [
    "Fear is not real. The only place that fear can exist is in our thoughts of the future. — After Earth",
    "Every passing minute is another chance to turn it all around. — Vanilla Sky",
    "It's not who I am underneath, but what I do that defines me. — Batman Begins",
    "Pain is temporary. Quitting lasts forever. — Lance Armstrong (Any Given Sunday)",
    "The strength of a wolf is the pack, and the strength of the pack is the wolf. — The Grey",
    "You either die a hero, or you live long enough to see yourself become the villain. — The Dark Knight",
  ],
  books: [
    "The most important quality for an investor is temperament, not intellect. — Warren Buffett",
    "I am not afraid of storms, for I am learning how to sail my ship. — Louisa May Alcott",
    "It is not the strongest species that survive, nor the most intelligent, but the most responsive to change. — Charles Darwin",
    "What gets measured gets managed. — Peter Drucker",
    "He who knows when he can fight and when he cannot, will be victorious. — Sun Tzu",
    "The secret of getting ahead is getting started. — Mark Twain",
  ],
  anime: [
    "If you don't like your destiny, don't accept it. Have the courage to change it the way you want it to be. — Naruto",
    "Whatever you lose, you'll find it again. But what you throw away you'll never get back. — Kenshin",
    "The moment you give up is the moment you let someone else win. — Kise Ryōta, Kuroko's Basketball",
    "A warrior does not give up what he loves. He finds the love in what he does. — Sokka, Avatar",
    "Even if I can't see the result, I'll keep moving forward. — Izuku Midoriya, My Hero Academia",
    "Don't give up. There is no such thing as an ending. Just a new beginning. — Erza Scarlet",
  ],
  philosophy: [
    "You have power over your mind, not outside events. Realize this and you will find strength. — Marcus Aurelius",
    "Waste no more time arguing what a good man should be. Be one. — Marcus Aurelius",
    "The first rule is to keep an untroubled spirit. The second is to look things in the face and know them for what they are. — Marcus Aurelius",
    "He suffers more than necessary, who suffers before it is necessary. — Seneca",
    "Luck is what happens when preparation meets opportunity. — Seneca",
    "First say to yourself what you would be; and then do what you have to do. — Epictetus",
  ],
  sports: [
    "I've missed more than 9,000 shots in my career. I've lost almost 300 games. That is why I succeed. — Michael Jordan",
    "The more difficult the victory, the greater the happiness in winning. — Pelé",
    "Champions aren't made in the gyms. Champions are made from something deep inside them. — Muhammad Ali",
    "It's not about the size of the dog in the fight. It's about the size of the fight in the dog. — Archie Griffin",
    "Gold medals aren't really made of gold. They're made of sweat, determination, and a hard-to-find alloy called guts. — Dan Gable",
    "The only way to prove that you're a good sport is to lose. — Ernie Banks",
  ],
  proverbs: [
    "Fall seven times, stand up eight. — Japanese Proverb",
    "The temptation to quit will be greatest just before you are about to succeed. — Chinese Proverb",
    "A smooth sea never made a skilled sailor. — English Proverb",
    "He who chases two rabbits catches neither. — Chinese Proverb",
    "Vision without action is a daydream. Action without vision is a nightmare. — Japanese Proverb",
    "The tiger does not proclaim his tigritude. He pounces. — African Proverb",
  ],
};

const RELIGIOUS_TEXTS = {
  Islam: [
    "Indeed, Allah is with those who are patient. — Quran 2:153",
    "Whoever fears Allah, He will make a way out for him. — Quran 65:2",
    "And whoever puts all his trust in Allah, then He will suffice him. — Quran 65:3",
    "Verily, with hardship comes ease. — Quran 94:6",
    "Do not lose hope, nor be sad. — Quran 3:139",
  ],
  Christianity: [
    "I can do all things through Christ who strengthens me. — Philippians 4:13",
    "Be strong and courageous. Do not be afraid. — Joshua 1:9",
    "For God gave us a spirit not of fear but of power. — 2 Timothy 1:7",
    "Trust in the Lord with all your heart. — Proverbs 3:5",
    "The Lord is my strength and my shield. — Psalm 28:7",
  ],
  Judaism: [
    "Be strong and of good courage. — Deuteronomy 31:6",
    "The Lord is my light and my salvation; whom shall I fear? — Psalm 27:1",
    "Cast your burden upon the Lord, and He will sustain you. — Psalm 55:22",
    "Trust in the Lord forever, for in God the Lord, we have an everlasting Rock. — Isaiah 26:4",
    "I have set the Lord always before me. — Psalm 16:8",
  ],
  Buddhism: [
    "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment. — Buddha",
    "Peace comes from within. Do not seek it without. — Buddha",
    "The mind is everything. What you think you become. — Buddha",
    "No one saves us but ourselves. No one can and no one may. — Buddha",
    "The root of suffering is attachment. — Buddha",
  ],
  Hinduism: [
    "You have the right to work, but never to the fruit of work. — Bhagavad Gita 2.47",
    "The mind acts like an enemy for those who do not control it. — Bhagavad Gita 6.6",
    "When meditation is mastered, the mind is unwavering like the flame of a lamp. — Bhagavad Gita 6.19",
    "One who has control over the mind is tranquil in heat and cold, in pleasure and pain. — Bhagavad Gita 6.7",
    "For one who has conquered the mind, the mind is the best of friends. — Bhagavad Gita 6.6",
  ],
};

interface MentalPrepSettings {
  showTradingQuote: boolean;
  showGeneralQuote: boolean;
  quoteSources: string[]; // NEW: Selected quote sources (movies, books, anime, etc.)
  showAffirmation: boolean;
  showBreathing: boolean;
  showReligious: boolean;
  selectedReligion: string;
  requireBeforeTrade: boolean;
}

interface BreathingPhase {
  phase: 'inhale' | 'hold' | 'exhale';
  duration: number;
  instruction: string;
}



const DEFAULT_AFFIRMATIONS = [
  'I trade my plan with discipline and patience.',
  'I accept small losses as the cost of doing business.',
  'I am in control of my emotions, not the market.',
  'Every disciplined trade builds my edge.',
  'I follow my rules on every single trade.',
  'I do not chase. I wait for my setup.',
  'My consistency compounds over time.',
  'I protect my capital above all else.',
];

const RELIGION_TO_BOOK: Record<string, string> = {
  Christianity: 'Bible',
  Islam: 'Quran',
  Judaism: 'Torah',
  Buddhism: 'Dhammapada',
  Hinduism: 'Bhagavad Gita',
  Sikhism: 'Guru Granth Sahib',
};

export function MentalPreparation({ onComplete, isPreTrade = false }: { onComplete?: () => void; isPreTrade?: boolean }) {
  const [settings, setSettings] = useState<MentalPrepSettings>(() => {
    const saved = storage.getMentalPrepSettings();
    const defaultSettings = {
      showTradingQuote: true,
      showGeneralQuote: true,
      quoteSources: ['movies', 'books', 'anime', 'philosophy', 'sports'],
      showAffirmation: true,
      showBreathing: true,
      showReligious: false,
      selectedReligion: 'Islam',
      requireBeforeTrade: false,
    };
    
    // Merge saved settings with defaults to ensure quoteSources exists
    if (saved) {
      return {
        ...defaultSettings,
        ...saved,
        quoteSources: saved.quoteSources || defaultSettings.quoteSources,
      };
    }
    
    return defaultSettings;
  });

  const [affirmations, setAffirmations] = useState<string[]>(() => storage.getAffirmations());
  const [newAffirmation, setNewAffirmation] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Breathing exercise state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [breathingProgress, setBreathingProgress] = useState(0);

  const breathingSequence: BreathingPhase[] = [
    { phase: 'inhale', duration: 4000, instruction: 'Breathe In' },
    { phase: 'hold', duration: 2000, instruction: 'Hold' },
    { phase: 'exhale', duration: 4000, instruction: 'Breathe Out' },
  ];

  // Random selections - compute from settings directly
  const [selectedTradingQuote] = useState(() => TRADING_QUOTES[Math.floor(Math.random() * TRADING_QUOTES.length)]);
  
  const [selectedGeneralQuote] = useState(() => {
    // Get settings directly from storage for initialization
    const saved = storage.getMentalPrepSettings();
    const quoteSources = saved?.quoteSources || ['movies', 'books', 'anime', 'philosophy', 'sports'];
    
    // Get all quotes from enabled sources
    const enabledQuotes = quoteSources.flatMap(source => CATEGORIZED_QUOTES[source as keyof typeof CATEGORIZED_QUOTES] || []);
    return enabledQuotes.length > 0 ? enabledQuotes[Math.floor(Math.random() * enabledQuotes.length)] : '';
  });

  // Show user affirmations first (newest = last added), fall back to defaults
  const [selectedAffirmation] = useState(() => {
    const userAffirms = storage.getAffirmations();
    if (userAffirms.length > 0) {
      // Show most recent user affirmation first, then random
      return userAffirms[userAffirms.length - 1];
    }
    return DEFAULT_AFFIRMATIONS[Math.floor(Math.random() * DEFAULT_AFFIRMATIONS.length)];
  });
  
  // Dynamically compute religious text based on current settings
  const selectedReligiousText = (() => {
    const texts = RELIGIOUS_TEXTS[settings.selectedReligion as keyof typeof RELIGIOUS_TEXTS] || [];
    return texts.length > 0 ? texts[Math.floor(Math.random() * texts.length)] : '';
  })();

  // Save settings
  const updateSettings = (updates: Partial<MentalPrepSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    storage.saveMentalPrepSettings(newSettings);
  };

  // Toggle quote source
  const toggleQuoteSource = (source: string) => {
    const newSources = settings.quoteSources.includes(source)
      ? settings.quoteSources.filter(s => s !== source)
      : [...settings.quoteSources, source];
    updateSettings({ quoteSources: newSources });
  };

  // Affirmation management
  const addAffirmation = () => {
    if (newAffirmation.trim()) {
      const updated = [...affirmations, newAffirmation.trim()];
      setAffirmations(updated);
      storage.saveAffirmations(updated);
      setNewAffirmation('');
    }
  };

  const deleteAffirmation = (index: number) => {
    const updated = affirmations.filter((_, i) => i !== index);
    setAffirmations(updated);
    storage.saveAffirmations(updated);
  };

  const startEditAffirmation = (index: number) => {
    setEditingIndex(index);
    setEditText(affirmations[index]);
  };

  const saveEditAffirmation = () => {
    if (editingIndex !== null && editText.trim()) {
      const updated = [...affirmations];
      updated[editingIndex] = editText.trim();
      setAffirmations(updated);
      storage.saveAffirmations(updated);
      setEditingIndex(null);
      setEditText('');
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  // Breathing exercise
  const startBreathing = () => {
    setBreathingActive(true);
    setBreathingPhase(0);
    setBreathingProgress(0);
  };

  useEffect(() => {
    if (!breathingActive) return;

    const currentPhase = breathingSequence[breathingPhase];
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / currentPhase.duration) * 100, 100);
      setBreathingProgress(progress);

      if (elapsed >= currentPhase.duration) {
        if (breathingPhase < breathingSequence.length - 1) {
          setBreathingPhase(breathingPhase + 1);
          setBreathingProgress(0);
        } else {
          setBreathingActive(false);
          setBreathingPhase(0);
          setBreathingProgress(0);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [breathingActive, breathingPhase]);

  const handleComplete = () => {
    // Track completion
    storage.trackMentalPrepCompletion(true);
    
    // Award 5 points for completing mental preparation
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      storage.updateCurrentUser({
        totalPoints: (currentUser.totalPoints || 0) + 5
      });
    }
    
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    // Track skip (no points awarded)
    storage.trackMentalPrepCompletion(false);
    
    if (onComplete) {
      onComplete();
    }
  };

  if (showSettings) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-7 h-7 text-purple-500" />
              Mental Preparation Settings
            </h1>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Back to Preparation
            </Button>
          </div>
          <p className="text-muted-foreground">
            Customize your mental preparation experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Content Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>Content Selection</CardTitle>
              <CardDescription>Choose what to include in your preparation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="trading-quote" className="flex items-center gap-2">
                  <Quote className="w-4 h-4 text-blue-500" />
                  Trading Quotes
                </Label>
                <Switch
                  id="trading-quote"
                  checked={settings.showTradingQuote}
                  onCheckedChange={(checked) => updateSettings({ showTradingQuote: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="general-quote" className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Inspirational Quotes
                </Label>
                <Switch
                  id="general-quote"
                  checked={settings.showGeneralQuote}
                  onCheckedChange={(checked) => updateSettings({ showGeneralQuote: checked })}
                />
              </div>

              {settings.showGeneralQuote && (
                <div className="ml-6 pt-2 space-y-3">
                  <p className="text-sm text-muted-foreground">Select quote sources:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="source-movies"
                        checked={settings.quoteSources.includes('movies')}
                        onCheckedChange={() => toggleQuoteSource('movies')}
                      />
                      <Label htmlFor="source-movies" className="text-sm flex items-center gap-1 cursor-pointer">
                        <Film className="w-3 h-3" /> Movies
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="source-books"
                        checked={settings.quoteSources.includes('books')}
                        onCheckedChange={() => toggleQuoteSource('books')}
                      />
                      <Label htmlFor="source-books" className="text-sm flex items-center gap-1 cursor-pointer">
                        <BookOpen className="w-3 h-3" /> Books
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="source-anime"
                        checked={settings.quoteSources.includes('anime')}
                        onCheckedChange={() => toggleQuoteSource('anime')}
                      />
                      <Label htmlFor="source-anime" className="text-sm flex items-center gap-1 cursor-pointer">
                        <Swords className="w-3 h-3" /> Anime
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="source-philosophy"
                        checked={settings.quoteSources.includes('philosophy')}
                        onCheckedChange={() => toggleQuoteSource('philosophy')}
                      />
                      <Label htmlFor="source-philosophy" className="text-sm flex items-center gap-1 cursor-pointer">
                        <Lightbulb className="w-3 h-3" /> Philosophy
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="source-sports"
                        checked={settings.quoteSources.includes('sports')}
                        onCheckedChange={() => toggleQuoteSource('sports')}
                      />
                      <Label htmlFor="source-sports" className="text-sm flex items-center gap-1 cursor-pointer">
                        <Trophy className="w-3 h-3" /> Sports
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="affirmation" className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Personal Affirmations
                </Label>
                <Switch
                  id="affirmation"
                  checked={settings.showAffirmation}
                  onCheckedChange={(checked) => updateSettings({ showAffirmation: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="breathing" className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-500" />
                  Breathing Exercise
                </Label>
                <Switch
                  id="breathing"
                  checked={settings.showBreathing}
                  onCheckedChange={(checked) => updateSettings({ showBreathing: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="religious" className="flex items-center gap-2">
                  <Book className="w-4 h-4 text-amber-500" />
                  Religious Reading
                </Label>
                <Switch
                  id="religious"
                  checked={settings.showReligious}
                  onCheckedChange={(checked) => updateSettings({ showReligious: checked })}
                />
              </div>

              {settings.showReligious && (
                <div className="ml-6 pt-2">
                  <Label htmlFor="religion-select" className="text-sm mb-2 block">Select Text</Label>
                  <Select value={settings.selectedReligion} onValueChange={(value) => updateSettings({ selectedReligion: value })}>
                    <SelectTrigger id="religion-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Christianity">Bible</SelectItem>
                      <SelectItem value="Islam">Quran</SelectItem>
                      <SelectItem value="Judaism">Torah</SelectItem>
                      <SelectItem value="Buddhism">Dhammapada (Buddhism)</SelectItem>
                      <SelectItem value="Hinduism">Bhagavad Gita (Hinduism)</SelectItem>
                      <SelectItem value="Sikhism">Guru Granth Sahib (Sikhism)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pre-Trade Requirement */}
          <Card>
            <CardHeader>
              <CardTitle>Pre-Trade Requirement</CardTitle>
              <CardDescription>Require mental preparation before logging trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="require-before-trade" className="flex-1">
                  <div className="font-medium mb-1">Require Before Trade Logging</div>
                  <div className="text-sm text-muted-foreground">
                    When enabled, mental preparation will appear before the journal entry form
                  </div>
                </Label>
                <Switch
                  id="require-before-trade"
                  checked={settings.requireBeforeTrade}
                  onCheckedChange={(checked) => updateSettings({ requireBeforeTrade: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Affirmation Management */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Affirmations</CardTitle>
              <CardDescription>Add, edit, or remove your personal affirmations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new affirmation..."
                  value={newAffirmation}
                  onChange={(e) => setNewAffirmation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addAffirmation()}
                />
                <Button onClick={addAffirmation}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {affirmations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No affirmations yet. Add your first one above.
                </p>
              ) : (
                <div className="space-y-2">
                  {affirmations.map((affirmation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted">
                      {editingIndex === index ? (
                        <>
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1"
                            autoFocus
                          />
                          <Button size="sm" onClick={saveEditAffirmation}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="flex-1 text-sm">{affirmation}</p>
                          <Button size="sm" variant="ghost" onClick={() => startEditAffirmation(index)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteAffirmation(index)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Done Button */}
          <div className="mt-6 flex justify-center">
            <Button onClick={() => setShowSettings(false)} size="lg" className="w-full max-w-md">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-500" />
            Mental Preparation
          </h1>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
        <p className="text-muted-foreground">
          {isPreTrade ? 'Take a moment to focus before trading' : 'Quick mental reset for discipline'}
        </p>
      </div>

      {isPreTrade && (
        <Alert className="mb-6 bg-purple-500/10 border-purple-500/20">
          <Brain className="h-4 w-4 text-purple-500" />
          <AlertDescription className="text-sm">
            Complete your mental preparation to continue to the journal entry (+5 points)
          </AlertDescription>
        </Alert>
      )}

      {!isPreTrade && (
        <Alert className="mb-6 bg-green-500/10 border-green-500/20">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-sm">
            Complete this preparation session to earn +5 discipline points
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Trading Quote */}
        {settings.showTradingQuote && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Quote className="w-5 h-5 text-blue-500" />
                  Trading Wisdom
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg italic leading-relaxed">"{selectedTradingQuote}"</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* General Quote */}
        {settings.showGeneralQuote && selectedGeneralQuote && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Inspiration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg italic leading-relaxed">"{selectedGeneralQuote}"</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Personal Affirmation */}
        {settings.showAffirmation && selectedAffirmation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Your Affirmation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold leading-relaxed text-green-500">{selectedAffirmation}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {settings.showAffirmation && !selectedAffirmation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Your Affirmation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No affirmations added yet. Go to settings to add your personal affirmations.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setShowSettings(true)}
                >
                  Add Affirmations
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Religious Reading */}
        {settings.showReligious && selectedReligiousText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Book className="w-5 h-5 text-amber-500" />
                  {RELIGION_TO_BOOK[settings.selectedReligion] || settings.selectedReligion} Reading
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{selectedReligiousText}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Breathing Exercise */}
        {settings.showBreathing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wind className="w-5 h-5 text-cyan-500" />
                  Breathing Exercise
                </CardTitle>
                <CardDescription>Quick emotional reset (10 seconds)</CardDescription>
              </CardHeader>
              <CardContent>
                {!breathingActive ? (
                  <Button onClick={startBreathing} className="w-full">
                    <Wind className="w-4 h-4 mr-2" />
                    Start Breathing Exercise
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center py-8">
                      <motion.div
                        className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500"
                        animate={{
                          scale: breathingSequence[breathingPhase].phase === 'inhale' ? 1.2 :
                                 breathingSequence[breathingPhase].phase === 'hold' ? 1.2 : 1,
                        }}
                        transition={{ duration: breathingSequence[breathingPhase].duration / 1000, ease: 'easeInOut' }}
                      />
                      <p className="text-2xl font-bold mt-6">
                        {breathingSequence[breathingPhase].instruction}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {isPreTrade ? (
            <>
              <Button onClick={handleComplete} size="lg" className="flex-1">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                I'm Ready To Trade
              </Button>
              <Button onClick={handleSkip} variant="outline" size="lg">
                Skip
              </Button>
            </>
          ) : (
            <Button onClick={handleComplete} size="lg" className="w-full">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Complete Preparation (+5 Points)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}