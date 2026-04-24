import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, Trophy, Copy, Check, Crown, Shield, UserPlus, Settings, DollarSign, Target, MessageSquare, ArrowLeft, Edit2, Save, Trash2 } from 'lucide-react';
import { storage, GroupChallenge } from '../utils/storage';
import { GroupChat } from '../components/GroupChat';

export function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const currentUser = storage.getCurrentUser();

  // Force re-render when group data changes
  const [groupVersion, setGroupVersion] = useState(0);
  const refreshGroup = () => setGroupVersion(v => v + 1);

  const group = storage.getGroups().find(g => g.id === groupId);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);

  // Admin edit state
  const [editingName, setEditingName] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');

  // Challenge form
  const [challengeName, setChallengeName] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [challengeDuration, setChallengeDuration] = useState('7');
  const [challengePrize, setChallengePrize] = useState('');

  // Initialize default channel
  useEffect(() => {
    if (!group) return;
    const existingChannels = storage.getGroupChannels(group.id);
    if (existingChannels.length === 0) {
      storage.addGroupChannel({
        groupId: group.id,
        name: 'general',
        description: 'General discussion',
        createdBy: group.creatorId,
        isDefault: true,
      });
    }
  }, [group?.id]);

  if (!group || !currentUser) {
    return (
      <div className="p-6 text-center">
        <p>Group not found or you don't have access</p>
        <Button onClick={() => navigate('/app/groups')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Groups
        </Button>
      </div>
    );
  }

  const isAdmin = group.admins.includes(currentUser.id);
  const isMember = group.members.includes(currentUser.id);
  const isCreator = group.creatorId === currentUser.id;

  // Re-read join requests each render so modal stays fresh after approve/reject
  const joinRequests = storage.getJoinRequests().filter(
    r => r.groupId === groupId && r.status === 'pending'
  );

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveGroupInfo = () => {
    if (!editGroupName.trim()) return;
    storage.updateGroup(group.id, {
      name: editGroupName.trim(),
      description: editGroupDesc.trim(),
    });
    setEditingName(false);
    refreshGroup();
  };

  const handleDeleteGroup = () => {
    if (!confirm(`Delete "${group.name}" permanently? This cannot be undone.`)) return;
    if (storage.deleteGroup) storage.deleteGroup(group.id);
    navigate('/app/groups');
  };

  const handleDeleteChannel = (channelId: string, channelName: string) => {
    if (channelName === 'general') { alert('Cannot delete the default general channel.'); return; }
    if (!confirm(`Delete #${channelName}?`)) return;
    if (storage.deleteGroupChannel) storage.deleteGroupChannel(channelId);
    refreshGroup();
  };

  const handleCreateChallenge = () => {
    if (!challengeName.trim() || !currentUser) return;
    const duration = parseInt(challengeDuration);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const newChallenge: GroupChallenge = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      groupId: group.id,
      name: challengeName.trim(),
      description: challengeDescription.trim(),
      duration,
      participants: [currentUser.id],
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      prize: challengePrize.trim() || undefined,
      rules: ['Log every trade in your journal', 'Follow your trading rules', 'Earn points for discipline and wins'],
      leaderboard: [{ userId: currentUser.id, points: 0, username: currentUser.username }],
      status: 'active',
      createdBy: currentUser.id,
      createdAt: Date.now(),
    };

    storage.updateGroup(group.id, { challenges: [...(group.challenges || []), newChallenge] });
    setShowCreateChallengeModal(false);
    setChallengeName(''); setChallengeDescription(''); setChallengeDuration('7'); setChallengePrize('');
    refreshGroup();
  };

  const handleApproveRequest = (requestId: string, userId: string) => {
    storage.updateGroup(group.id, {
      members: [...group.members, userId],
      memberCount: group.memberCount + 1,
    });
    storage.updateJoinRequest(requestId, { status: 'approved' });
    refreshGroup();
  };

  const handleRejectRequest = (requestId: string) => {
    storage.updateJoinRequest(requestId, { status: 'rejected' });
    refreshGroup();
  };

  const handleJoinChallenge = (challengeId: string) => {
    if (!currentUser) return;
    const updatedChallenges = (group.challenges || []).map(c => {
      if (c.id === challengeId && !c.participants.includes(currentUser.id)) {
        return {
          ...c,
          participants: [...c.participants, currentUser.id],
          leaderboard: [...c.leaderboard, { userId: currentUser.id, points: 0, username: currentUser.username }]
        };
      }
      return c;
    });
    storage.updateGroup(group.id, { challenges: updatedChallenges });
    refreshGroup();
  };

  const getChallengeProgress = (challenge: GroupChallenge, userId: string): { met: number; required: number; qualified: boolean } => {
    const required = challenge.duration;
    const startDate = new Date(challenge.startDate).toISOString().split('T')[0];
    const endDate = new Date(challenge.endDate).toISOString().split('T')[0];
    const allLogs = storage.getDayLogs().filter((l: any) => l.userId === userId && l.date >= startDate && l.date <= endDate);
    const sortedLogs = allLogs.sort((a: any, b: any) => a.date.localeCompare(b.date));
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
    const challenge = (group.challenges || []).find(c => c.id === challengeId);
    if (!challenge || challenge.status !== 'active') return;
    const qualified = challenge.participants.filter(uid => getChallengeProgress(challenge, uid).qualified);
    if (qualified.length === 0) { alert('No participants have met the challenge requirement yet.'); return; }
    const updatedChallenges = (group.challenges || []).map(c => {
      if (c.id === challengeId && c.status === 'active') {
        qualified.forEach(userId => {
          storage.addAchievement(userId, {
            type: c.prize === 'trophy' ? 'trophy' : 'medal',
            title: `Completed: ${c.name}`,
            description: `Successfully completed the ${c.duration}-day challenge`,
            source: 'group_challenge', groupId: group.id, challengeId,
          });
        });
        return { ...c, status: 'completed' as const, leaderboard: [...c.leaderboard].sort((a, b) => b.points - a.points) };
      }
      return c;
    });
    storage.updateGroup(group.id, { challenges: updatedChallenges });
    alert(`✅ Challenge completed! ${qualified.length} participant(s) earned their reward.`);
    refreshGroup();
  };

  if (!isMember) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Join {group.name} to access content</h1>
        <p className="text-muted-foreground mb-6">{group.description}</p>
        <Button onClick={() => navigate('/app/groups')}>Back to Groups</Button>
      </div>
    );
  }

  // Get fresh join requests count for display
  const freshJoinRequests = storage.getJoinRequests().filter(r => r.groupId === groupId && r.status === 'pending');

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header with back button */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {/* BACK BUTTON */}
            <Button variant="ghost" size="icon" onClick={() => navigate('/app/groups')} className="mt-1 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
                {group.name}
                {isCreator && <Crown className="w-6 h-6 text-yellow-500" />}
                {isAdmin && !isCreator && <Shield className="w-6 h-6 text-blue-500" />}
              </h1>
              <p className="text-muted-foreground mb-3">{group.description}</p>
              <div className="flex items-center gap-2">
                {group.type === 'paid' ? (
                  <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><DollarSign className="w-3 h-3 mr-1" />${group.price}/month</Badge>
                ) : (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Free Group</Badge>
                )}
                <Badge variant="outline"><Users className="w-3 h-3 mr-1" />{group.memberCount} members</Badge>
                <Badge variant="outline">by @{group.creatorUsername}</Badge>
              </div>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowJoinRequestsModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Requests ({freshJoinRequests.length})
              </Button>
              <Button variant="outline" onClick={copyInviteCode}>
                {copiedCode ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {group.inviteCode}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-2" />Chat</TabsTrigger>
          <TabsTrigger value="challenges"><Trophy className="w-4 h-4 mr-2" />Challenges</TabsTrigger>
          <TabsTrigger value="members"><Users className="w-4 h-4 mr-2" />Members</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin"><Settings className="w-4 h-4 mr-2" />Admin</TabsTrigger>}
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <GroupChat groupId={group.id} currentUserId={currentUser.id} currentUsername={currentUser.username} isAdmin={isAdmin} groupMembers={group.members} />
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Group Challenges</h2>
            {isAdmin && <Button onClick={() => setShowCreateChallengeModal(true)}><Target className="w-4 h-4 mr-2" />Create Challenge</Button>}
          </div>
          {!group.challenges || group.challenges.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground mb-2">No challenges yet</p>{isAdmin && <Button onClick={() => setShowCreateChallengeModal(true)} className="mt-4">Create First Challenge</Button>}</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.challenges.map(challenge => {
                const isParticipant = challenge.participants.includes(currentUser.id);
                const daysLeft = Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <Card key={challenge.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg">{challenge.name}</CardTitle>
                        <Badge className={challenge.status === 'active' ? 'bg-green-500/20 text-green-500' : challenge.status === 'upcoming' ? 'bg-blue-500/20 text-blue-500' : 'bg-gray-500/20 text-gray-500'}>{challenge.status}</Badge>
                      </div>
                      <CardDescription>{challenge.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Duration</span><span className="font-medium">{challenge.duration} days ({daysLeft} left)</span></div>
                        <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Participants</span><span className="font-medium">{challenge.participants.length}</span></div>
                        {challenge.prize && <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Prize</span><span className="font-medium text-yellow-500">{challenge.prize}</span></div>}
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Leaderboard</p>
                          <div className="space-y-1">
                            {challenge.leaderboard.slice(0, 3).map((entry, index) => (
                              <div key={entry.userId} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2"><span className="text-muted-foreground">#{index + 1}</span><span className={entry.userId === currentUser.id ? 'font-bold text-blue-500' : ''}>{entry.username}</span></div>
                                <span className="font-medium">{entry.points} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {!isParticipant && challenge.status === 'active' && <Button onClick={() => handleJoinChallenge(challenge.id)} className="w-full mt-4" size="sm">Join Challenge</Button>}
                        {isAdmin && challenge.status === 'active' && (() => {
                          const myProgress = getChallengeProgress(challenge, currentUser.id);
                          const anyQualified = challenge.participants.some(uid => getChallengeProgress(challenge, uid).qualified);
                          return (
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Your progress:</span><span className={`font-bold ${myProgress.qualified ? 'text-green-500' : 'text-foreground'}`}>{myProgress.met} / {myProgress.required} days{myProgress.qualified && ' ✓'}</span></div>
                              <div className="w-full bg-muted rounded-full h-2"><div className={`h-2 rounded-full transition-all ${myProgress.qualified ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${Math.min((myProgress.met / myProgress.required) * 100, 100)}%` }} /></div>
                              <Button onClick={() => handleCompleteChallenge(challenge.id)} className="w-full" size="sm" disabled={!anyQualified}>{anyQualified ? 'Complete Challenge' : `Waiting (${myProgress.met}/${myProgress.required} days)`}</Button>
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader><CardTitle>Group Members ({group.memberCount})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.members.map(memberId => {
                  const member = storage.getAllUsers().find(u => u.id === memberId);
                  if (!member) return null;
                  const isGroupAdmin = group.admins.includes(memberId);
                  const isGroupCreator = group.creatorId === memberId;
                  return (
                    <div key={memberId} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">{member.username[0].toUpperCase()}</div>
                        <div>
                          <p className="font-medium flex items-center gap-2">@{member.username}{isGroupCreator && <Crown className="w-4 h-4 text-yellow-500" />}{isGroupAdmin && !isGroupCreator && <Shield className="w-4 h-4 text-blue-500" />}</p>
                          <p className="text-sm text-muted-foreground">{member.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{member.totalPoints} pts</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-4">
            {/* Edit Group Name & Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Group Settings
                  {!editingName ? (
                    <Button variant="outline" size="sm" onClick={() => { setEditGroupName(group.name); setEditGroupDesc(group.description); setEditingName(true); }}>
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveGroupInfo}><Save className="w-4 h-4 mr-1" />Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>Cancel</Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingName ? (
                  <>
                    <div><Label>Group Name</Label><Input value={editGroupName} onChange={e => setEditGroupName(e.target.value)} /></div>
                    <div><Label>Description</Label><Textarea value={editGroupDesc} onChange={e => setEditGroupDesc(e.target.value)} rows={3} /></div>
                  </>
                ) : (
                  <>
                    <div><Label className="text-muted-foreground text-xs">Name</Label><p className="font-medium">{group.name}</p></div>
                    <div><Label className="text-muted-foreground text-xs">Description</Label><p className="text-sm text-muted-foreground">{group.description || '—'}</p></div>
                  </>
                )}

                <div>
                  <Label>Invite Code</Label>
                  <div className="flex gap-2">
                    <Input value={group.inviteCode} readOnly />
                    <Button variant="outline" onClick={copyInviteCode}>{copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Share this code for instant joining</p>
                </div>

                {isCreator && group.type === 'paid' && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" />Earnings Overview</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Monthly Price:</span><span className="font-medium">${group.price}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Per Member (95%):</span><span className="font-medium text-green-500">${(group.price! * 0.95).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Total Members:</span><span className="font-medium">{group.memberCount}</span></div>
                      <div className="flex justify-between pt-2 border-t"><span className="font-semibold">Monthly Revenue:</span><span className="font-bold text-green-500">${((group.price! * 0.95) * group.memberCount).toFixed(2)}</span></div>
                    </div>
                    <Button onClick={() => navigate('/app/credits')} className="w-full mt-3" size="sm">View Credits & Withdraw</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Channel Management */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Channels</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {storage.getGroupChannels(group.id).map(ch => (
                    <div key={ch.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <span className="text-sm font-medium">#{ch.name}</span>
                      {!ch.isDefault && (
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteChannel(ch.id, ch.name)} className="text-red-500 hover:text-red-600 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {ch.isDefault && <Badge variant="outline" className="text-xs">default</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            {isCreator && (
              <Card className="border-red-500/30">
                <CardHeader><CardTitle className="text-red-500 flex items-center gap-2"><Trash2 className="w-4 h-4" />Danger Zone</CardTitle></CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={handleDeleteGroup} className="w-full">Delete Group Permanently</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Create Challenge Modal */}
      <Dialog open={showCreateChallengeModal} onOpenChange={setShowCreateChallengeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Group Challenge</DialogTitle><DialogDescription>Motivate your members with a competitive challenge</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Challenge Name</Label><Input placeholder="e.g., 7-Day Discipline Challenge" value={challengeName} onChange={e => setChallengeName(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea placeholder="What's the goal?" value={challengeDescription} onChange={e => setChallengeDescription(e.target.value)} rows={3} /></div>
            <div><Label>Duration (days)</Label><Input type="number" value={challengeDuration} onChange={e => setChallengeDuration(e.target.value)} min="1" max="90" /></div>
            <div>
              <Label>Prize (Optional)</Label>
              <Select value={challengePrize} onValueChange={setChallengePrize}>
                <SelectTrigger><SelectValue placeholder="Select prize..." /></SelectTrigger>
                <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="trophy">🏆 Trophy</SelectItem></SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateChallenge} className="w-full" disabled={!challengeName.trim()}><Target className="w-4 h-4 mr-2" />Create Challenge</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Requests Modal */}
      <Dialog open={showJoinRequestsModal} onOpenChange={setShowJoinRequestsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join Requests</DialogTitle>
            <DialogDescription>Approve or reject users who want to join</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {freshJoinRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending requests</p>
            ) : (
              freshJoinRequests.map(request => (
                <div key={request.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">@{request.username}</p>
                    <span className="text-xs text-muted-foreground">{new Date(request.timestamp).toLocaleDateString()}</span>
                  </div>
                  {request.message && <p className="text-sm text-muted-foreground mb-3">{request.message}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApproveRequest(request.id, request.userId)} className="flex-1 bg-green-600 hover:bg-green-700">Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.id)} className="flex-1">Reject</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
