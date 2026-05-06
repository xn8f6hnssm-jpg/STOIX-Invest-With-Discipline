import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, Trophy, Copy, Check, Crown, Shield, UserPlus, Settings, DollarSign, Target, MessageSquare, ArrowLeft, Edit2, Save, Trash2, Hash } from 'lucide-react';
import { storage, GroupChallenge } from '../utils/storage';
import { supabase } from '../utils/supabase';
import { GroupChat } from '../components/GroupChat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

export function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const currentUser = storage.getCurrentUser();

  const [groupVersion, setGroupVersion] = useState(0);
  const refreshGroup = () => setGroupVersion(v => v + 1);
  const [group, setGroup] = useState<any>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'challenges' | 'members' | 'admin'>('chat');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [challengeName, setChallengeName] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [challengeDuration, setChallengeDuration] = useState('7');
  const [challengePrize, setChallengePrize] = useState('');

  useEffect(() => {
    const loadGroup = async () => {
      if (!groupId) return;
      const { data } = await supabase.from('groups').select('*').eq('id', groupId).maybeSingle();
      if (data) {
        setGroup({
          id: data.id, name: data.name, description: data.description || '',
          creatorId: data.creator_id, creatorUsername: data.creator_username,
          type: data.type || 'free', price: data.price,
          memberCount: data.member_count || 1,
          members: Array.isArray(data.members) ? data.members : [],
          admins: Array.isArray(data.admins) ? data.admins : [],
          inviteCode: data.invite_code || '',
          isPublic: data.is_public !== false,
          challenges: Array.isArray(data.challenges) ? data.challenges : [],
        });
      } else {
        const local = storage.getGroups().find(g => g.id === groupId);
        setGroup(local || null);
      }
      setGroupLoading(false);
    };
    loadGroup();
  }, [groupId, groupVersion]);

  useEffect(() => {
    if (!group) return;
    const existing = storage.getGroupChannels(group.id);
    if (existing.length === 0) {
      storage.addGroupChannel({ groupId: group.id, name: 'general', description: 'General discussion', createdBy: group.creatorId, isDefault: true });
    }
  }, [group?.id]);

  if (groupLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!group || !currentUser) return (
    <div className="p-6 text-center">
      <p className="mb-4">Group not found</p>
      <Button onClick={() => navigate('/app/groups')}><ArrowLeft className="w-4 h-4 mr-2" />Back to Groups</Button>
    </div>
  );

  const isAdmin = group.admins.includes(currentUser.id);
  const isMember = group.members.includes(currentUser.id);
  const isCreator = group.creatorId === currentUser.id;
  const joinRequests = storage.getJoinRequests().filter(r => r.groupId === groupId && r.status === 'pending');

  if (!isMember) return (
    <div className="container mx-auto px-4 py-12 max-w-md text-center">
      <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
      <h1 className="text-2xl font-bold mb-2">{group.name}</h1>
      <p className="text-muted-foreground mb-6">{group.description}</p>
      <Button onClick={() => navigate('/app/groups')}>Back to Groups</Button>
    </div>
  );

  const copyInviteCode = () => { navigator.clipboard.writeText(group.inviteCode); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); };

  const handleSaveGroupInfo = async () => {
    if (!editGroupName.trim()) return;
    storage.updateGroup(group.id, { name: editGroupName.trim(), description: editGroupDesc.trim() });
    await supabase.from('groups').update({ name: editGroupName.trim(), description: editGroupDesc.trim() }).eq('id', group.id);
    setEditingName(false);
    refreshGroup();
  };

  const handleApproveRequest = async (requestId: string, userId: string) => {
    const newMembers = [...group.members, userId];
    storage.updateGroup(group.id, { members: newMembers, memberCount: newMembers.length });
    await supabase.from('groups').update({ members: newMembers, member_count: newMembers.length }).eq('id', group.id);
    storage.updateJoinRequest(requestId, { status: 'approved' });
    // Send notification to the user
    storage.addNotification({ userId, type: 'follow', fromId: currentUser.id, text: `You were approved to join ${group.name}` });
    refreshGroup();
  };

  const handleRejectRequest = (requestId: string) => { storage.updateJoinRequest(requestId, { status: 'rejected' }); refreshGroup(); };

  const handleCreateChallenge = () => {
    if (!challengeName.trim()) return;
    const duration = parseInt(challengeDuration);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);
    const newChallenge: GroupChallenge = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      groupId: group.id, name: challengeName.trim(), description: challengeDescription.trim(),
      duration, participants: [currentUser.id],
      startDate: startDate.toISOString(), endDate: endDate.toISOString(),
      prize: challengePrize.trim() || undefined,
      rules: ['Log every trade', 'Follow your rules', 'Earn points'],
      leaderboard: [{ userId: currentUser.id, points: 0, username: currentUser.username }],
      status: 'active', createdBy: currentUser.id, createdAt: Date.now(),
    };
    storage.updateGroup(group.id, { challenges: [...(group.challenges || []), newChallenge] });
    setShowCreateChallengeModal(false);
    setChallengeName(''); setChallengeDescription(''); setChallengeDuration('7'); setChallengePrize('');
    refreshGroup();
  };

  const getChallengeProgress = (challenge: any, userId: string): { met: number; required: number; qualified: boolean } => {
    const required = challenge.duration;
    const startDate = new Date(challenge.startDate).toISOString().split('T')[0];
    const endDate = new Date(challenge.endDate).toISOString().split('T')[0];
    const allLogs = storage.getDayLogs().filter((l: any) => l.userId === userId && l.date >= startDate && l.date <= endDate);
    const sortedLogs = [...allLogs].sort((a: any, b: any) => a.date.localeCompare(b.date));
    let streak = 0, maxStreak = 0, prev = '';
    for (const log of sortedLogs) {
      if (log.isClean) {
        if (prev) {
          const prevDate = new Date(prev);
          prevDate.setDate(prevDate.getDate() + 1);
          streak = log.date === prevDate.toISOString().split('T')[0] ? streak + 1 : 1;
        } else { streak = 1; }
        maxStreak = Math.max(maxStreak, streak);
      } else { streak = 0; }
      prev = log.date;
    }
    const met = Math.min(maxStreak, allLogs.filter((l: any) => l.isClean).length);
    return { met, required, qualified: met >= required };
  };

  const handleCompleteChallenge = (challengeId: string) => {
    if (!currentUser || !isAdmin) return;
    const challenge = (group.challenges || []).find((c: any) => c.id === challengeId);
    if (!challenge || challenge.status !== 'active') return;
    const qualified = challenge.participants.filter((uid: string) => getChallengeProgress(challenge, uid).qualified);
    if (qualified.length === 0) { alert('No participants have met the challenge requirement yet.'); return; }
    const updatedChallenges = (group.challenges || []).map((c: any) => {
      if (c.id === challengeId && c.status === 'active') {
        qualified.forEach((userId: string) => {
          storage.addAchievement(userId, {
            type: challenge.prize === 'trophy' ? 'trophy' : 'medal',
            title: `Completed: ${c.name}`,
            description: `Successfully completed the ${c.duration}-day challenge`,
            source: 'group_challenge', groupId: group.id, challengeId,
          });
        });
        return { ...c, status: 'completed', leaderboard: [...c.leaderboard].sort((a: any, b: any) => b.points - a.points) };
      }
      return c;
    });
    storage.updateGroup(group.id, { challenges: updatedChallenges });
    alert(`✅ Challenge completed! ${qualified.length} participant(s) earned their reward.`);
    refreshGroup();
  };

  const TABS = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'challenges', icon: Trophy, label: 'Challenges' },
    { id: 'members', icon: Users, label: 'Members' },
    ...(isAdmin ? [{ id: 'admin', icon: Settings, label: 'Admin' }] : []),
  ];

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Header — compact Discord-style */}
      <div className="flex items-center gap-3 px-3 py-2 border-b bg-card flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/groups')} className="flex-shrink-0 h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <h1 className="font-bold text-sm truncate">{group.name}</h1>
            {isCreator && <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
            {isAdmin && !isCreator && <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{group.memberCount} members</p>
        </div>
        {isAdmin && (
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 relative" onClick={() => setShowJoinRequestsModal(true)}>
              <UserPlus className="w-4 h-4" />
              {joinRequests.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{joinRequests.length}</span>}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyInviteCode}>
              {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b bg-card flex-shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'chat' && (
          <GroupChat groupId={group.id} currentUserId={currentUser.id} currentUsername={currentUser.username} isAdmin={isAdmin} groupMembers={group.members} />
        )}

        {activeTab === 'challenges' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Challenges</h2>
              {isAdmin && <Button size="sm" onClick={() => setShowCreateChallengeModal(true)}><Target className="w-4 h-4 mr-1" />Create</Button>}
            </div>
            {!group.challenges || group.challenges.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No challenges yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {group.challenges.map((challenge: any) => (
                  <Card key={challenge.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{challenge.name}</CardTitle>
                        <Badge className={challenge.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}>{challenge.status}</Badge>
                      </div>
                      <CardDescription>{challenge.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Duration</span><span>{challenge.duration} days</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Participants</span><span>{challenge.participants.length}</span></div>
                      {challenge.prize && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Prize</span><span className="text-yellow-500">{challenge.prize}</span></div>}
                      {!challenge.participants.includes(currentUser.id) && challenge.status === 'active' && (
                        <Button size="sm" className="w-full mt-2" onClick={() => {
                          const updated = group.challenges.map((c: any) => c.id === challenge.id ? { ...c, participants: [...c.participants, currentUser.id], leaderboard: [...c.leaderboard, { userId: currentUser.id, points: 0, username: currentUser.username }] } : c);
                          storage.updateGroup(group.id, { challenges: updated }); refreshGroup();
                        }}>Join Challenge</Button>
                      )}
                      {challenge.participants.includes(currentUser.id) && challenge.status === 'active' && (() => {
                        const progress = getChallengeProgress(challenge, currentUser.id);
                        return (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Your progress</span>
                              <span className={progress.qualified ? 'text-green-500 font-bold' : ''}>{progress.met}/{progress.required} days{progress.qualified ? ' ✓' : ''}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full transition-all ${progress.qualified ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${Math.min((progress.met / progress.required) * 100, 100)}%` }} />
                            </div>
                            {isAdmin && (
                              <Button size="sm" className="w-full mt-1" variant="outline"
                                disabled={!challenge.participants.some((uid: string) => getChallengeProgress(challenge, uid).qualified)}
                                onClick={() => handleCompleteChallenge(challenge.id)}>
                                Complete Challenge
                              </Button>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="p-4">
            <h2 className="font-bold mb-3">Members ({group.memberCount})</h2>
            <div className="space-y-2">
              {group.members.map((memberId: string) => {
                const member = storage.getAllUsers().find(u => u.id === memberId);
                if (!member) return null;
                return (
                  <div key={memberId} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {member.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm flex items-center gap-1 truncate">
                        @{member.username}
                        {group.creatorId === memberId && <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                        {group.admins.includes(memberId) && group.creatorId !== memberId && <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.totalPoints} pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="p-4 space-y-4">
            {/* Group Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Group Settings</CardTitle>
                  {!editingName ? (
                    <Button variant="outline" size="sm" onClick={() => { setEditGroupName(group.name); setEditGroupDesc(group.description); setEditingName(true); }}>
                      <Edit2 className="w-3.5 h-3.5 mr-1" />Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveGroupInfo}><Save className="w-3.5 h-3.5 mr-1" />Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>Cancel</Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {editingName ? (
                  <>
                    <div><Label>Name</Label><Input value={editGroupName} onChange={e => setEditGroupName(e.target.value)} className="mt-1" /></div>
                    <div><Label>Description</Label><Textarea value={editGroupDesc} onChange={e => setEditGroupDesc(e.target.value)} rows={3} className="mt-1" /></div>
                  </>
                ) : (
                  <>
                    <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium text-sm">{group.name}</p></div>
                    <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{group.description || '—'}</p></div>
                  </>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
                  <div className="flex gap-2">
                    <Input value={group.inviteCode} readOnly className="font-mono" />
                    <Button variant="outline" size="icon" onClick={copyInviteCode}>{copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Earnings */}
            {isCreator && group.type === 'paid' && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4" />Earnings</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Price/member</span><span>${group.price}/mo</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Your cut (95%)</span><span className="text-green-500">${(group.price * 0.95).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2"><span>Monthly revenue</span><span className="text-green-500">${((group.price * 0.95) * group.memberCount).toFixed(2)}</span></div>
                  <Button onClick={() => navigate('/app/credits')} className="w-full mt-2" size="sm">Withdraw</Button>
                </CardContent>
              </Card>
            )}

            {/* Danger */}
            {isCreator && (
              <Card className="border-red-500/30">
                <CardHeader><CardTitle className="text-red-500 text-base">Danger Zone</CardTitle></CardHeader>
                <CardContent>
                  <Button variant="destructive" className="w-full" onClick={() => {
                    if (!confirm(`Delete "${group.name}" permanently?`)) return;
                    if (storage.deleteGroup) storage.deleteGroup(group.id);
                    supabase.from('groups').delete().eq('id', group.id);
                    navigate('/app/groups');
                  }}>Delete Group</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Create Challenge Modal */}
      <Dialog open={showCreateChallengeModal} onOpenChange={setShowCreateChallengeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Challenge</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input placeholder="7-Day Discipline Challenge" value={challengeName} onChange={e => setChallengeName(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea placeholder="What's the goal?" value={challengeDescription} onChange={e => setChallengeDescription(e.target.value)} rows={2} /></div>
            <div><Label>Duration (days)</Label><Input type="number" value={challengeDuration} onChange={e => setChallengeDuration(e.target.value)} min="1" max="90" /></div>
            <Button onClick={handleCreateChallenge} className="w-full" disabled={!challengeName.trim()}>Create Challenge</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Requests Modal */}
      <Dialog open={showJoinRequestsModal} onOpenChange={setShowJoinRequestsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Join Requests ({joinRequests.length})</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {joinRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No pending requests</p>
            ) : joinRequests.map(req => (
              <div key={req.id} className="p-3 rounded-lg border">
                <p className="font-medium text-sm mb-2">@{req.username}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApproveRequest(req.id, req.userId)} className="flex-1 bg-green-600 hover:bg-green-700">Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req.id)} className="flex-1">Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
