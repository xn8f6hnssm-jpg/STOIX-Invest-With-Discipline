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
  "The market pays you to be disciplined. It charges you for being emotional. Every single day you step into the market, your psychology is tested before your strategy is. The traders who last are not the smartest — they are the most consistent.",
  "Your job is not to predict the next move. Your job is to execute your edge with consistency, manage your risk without emotion, and let probability do the rest over hundreds of trades.",
  "Every time you break a rule, you are not just losing money — you are training yourself to break rules. The habit of discipline is built one trade at a time, and so is the habit of impulsiveness.",
  "Profitable trading is boring. Exciting trading is expensive. The best traders describe their sessions as quiet, methodical, and uneventful. If your trading feels like a casino, something is wrong.",
  "The trader who survives is not the most intelligent. It is the most disciplined. Intelligence tells you what to do. Discipline makes you actually do it — and more importantly, it stops you when you shouldn't.",
  "Your worst losses will never come from bad setups. They will come from good setups you managed poorly — from moving stops, from holding too long, from turning a winner into a loser out of greed.",
  "Revenge trading is not a strategy. It is a confession that you have lost control of your emotions and are now making decisions from a place of frustration rather than logic. Step away.",
  "The market will test your discipline before it rewards your edge. It will give you losing streaks that make you doubt everything. Those who stay the course and trust their process are the ones who get paid.",
  "A losing trade followed by a winning trade is a recovery. A losing trade followed by a larger trade is a disaster. Know the difference between adjusting and doubling down on emotion.",
  "You are not trading the market. You are trading your own psychology. The charts are just a mirror showing you how well you can manage fear, greed, patience, and execution under pressure.",
  "Professional traders do not chase. They wait. They have logged enough hours to know that the next setup will come, and that forcing a trade out of boredom or FOMO always costs more than it earns.",
  "Every rule you set exists because a past version of you ignored it and paid the price. When you feel the urge to bend that rule, remember exactly how it felt when you learned it the hard way.",
  "Risk management is not a defensive skill. It is the foundation of every profitable trading career. You cannot stay in the game long enough to win if you do not protect your capital first.",
  "The trader who takes three clean setups beats the trader who takes ten mediocre ones every single time. Quality over quantity is not a cliché in trading — it is the difference between surviving and thriving.",
  "When you feel the urge to deviate from your plan, that is the exact moment to follow it most strictly. The urge to deviate is your emotions taking over. Your plan was written by your rational mind — trust it.",
  "Patience is your real edge. Most traders lose not because their strategy is bad, but because they cannot sit still long enough to let it work. Waiting is a skill. Train it like any other.",
  "Two consecutive losses is not a slump. It is a signal to reduce your size and review your process. Two losses in a row happen to every trader. How you respond to them defines your long-term results.",
  "Consistency is not exciting. But it compounds. And compounding is everything in trading. Small, repeatable gains executed with discipline over time will outperform any hot streak built on luck.",
];

