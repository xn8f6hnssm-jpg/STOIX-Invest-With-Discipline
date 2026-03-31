import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { storage } from '../utils/storage';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function DebugStorage() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const currentUser = storage.getCurrentUser();
  const allRules = storage.getRules();
  const myRules = allRules.filter(r => r.userId === currentUser?.id);
  
  const allUserIdsInRules = [...new Set(allRules.map(r => r.userId))];
  
  const rawLocalStorage = {
    tradeforge_users: localStorage.getItem('tradeforge_users'),
    tradeforge_rules: localStorage.getItem('tradeforge_rules'),
    tradeforge_currentUser: localStorage.getItem('tradeforge_currentUser'),
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">🔍 Storage Debug Panel</h1>
          <p className="text-muted-foreground text-sm">Inspect all app storage data</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {/* Current User */}
        <Card>
          <CardHeader>
            <CardTitle>Current User</CardTitle>
          </CardHeader>
          <CardContent>
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="font-semibold min-w-24">ID:</span>
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{currentUser.id}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold min-w-24">Username:</span>
                  <span>{currentUser.username}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold min-w-24">Email:</span>
                  <span>{currentUser.email}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold min-w-24">User.rules:</span>
                  <span>{currentUser.rules?.length || 0} rules</span>
                </div>
              </div>
            ) : (
              <p className="text-destructive">❌ No current user found!</p>
            )}
          </CardContent>
        </Card>

        {/* Rules Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Rules Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="font-semibold min-w-48">Total rules in storage:</span>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{allRules.length}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-48">Rules for current user:</span>
                <span className={`font-mono text-sm px-2 py-1 rounded ${myRules.length > 0 ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                  {myRules.length}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-48">User IDs with rules:</span>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {allUserIdsInRules.length > 0 ? allUserIdsInRules.join(', ') : 'None'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Rules Detail */}
        <Card>
          <CardHeader>
            <CardTitle>My Rules ({myRules.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {myRules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-destructive text-lg font-semibold mb-2">❌ NO RULES FOUND</p>
                <p className="text-sm text-muted-foreground">
                  Current user ID: <span className="font-mono bg-muted px-2 py-1 rounded">{currentUser?.id}</span>
                </p>
                {allUserIdsInRules.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    But rules exist for: <span className="font-mono bg-muted px-2 py-1 rounded">{allUserIdsInRules.join(', ')}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {myRules.map((rule, index) => (
                  <div key={rule.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          {rule.isCritical && <span className="text-amber-500">⭐</span>}
                          <span className="font-semibold">{rule.title}</span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">{rule.tag}</span>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          ID: <span className="font-mono">{rule.id}</span> | 
                          User ID: <span className="font-mono">{rule.userId}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Rules (regardless of user) */}
        <Card>
          <CardHeader>
            <CardTitle>All Rules in Storage ({allRules.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {allRules.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No rules in storage at all</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allRules.map((rule, index) => (
                  <div key={rule.id} className="p-2 border rounded text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      {rule.isCritical && <span className="text-amber-500">⭐</span>}
                      <span className="font-semibold">{rule.title}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{rule.tag}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ml-auto ${rule.userId === currentUser?.id ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                        User: {rule.userId}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Raw LocalStorage */}
        <Card>
          <CardHeader>
            <CardTitle>Raw LocalStorage Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-semibold mb-1 text-sm">tradeforge_currentUser</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                  {rawLocalStorage.tradeforge_currentUser || '(empty)'}
                </pre>
              </div>
              <div>
                <p className="font-semibold mb-1 text-sm">tradeforge_rules</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-48 overflow-y-auto">
                  {rawLocalStorage.tradeforge_rules || '(empty)'}
                </pre>
              </div>
              <div>
                <p className="font-semibold mb-1 text-sm">tradeforge_users</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-48 overflow-y-auto">
                  {rawLocalStorage.tradeforge_users || '(empty)'}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
