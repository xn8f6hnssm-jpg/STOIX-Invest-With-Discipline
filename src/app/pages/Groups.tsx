import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, Plus, Search, Lock, Unlock, Copy, Check, DollarSign, Crown } from 'lucide-react';
import { storage, Group } from '../utils/storage';
import { useNavigate } from 'react-router';

export function Groups() {
  const navigate = useNavigate();
  const currentUser = storage.getCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupType, setNewGroupType] = useState<'free' | 'paid'>('free');
  const [newGroupPrice, setNewGroupPrice] = useState('29');
  const [newGroupIsPublic, setNewGroupIsPublic] = useState(true);

  const allGroups = storage.getGroups();
  const myGroups = allGroups.filter(g => g.members.includes(currentUser?.id || ''));
  const publicGroups = allGroups.filter(g => g.isPublic && !g.members.includes(currentUser?.id || ''));
  const filteredGroups = publicGroups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateInviteCode = (): string => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreateGroup = () => {
    if (!currentUser || !newGroupName.trim()) return;
    const newGroup: Omit<Group, 'id' | 'createdAt'> = {
      name: newGroupName.trim(),
      description: newGroupDescription.trim(),
      creatorId: currentUser.id,
      creatorUsername: currentUser.username,
      type: newGroupType,
      price: newGroupType === 'paid' ? parseFloat(newGroupPrice) : undefined,
      memberCount: 1,
      members: [currentUser.id],
      admins: [currentUser.id],
      inviteCode: generateInviteCode(),
      isPublic: newGroupIsPublic,
      challenges: [],
    };
    const createdGroup = storage.addGroup(newGroup);
    setShowCreateModal(false);
    setNewGroupName(''); setNewGroupDescription(''); setNewGroupType('free'); setNewGroupPrice('29'); setNewGroupIsPublic(true);
    navigate(`/app/groups/${createdGroup.id}`);
  };

  const handleJoinByInviteCode = () => {
    if (!currentUser || !inviteCode.trim()) return;
    const group = allGroups.find(g => g.inviteCode.toUpperCase() === inviteCode.trim().toUpperCase());
    if (!group) { alert('Invalid invite code'); return; }
    if (group.members.includes(currentUser.id)) { alert('You are already a member of this group'); navigate(`/app/groups/${group.id}`); return; }
    if (group.type === 'paid' && group.price) {
      if (!confirm(`This group costs $${group.price}/month. Join now?`)) return;
      const creatorEarnings = group.price * 0.95;
      let creatorCredits = storage.getUserCredits().find(c => c.userId === group.creatorId);
      if (!creatorCredits) { storage.addUserCredits({ userId: group.creatorId, balance: 0, totalEarned: 0, totalWithdrawn: 0, transactions: [] }); creatorCredits = { userId: group.creatorId, balance: 0, totalEarned: 0, totalWithdrawn: 0, transactions: [] }; }
      storage.addCreditTransaction({ userId: group.creatorId, type: 'earn', amount: creatorEarnings, source: `Group payment from ${currentUser.username} (${group.name})`, status: 'completed' });
      storage.updateUserCredits(group.creatorId, { balance: (creatorCredits.balance || 0) + creatorEarnings, totalEarned: (creatorCredits.totalEarned || 0) + creatorEarnings });
    }
    storage.updateGroup(group.id, { members: [...group.members, currentUser.id], memberCount: group.memberCount + 1 });
    setShowJoinByCodeModal(false); setInviteCode('');
    navigate(`/app/groups/${group.id}`);
  };

  const handleRequestToJoin = (groupId: string) => {
    if (!currentUser) return;
    const existing = storage.getJoinRequests().find(r => r.groupId === groupId && r.userId === currentUser.id && r.status === 'pending');
    if (existing) { alert('You have already requested to join this group'); return; }
    storage.addJoinRequest({ groupId, userId: currentUser.id, username: currentUser.username, status: 'pending' });
    alert('Join request sent! Wait for admin approval.');
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!currentUser) return <div className="p-6">Please log in to view groups</div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2"><Users className="w-8 h-8 text-blue-500" />Groups</h1>
          <p className="text-muted-foreground">Join communities, share strategies, and compete in challenges</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/app/credits')} variant="outline"><DollarSign className="w-4 h-4 mr-2" />Credits</Button>
          <Button onClick={() => setShowJoinByCodeModal(true)} variant="outline"><Search className="w-4 h-4 mr-2" />Join by Code</Button>
          <Button onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-2" />Create Group</Button>
        </div>
      </div>

      {myGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">My Groups ({myGroups.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map(group => (
              <Card key={group.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/app/groups/${group.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    {group.creatorId === currentUser.id && <Crown className="w-5 h-5 text-yellow-500" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {group.type === 'paid' ? (<Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><DollarSign className="w-3 h-3 mr-1" />${group.price}/mo</Badge>) : (<Badge className="bg-green-500/20 text-green-500 border-green-500/30"><Unlock className="w-3 h-3 mr-1" />Free</Badge>)}
                    <Badge variant="outline"><Users className="w-3 h-3 mr-1" />{group.memberCount}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">by @{group.creatorUsername}</span>
                    {group.creatorId === currentUser.id && (
                      <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); copyInviteCode(group.inviteCode); }}>
                        {copiedCode === group.inviteCode ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}{group.inviteCode}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Discover Groups</h2>
          <Input placeholder="Search groups..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
        </div>
        {filteredGroups.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground mb-2">No groups found</p><p className="text-sm text-muted-foreground">Create your own group or join with an invite code</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map(group => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {group.type === 'paid' ? (<Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><DollarSign className="w-3 h-3 mr-1" />${group.price}/mo</Badge>) : (<Badge className="bg-green-500/20 text-green-500 border-green-500/30"><Unlock className="w-3 h-3 mr-1" />Free</Badge>)}
                    <Badge variant="outline"><Users className="w-3 h-3 mr-1" />{group.memberCount}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">by @{group.creatorUsername}</span>
                    <Button size="sm" onClick={() => handleRequestToJoin(group.id)}>Request to Join</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create New Group</DialogTitle><DialogDescription>Build a community around your trading strategy</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Group Name</Label><Input placeholder="e.g., ICT Traders Community" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea placeholder="What is your group about?" value={newGroupDescription} onChange={e => setNewGroupDescription(e.target.value)} rows={3} /></div>
            <div>
              <Label>Group Type</Label>
              <Select value={newGroupType} onValueChange={(v: 'free' | 'paid') => setNewGroupType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free"><div className="flex items-center gap-2"><Unlock className="w-4 h-4" />Free Group</div></SelectItem>
                  <SelectItem value="paid"><div className="flex items-center gap-2"><Lock className="w-4 h-4" />Paid Group (Members pay to join)</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newGroupType === 'paid' && (
              <div>
                <Label>Monthly Price (USD)</Label>
                <Input type="number" placeholder="29" value={newGroupPrice} onChange={e => setNewGroupPrice(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">You earn 95% (${(parseFloat(newGroupPrice || '0') * 0.95).toFixed(2)}) · Platform fee 5%</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={newGroupIsPublic} onChange={e => setNewGroupIsPublic(e.target.checked)} className="rounded" />
              <Label className="cursor-pointer">Public (Discoverable in search)</Label>
            </div>
            <Button onClick={handleCreateGroup} className="w-full" disabled={!newGroupName.trim()}><Plus className="w-4 h-4 mr-2" />Create Group</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showJoinByCodeModal} onOpenChange={setShowJoinByCodeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Join by Invite Code</DialogTitle><DialogDescription>Enter the 6-character invite code to join instantly</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Invite Code</Label><Input placeholder="ABC123" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} maxLength={6} className="uppercase text-center text-2xl tracking-widest" /></div>
            <Button onClick={handleJoinByInviteCode} className="w-full" disabled={inviteCode.length !== 6}>Join Group</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