const CATEGORIZED_QUOTES = {
  movies: [
    "Fear is not real. The only place that fear can exist is in our thoughts of the future. It is a product of our imagination, causing us to fear things that do not at present and may not ever exist. Do not misunderstand me — danger is very real. But fear is a choice. — After Earth",
    "Every passing minute is another chance to turn it all around. No matter how deep the hole, no matter how far off track you have gone, the next moment is always a new opportunity to make a better decision. — Vanilla Sky",
    "It's not who I am underneath, but what I do that defines me. Your character is not built in the moments of comfort and ease. It is revealed — and built — in the moments when everything is on the line and you choose discipline anyway. — Batman Begins",
    "Pain is temporary. Quitting lasts forever. You will forget the discomfort of staying disciplined. You will never forget the regret of giving up on your potential. — Lance Armstrong (Any Given Sunday)",
    "The strength of a wolf is the pack, and the strength of the pack is the wolf. In trading, your system is only as strong as the discipline you bring to it. And your discipline is only as strong as the environment and habits you build around it. — The Grey",
    "You either die a hero, or you live long enough to see yourself become the villain. In trading, you either protect your rules absolutely, or you slowly compromise them until you no longer recognize the trader you have become. — The Dark Knight",
  ],
  books: [
    "The most important quality for an investor is temperament, not intellect. You need a temperament that neither derives great pleasure from being with the crowd nor against it — a temperament that allows you to be patient, rational, and immune to the noise. — Warren Buffett",
    "I am not afraid of storms, for I am learning how to sail my ship. The market will always create storms. Volatility, uncertainty, losing streaks — these are not the enemy. Your inability to navigate them calmly is. Learn to sail, not to fear the weather. — Louisa May Alcott",
    "It is not the strongest species that survive, nor the most intelligent, but the most responsive to change. The trader who adapts — who reviews, adjusts, and evolves without abandoning their core discipline — is the one who endures every market condition. — Charles Darwin",
    "What gets measured gets managed. Track your entries. Track your exits. Track your emotions at the time of each trade. The data you collect about your own behavior is more valuable than any indicator on any chart. — Peter Drucker",
    "He who knows when he can fight and when he cannot will be victorious. The disciplined trader does not trade every day. They wait for the conditions that match their edge, and they sit on their hands when those conditions are absent. — Sun Tzu",
    "The secret of getting ahead is getting started. Then the secret of continuing is building habits so automatic that the discipline required to execute them shrinks to almost nothing. Start. Build the system. Let the system carry you. — Mark Twain",
  ],
  anime: [
    "If you don't like your destiny, don't accept it. Have the courage to change it the way you want it to be. The path you were handed is not the path you are required to walk. Every decision today is a vote for the trader you are becoming. — Naruto",
    "Whatever you lose, you'll find it again. But what you throw away you'll never get back. You can rebuild from a losing trade. You can rebuild from a drawdown. What you cannot rebuild easily is the discipline you abandoned when you broke your rules for the third time. — Kenshin",
    "The moment you give up is the moment you let someone else win. In trading, giving up looks like closing the platform. But it also looks like giving up on your rules mid-session because following them felt hard. Don't quit on yourself in either form. — Kise Ryōta, Kuroko's Basketball",
    "A warrior does not give up what he loves. He finds the love in what he does. Learn to love the process of disciplined trading — the preparation, the waiting, the execution, the review. Fall in love with the craft, not just the profits. — Sokka, Avatar",
    "Even if I can't see the result, I'll keep moving forward. You will go through periods where the results are invisible. The edge is working, but the sample size is too small to see it. Keep executing. Keep moving. The compound effect is silent until it is not. — Izuku Midoriya, My Hero Academia",
    "Don't give up. There is no such thing as an ending. Just a new beginning. Every losing trade closes. Every bad week ends. Every drawdown bottoms out. What follows is always a new beginning — if you are still there to receive it. — Erza Scarlet",
  ],
  philosophy: [
    "You have power over your mind, not outside events. Realize this and you will find strength. The price will do what the price will do. News will surprise you. Spreads will widen at the worst moment. The only thing you truly control is how you respond to all of it. — Marcus Aurelius",
    "Waste no more time arguing what a good trader should be. Be one. Stop debating the perfect system, the perfect risk percentage, the perfect entry. Execute your plan with discipline today. That action, repeated, is what makes a good trader. — Marcus Aurelius (adapted)",
    "The first rule is to keep an untroubled spirit. The second is to look things in the face and know them for what they are. See your losses clearly, not as disasters but as data. See your wins clearly, not as genius but as execution. An untroubled mind processes both accurately. — Marcus Aurelius",
    "He suffers more than necessary, who suffers before it is necessary. Stop catastrophizing about trades that have not gone wrong yet. Most of the suffering traders experience exists entirely in anticipation, not in reality. Manage the present. Trust your stops. — Seneca",
    "Luck is what happens when preparation meets opportunity. The prepared trader has a written plan, a defined edge, and a process for execution. When the market offers their setup, they take it without hesitation. That is not luck. That is the result of everything that came before. — Seneca",
    "First say to yourself what you would be; and then do what you have to do. Decide clearly what kind of trader you are committed to becoming. Then let every action — every trade taken, every rule followed, every loss accepted calmly — be an expression of that decision. — Epictetus",
  ],
  sports: [
    "I've missed more than 9,000 shots in my career. I've lost almost 300 games. Twenty-six times I've been trusted to take the game-winning shot and missed. I've failed over and over and over again in my life. And that is why I succeed. Failure is not the opposite of success. It is the path to it. — Michael Jordan",
    "The more difficult the victory, the greater the happiness in winning. Any trader can make money in a perfect market with a perfect setup. The discipline to execute cleanly when conditions are difficult, when you are tired, when you are in a drawdown — that is what creates lasting excellence. — Pelé",
    "Champions aren't made in the gyms. Champions are made from something they have deep inside them — a desire, a dream, a vision. They have last-minute stamina, they have to be a little faster, they have to have the skill and the will. But the will must be stronger than the skill. — Muhammad Ali",
    "It's not about the size of the dog in the fight. It's about the size of the fight in the dog. Your account size does not determine your success. Your psychology does. A disciplined trader with a small account will grow it. An undisciplined trader will blow up any account, regardless of size. — Archie Griffin",
    "Gold medals aren't really made of gold. They're made of sweat, determination, and a hard-to-find alloy called guts. The profitable trading account is not made of perfect entries. It is made of thousands of disciplined decisions, boring sessions, and the guts to follow your rules when it felt uncomfortable. — Dan Gable",
    "The only way to prove that you're a good sport is to lose. How you handle your losing trades tells you everything about who you are as a trader. Accept them. Learn from them. Move on without changing your entire system after two bad days. — Ernie Banks",
  ],
  proverbs: [
    "Fall seven times, stand up eight. The market will knock you down. Losing streaks, bad fills, missed setups, unexpected news — these are not signs you should quit. They are the standard experience of every successful trader who ever lived. Fall. Stand. Continue. — Japanese Proverb",
    "The temptation to quit will be greatest just before you are about to succeed. Your edge works over large sample sizes. The losing streak you are in right now is not evidence that your strategy is broken. It may be the exact darkness that precedes your breakthrough. — Chinese Proverb",
    "A smooth sea never made a skilled sailor. You do not build trading skill in the easy conditions. You build it in the chop, the volatility, the uncertainty, the weeks where nothing is working and you still show up and execute your plan anyway. — English Proverb",
    "He who chases two rabbits catches neither. Pick your setup. Pick your timeframe. Pick your strategy. Commit to it fully. The trader who is always switching systems, always chasing the latest edge, never builds the consistency that real mastery requires. — Chinese Proverb",
    "Vision without action is a daydream. Action without vision is a nightmare. You need both a clear plan and the daily discipline to execute it. A beautiful strategy that you never follow is worthless. And aggressive action without a plan is just gambling with extra steps. — Japanese Proverb",
    "The tiger does not proclaim his tigritude. He pounces. The disciplined trader does not talk about their edge. They do not explain their system to strangers or seek validation online. They simply prepare, execute, and let their track record speak for itself. — African Proverb",
  ],
};

const RELIGIOUS_TEXTS: Record<string, string[]> = {
  Islam: [
    "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient. — Quran 2:153\n\nAnd We will surely test you with something of fear and hunger and a loss of wealth and lives and fruits, but give good tidings to the patient — who, when disaster strikes them, say: Indeed we belong to Allah, and indeed to Him we will return. — Quran 2:155-156",
    "And whoever fears Allah — He will make for him a way out. And will provide for him from where he does not expect. And whoever relies upon Allah — then He is sufficient for him. Indeed, Allah will accomplish His purpose. Allah has already set for everything a decreed extent. — Quran 65:2-3",
    "For indeed, with hardship will be ease. Indeed, with hardship will be ease. So when you have finished your duties, then stand up for worship. And to your Lord direct your longing. — Quran 94:5-8\n\nDo not lose hope, nor be sad. You will surely be victorious if you are true in faith. — Quran 3:139",
    "And be patient, for indeed, Allah does not allow to be lost the reward of those who do good. — Quran 11:115\n\nAnd seek help through patience and prayer. Indeed, it is difficult except for the humbly submissive to Allah — who are certain that they will meet their Lord and that they will return to Him. — Quran 2:45-46",
    "Allah does not burden a soul beyond that it can bear. For it is what it has earned, and against it is what it has brought upon itself. Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. — Quran 2:286",
  ],
  Christianity: [
    "I have learned, in whatever state I am, to be content. I know how to be abased, and I know how to abound. In any and all circumstances I have learned the secret of facing plenty and hunger, abundance and need. I can do all things through Christ who strengthens me. — Philippians 4:11-13",
    "Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go. — Joshua 1:9\n\nThe Lord is my light and my salvation; whom shall I fear? The Lord is the stronghold of my life; of whom shall I be afraid? — Psalm 27:1",
    "For God gave us a spirit not of fear but of power and love and self-control. — 2 Timothy 1:7\n\nCast all your anxiety on Him because He cares for you. Be sober-minded; be watchful. Your adversary the devil prowls around like a roaring lion, seeking someone to devour. Resist him, firm in your faith. — 1 Peter 5:7-9",
    "Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge Him, and He will make straight your paths. — Proverbs 3:5-6\n\nCommit your work to the Lord, and your plans will be established. — Proverbs 16:3",
    "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul. He leads me in paths of righteousness for His name's sake. Even though I walk through the valley of the shadow of death, I will fear no evil, for You are with me. — Psalm 23:1-4",
  ],
  Judaism: [
    "Be strong and courageous. Do not fear or be in dread of them, for it is the Lord your God who goes with you. He will not leave you or forsake you. — Deuteronomy 31:6\n\nHave I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go. — Joshua 1:9",
    "The Lord is my light and my salvation; whom shall I fear? The Lord is the stronghold of my life; of whom shall I be afraid? Though an army encamp against me, my heart shall not fear. Though war arise against me, yet I will be confident. — Psalm 27:1,3\n\nWait for the Lord; be strong and let your heart take courage. Wait for the Lord! — Psalm 27:14",
    "Cast your burden on the Lord, and He will sustain you; He will never permit the righteous to be moved. — Psalm 55:22\n\nHe heals the brokenhearted and binds up their wounds. Great is our Lord, and abundant in power; His understanding is beyond measure. — Psalm 147:3,5",
    "Trust in the Lord forever, for in God the Lord, we have an everlasting Rock. — Isaiah 26:4\n\nHave you not known? Have you not heard? The Lord is the everlasting God, the Creator of the ends of the earth. He does not faint or grow weary; His understanding is unsearchable. He gives power to the faint, and to him who has no might He increases strength. — Isaiah 40:28-29",
    "I have set the Lord always before me. Because He is at my right hand, I shall not be shaken. Therefore my heart is glad, and my whole being rejoices. — Psalm 16:8-9\n\nThis is the day that the Lord has made; let us rejoice and be glad in it. — Psalm 118:24",
  ],
  Buddhism: [
    "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment. The present moment is the only moment available to us, and it is the door to all moments. When you are here, fully here, action becomes clear and suffering dissolves. — Buddha, Dhammapada",
    "Peace comes from within. Do not seek it without. The mind that is agitated by external events will find no lasting peace by changing those events. Only by turning inward, by training the mind to rest in awareness itself, does true peace become possible. — Buddha\n\nBetter than a thousand hollow words is one word that brings peace. — Dhammapada 1:100",
    "The mind is everything. What you think you become. All that we are is the result of what we have thought. It is founded on our thoughts. It is made up of our thoughts. If one speaks or acts with a pure thought, happiness follows, like a shadow that never departs. — Buddha, Dhammapada 1:1-2",
    "No one saves us but ourselves. No one can and no one may. We ourselves must walk the path. But Buddhas clearly show the way. Victory breeds hatred. The defeated live in pain. Happily the peaceful live, giving up victory and defeat. — Dhammapada 1:165, 15:201",
    "The root of suffering is attachment. In the seeing, there is only the seen. In the hearing, only the heard. In the sensing, only the sensed. In the knowing, only the known. This is how you put an end to suffering — by seeing things as they truly are, without clinging to what passes. — Buddha, Udana 1:10",
  ],
  Hinduism: [
    "You have the right to perform your actions, but you are not entitled to the fruits of your actions. Do not let the fruit of action be your motive, but do not attach yourself to inaction either. Perform every action with your soul fixed on the Supreme. — Bhagavad Gita 2:47-48\n\nThe wise do not grieve for the dead or the living. Never was there a time when I did not exist, nor you, nor all these beings. Nor will there be any time when we will cease to exist. — Bhagavad Gita 2:11-12",
    "The mind acts like an enemy for those who do not control it, but for those who have conquered their mind, it acts like a best friend. For one who has conquered the mind, the Supersoul is already reached, for he has attained tranquility. — Bhagavad Gita 6:6-7\n\nLet a man lift himself by his own self alone. Let him not lower himself, for this self alone is the friend of oneself, and this self alone is the enemy of oneself. — Bhagavad Gita 6:5",
    "When meditation is mastered, the mind is unwavering like the flame of a lamp in a windless place. Wherever the mind wanders, restless and diffuse in its search for satisfaction without, lead it within. Train it to rest in the Self. — Bhagavad Gita 6:19-20\n\nThe yogi who is satisfied with knowledge and wisdom, who has conquered the senses, who is always steady, to whom a clod, a stone, and gold are the same, is said to be self-realized. — Bhagavad Gita 6:8",
    "One who has control over the mind is tranquil in heat and cold, in pleasure and pain, and in honor and dishonor. Such a person is dear to Me. — Bhagavad Gita 6:7, 12:18\n\nThat one who is not disturbed in mind even amidst the threefold miseries or elated when there is happiness, and who is free from attachment, fear, and anger, is called a sage of steady mind. — Bhagavad Gita 2:56",
    "Set thy heart upon thy work, but never on its reward. Work not for a reward, but never cease to do thy work. Do thine allotted task. Do it! For action is better than inaction. Even the maintenance of the body would be impossible if one remained inactive. — Bhagavad Gita 2:47, 3:8\n\nWhatever you do, make it an offering to Me — the food you eat, the sacrifices you make, the help you give, even your suffering. — Bhagavad Gita 9:27",
  ],
  Sikhism: [
    "In the company of the holy, ego is eliminated. The darkness of ignorance is dispelled, and the divine light illuminates the mind. In this sacred company, one comes to cherish the Lord's Name, and the soul finds peace at last. — Guru Granth Sahib, Ang 94\n\nThe True Guru has given me the treasure of the Naam. Night and day, I am in bliss. My mind and body are satisfied and satiated. — Guru Granth Sahib, Ang 680",
    "One who serves others is truly a great person. One who recognizes the Lord's Light within all, and sees no one as separate from Him — such a person is not separate from God. The One God is pervading everywhere. He is contained within each and every heart. — Guru Granth Sahib, Ang 647\n\nServe the Lord with love; this is the most excellent action. — Guru Granth Sahib",
    "The mind is won by obeying His command. Within the mind is the treasure of the Naam. One who chants the Lord's Name with every breath and every morsel of food — know that person to be my true friend. — Guru Granth Sahib, Ang 1299\n\nWhen the mind is stilled in the lotus of the heart, the soul merges with the Supreme Soul, and one is freed from the cycle of birth and death. — Guru Granth Sahib",
    "Speak only that which will bring you honor. Through the Guru's teachings, the mind becomes steady and stable. One who speaks too much invites suffering. But the one who speaks truth, with humility and love, is welcomed by the Lord in His Court. — Guru Granth Sahib, Ang 722\n\nLet your tongue be truthful, your hands helpful, your feet following the righteous path, and your eyes seeing the Lord in all. — Guru Granth Sahib",
    "Whatever God does, accept that with pleasure. This is the essence of wisdom. In pleasure and in pain, remain balanced. The one who surrenders to the Lord's Will — whether in suffering or in joy — such a person has found the highest state of being. — Guru Granth Sahib, Ang 372\n\nEverything is in Your hands, Lord. You are the Doer of all. I, the merest servant, place my life in Your care. — Guru Granth Sahib",
  ],
};


const RELIGION_TO_BOOK: Record<string, string> = {
  Christianity: 'Bible',
  Islam: 'Quran',
  Judaism: 'Torah',
  Buddhism: 'Dhammapada',
  Hinduism: 'Bhagavad Gita',
  Sikhism: 'Guru Granth Sahib',
};

// FIX: 5-hour cooldown helpers
const MENTAL_PREP_COOLDOWN_MS = 5 * 60 * 60 * 1000;

const getMentalPrepCooldownKey = (userId: string) => `mental_prep_last_${userId}`;

const isMentalPrepOnCooldown = (userId: string): boolean => {
  const last = localStorage.getItem(getMentalPrepCooldownKey(userId));
  if (!last) return false;
  return Date.now() - parseInt(last) < MENTAL_PREP_COOLDOWN_MS;
};

const getMentalPrepCooldownRemaining = (userId: string): string | null => {
  const last = localStorage.getItem(getMentalPrepCooldownKey(userId));
  if (!last) return null;
  const elapsed = Date.now() - parseInt(last);
  if (elapsed >= MENTAL_PREP_COOLDOWN_MS) return null;
  const remaining = MENTAL_PREP_COOLDOWN_MS - elapsed;
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  return `${h}h ${m}m`;
};

// Build a quote for every religion in the list
const buildReligiousQuotes = (religions: string[]): Record<string, string> => {
  const quotes: Record<string, string> = {};
  religions.forEach(religion => {
    const texts = RELIGIOUS_TEXTS[religion] || [];
    if (texts.length > 0) quotes[religion] = texts[Math.floor(Math.random() * texts.length)];
  });
  return quotes;
};

export function MentalPreparation({ onComplete, isPreTrade = false }: { onComplete?: () => void; isPreTrade?: boolean }) {
  const getInitialSettings = (): MentalPrepSettings => {
    const saved = storage.getMentalPrepSettings();
    const defaults: MentalPrepSettings = {
      showTradingQuote: true,
      showGeneralQuote: true,
      quoteSources: ['movies', 'books', 'anime', 'philosophy', 'sports'],
      showAffirmation: true,
      showBreathing: true,
      showReligious: false,
      selectedReligion: 'Islam',
      selectedReligions: ['Islam'],
      requireBeforeTrade: false,
    };
    if (!saved) return defaults;
    return {
      ...defaults,
      ...saved,
      quoteSources: saved.quoteSources || defaults.quoteSources,
      selectedReligions: Array.isArray(saved.selectedReligions) && saved.selectedReligions.length > 0
        ? saved.selectedReligions
        : saved.selectedReligion
          ? [saved.selectedReligion]
          : defaults.selectedReligions,
    };
  };

  const [settings, setSettings] = useState<MentalPrepSettings>(getInitialSettings);

  const [affirmations, setAffirmations] = useState<string[]>(() => storage.getAffirmations());
  const [enabledAffirmations, setEnabledAffirmations] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('stoix_enabled_affirmations');
    if (saved) return new Set(JSON.parse(saved));
    const all = storage.getAffirmations();
    return new Set(all.map((_, i) => i));
  });

  // Load affirmations and mental prep settings from Supabase on mount
  useEffect(() => {
    const loadFromSupabase = async () => {
      const user = storage.getCurrentUser();
      if (!user) return;
      try {
        const { supabase } = await import('../utils/supabase');
        const { data } = await supabase
          .from('users')
          .select('affirmations, mental_prep_settings')
          .eq('id', user.id)
          .maybeSingle();
        if (data) {
          // Sync affirmations
          if (data.affirmations && Array.isArray(data.affirmations) && data.affirmations.length > 0) {
            const localAff = storage.getAffirmations();
            if (data.affirmations.length >= localAff.length) {
              storage.saveAffirmations(data.affirmations);
              setAffirmations(data.affirmations);
              setEnabledAffirmations(new Set(data.affirmations.map((_: any, i: number) => i)));
            }
          }
          // Sync mental prep settings
          if (data.mental_prep_settings) {
            const remote = data.mental_prep_settings;
            const newSettings: MentalPrepSettings = {
              ...getInitialSettings(),
              ...remote,
              quoteSources: remote.quoteSources || getInitialSettings().quoteSources,
              selectedReligions: Array.isArray(remote.selectedReligions) && remote.selectedReligions.length > 0
                ? remote.selectedReligions
                : remote.selectedReligion
                  ? [remote.selectedReligion]
                  : ['Islam'],
            };
            setSettings(newSettings);
            storage.saveMentalPrepSettings(newSettings);
            // FIX: Rebuild quotes for ALL religions from remote settings
            setReligiousQuotes(buildReligiousQuotes(newSettings.selectedReligions));
          }
        }
      } catch (err) {
        console.error('Failed to load from Supabase:', err);
      }
    };
    loadFromSupabase();
  }, []);

  const [newAffirmation, setNewAffirmation] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const [completed, setCompleted] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);

  const [onCooldown, setOnCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null);

  const currentUser = storage.getCurrentUser();

  useEffect(() => {
    if (!currentUser) return;
    const update = () => {
      const remaining = getMentalPrepCooldownRemaining(currentUser.id);
      setOnCooldown(isMentalPrepOnCooldown(currentUser.id));
      setCooldownRemaining(remaining);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Breathing exercise state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [breathingProgress, setBreathingProgress] = useState(0);

  const breathingSequence: BreathingPhase[] = [
    { phase: 'inhale', duration: 4000, instruction: 'Breathe In' },
    { phase: 'hold', duration: 2000, instruction: 'Hold' },
    { phase: 'exhale', duration: 4000, instruction: 'Breathe Out' },
  ];

  const [tradingQuote, setTradingQuote] = useState(() => TRADING_QUOTES[Math.floor(Math.random() * TRADING_QUOTES.length)]);
  const [generalQuote, setGeneralQuote] = useState(() => {
    const saved = storage.getMentalPrepSettings();
    const quoteSources = saved?.quoteSources || ['movies', 'books', 'anime', 'philosophy', 'sports'];
    const enabledQuotes = quoteSources.flatMap((source: string) => CATEGORIZED_QUOTES[source as keyof typeof CATEGORIZED_QUOTES] || []);
    return enabledQuotes.length > 0 ? enabledQuotes[Math.floor(Math.random() * enabledQuotes.length)] : '';
  });

  // FIX: Initialize quotes for ALL selected religions at mount time
  const [religiousQuotes, setReligiousQuotes] = useState<Record<string, string>>(() =>
    buildReligiousQuotes(getInitialSettings().selectedReligions)
  );

  const regenTradingQuote = () => {
    const others = TRADING_QUOTES.filter(q => q !== tradingQuote);
    setTradingQuote(others[Math.floor(Math.random() * others.length)]);
  };

  const regenGeneralQuote = () => {
    const quoteSources = settings.quoteSources || ['movies', 'books', 'anime', 'philosophy', 'sports'];
    const allQuotes = quoteSources.flatMap(source => CATEGORIZED_QUOTES[source as keyof typeof CATEGORIZED_QUOTES] || []);
    const others = allQuotes.filter(q => q !== generalQuote);
    if (others.length > 0) setGeneralQuote(others[Math.floor(Math.random() * others.length)]);
  };

  const regenReligiousQuote = (religion: string) => {
    const texts = RELIGIOUS_TEXTS[religion] || [];
    const current = religiousQuotes[religion] || '';
    const others = texts.filter(t => t !== current);
    if (others.length > 0) {
      setReligiousQuotes(prev => ({ ...prev, [religion]: others[Math.floor(Math.random() * others.length)] }));
    }
  };

  const toggleReligion = (religion: string) => {
    const current = settings.selectedReligions || [settings.selectedReligion];
    const updated = current.includes(religion)
      ? current.filter(r => r !== religion)
      : [...current, religion];
    if (updated.length === 0) return;
    updateSettings({ selectedReligions: updated, selectedReligion: updated[0] });
    // FIX: Init quote for newly added religion immediately
    if (!current.includes(religion)) {
      const texts = RELIGIOUS_TEXTS[religion] || [];
      if (texts.length > 0) {
        setReligiousQuotes(prev => ({ ...prev, [religion]: texts[Math.floor(Math.random() * texts.length)] }));
      }
    }
  };

  const displayAffirmations = affirmations.length > 0
    ? affirmations.filter((_, i) => enabledAffirmations.has(i))
    : [DEFAULT_AFFIRMATIONS[Math.floor(Math.random() * DEFAULT_AFFIRMATIONS.length)]];

  const updateSettings = (updates: Partial<MentalPrepSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    storage.saveMentalPrepSettings(newSettings);
  };

  const toggleQuoteSource = (source: string) => {
    const newSources = settings.quoteSources.includes(source)
      ? settings.quoteSources.filter(s => s !== source)
      : [...settings.quoteSources, source];
    updateSettings({ quoteSources: newSources });
  };

  const addAffirmation = async () => {
    if (!newAffirmation.trim()) return;
    const updated = [...affirmations, newAffirmation.trim()];
    setAffirmations(updated);
    storage.saveAffirmations(updated);
    const updatedEnabled = new Set(enabledAffirmations);
    updatedEnabled.add(updated.length - 1);
    setEnabledAffirmations(updatedEnabled);
    localStorage.setItem('stoix_enabled_affirmations', JSON.stringify([...updatedEnabled]));
    setNewAffirmation('');
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
    storage.trackMentalPrepCompletion(true);

    const user = storage.getCurrentUser();
    let awarded = 0;

    if (user && !isMentalPrepOnCooldown(user.id)) {
      awarded = 5;
      storage.updateCurrentUser({
        totalPoints: (user.totalPoints || 0) + 5,
      });
      localStorage.setItem(getMentalPrepCooldownKey(user.id), Date.now().toString());
    }

    setPointsAwarded(awarded);
    setCompleted(true);

    setOnCooldown(true);
    setCooldownRemaining(getMentalPrepCooldownRemaining(user?.id || '') || '5h 0m');

    if (onComplete) {
      setTimeout(() => onComplete(), 1500);
    }
  };

  const handleSkip = () => {
    storage.trackMentalPrepCompletion(false);
    if (onComplete) {
      onComplete();
    }
  };

  if (completed) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold">Preparation Complete</h2>
          {pointsAwarded > 0 ? (
            <div className="space-y-1">
              <p className="text-xl font-bold text-green-600">
                +{pointsAwarded} Discipline Points Earned 🏆
              </p>
              <p className="text-sm text-muted-foreground">
                Points available in: <span className="font-semibold text-foreground">
                  {getMentalPrepCooldownRemaining(currentUser?.id || '') || '5h 0m'}
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Points on cooldown</p>
              <p className="text-sm text-muted-foreground">
                Available in: <span className="font-semibold text-foreground">
                  {getMentalPrepCooldownRemaining(currentUser?.id || '') || 'a few hours'}
                </span>
              </p>
            </div>
          )}
          <p className="text-muted-foreground text-sm">You're focused and ready. Trade with discipline.</p>
          <Button
            variant="outline"
            onClick={() => setCompleted(false)}
            className="mt-2"
          >
            ← Back to Preparation
          </Button>
        </div>
      </div>
    );
  }

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
                <div className="ml-6 pt-2 space-y-2">
                  <Label className="text-sm block">Select Books (choose any)</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: 'Christianity', label: 'Bible (Christianity)' },
                      { value: 'Islam', label: 'Quran (Islam)' },
                      { value: 'Judaism', label: 'Torah (Judaism)' },
                      { value: 'Buddhism', label: 'Dhammapada (Buddhism)' },
                      { value: 'Hinduism', label: 'Bhagavad Gita (Hinduism)' },
                      { value: 'Sikhism', label: 'Guru Granth Sahib (Sikhism)' },
                    ].map(({ value, label }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`religion-${value}`}
                          checked={(settings.selectedReligions || [settings.selectedReligion]).includes(value)}
                          onCheckedChange={() => toggleReligion(value)}
                        />
                        <Label htmlFor={`religion-${value}`} className="text-sm cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
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
                  <p className="text-xs text-muted-foreground">Check which affirmations to show during preparation:</p>
                  {affirmations.map((affirmation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted">
                      {editingIndex === index ? (
                        <>
                          <Input value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1" autoFocus />
                          <Button size="sm" onClick={saveEditAffirmation}>Save</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Checkbox
                            checked={enabledAffirmations.has(index)}
                            onCheckedChange={(checked) => {
                              const updated = new Set(enabledAffirmations);
                              if (checked) updated.add(index);
                              else updated.delete(index);
                              setEnabledAffirmations(updated);
                              localStorage.setItem('stoix_enabled_affirmations', JSON.stringify([...updated]));
                            }}
                            className="mt-0.5"
                          />
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

      {onCooldown && !isPreTrade && (
        <Alert className="mb-6 bg-muted border-muted-foreground/20">
          <AlertDescription className="text-sm">
            ⏳ Points on cooldown — available again in <span className="font-bold">{cooldownRemaining}</span>. You can still complete preparation for mindset benefits.
          </AlertDescription>
        </Alert>
      )}

      {isPreTrade && (
        <Alert className="mb-6 bg-purple-500/10 border-purple-500/20">
          <Brain className="h-4 w-4 text-purple-500" />
          <AlertDescription className="text-sm">
            Complete your mental preparation to continue to the journal entry {!onCooldown ? '(+5 points)' : ''}
          </AlertDescription>
        </Alert>
      )}

      {!isPreTrade && !onCooldown && (
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Quote className="w-5 h-5 text-blue-500" />
                    Trading Wisdom
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={regenTradingQuote} className="text-xs text-muted-foreground">
                    🔄 New Quote
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-base italic leading-relaxed">"{tradingQuote}"</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* General Quote */}
        {settings.showGeneralQuote && generalQuote && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="w-5 h-5 text-pink-500" />
                    Inspiration
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={regenGeneralQuote} className="text-xs text-muted-foreground">
                    🔄 New Quote
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-base italic leading-relaxed">"{generalQuote}"</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Personal Affirmation */}
        {settings.showAffirmation && displayAffirmations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Your Affirmations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {displayAffirmations.map((aff, i) => (
                  <p key={i} className="text-base font-semibold leading-relaxed text-green-500">✓ {aff}</p>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {settings.showAffirmation && affirmations.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Your Affirmations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No affirmations added yet. Go to settings to add your personal affirmations.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowSettings(true)}>
                  Add Affirmations
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* FIX: Religious Reading — render a card for EVERY selected religion */}
        {settings.showReligious && settings.selectedReligions.map((religion, idx) => {
          // FIX: If quote not yet loaded for this religion, generate one on the fly
          const quote = religiousQuotes[religion] || (() => {
            const texts = RELIGIOUS_TEXTS[religion] || [];
            if (texts.length === 0) return null;
            const q = texts[Math.floor(Math.random() * texts.length)];
            setReligiousQuotes(prev => ({ ...prev, [religion]: q }));
            return q;
          })();

          if (!quote) return null;

          return (
            <motion.div key={religion} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 + idx * 0.1 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Book className="w-5 h-5 text-amber-500" />
                      {RELIGION_TO_BOOK[religion] || religion} Reading
                    </CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => regenReligiousQuote(religion)} className="text-xs text-muted-foreground">
                      🔄 New Verse
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed">{quote}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

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
          ) : onCooldown ? (
            <div className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-muted border">
              <p className="text-sm font-semibold text-muted-foreground">⏳ Cooldown active</p>
              <p className="text-lg font-bold">Available in {cooldownRemaining}</p>
              <p className="text-xs text-muted-foreground">You can still use the preparation for mindset benefits</p>
            </div>
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
