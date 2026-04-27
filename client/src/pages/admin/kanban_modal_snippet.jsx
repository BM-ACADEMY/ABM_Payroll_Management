           <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-2xl h-10 px-6 text-xs gap-2 border-zinc-200 hover:bg-zinc-50 font-bold transition-all shadow-sm">
                <UserPlus className="w-4 h-4 text-zinc-400" /> Share
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-[40px] bg-white p-8 custom-scrollbar">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tighter text-zinc-900">Collaborators</DialogTitle>
                <DialogDescription className="font-medium text-zinc-500 text-sm">Manage who can access and edit this board.</DialogDescription>
              </DialogHeader>
              <div className="space-y-8 pt-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Current Access</h4>
                  <div className="space-y-3">
                    {boardData?.members?.map(m => {
                      const currentUserId = localStorage.getItem('userId');
                      const isBoardAdmin = boardData.admins.some(a => String(a._id || a) === String(m._id));
                      const isCurrentUserBoardAdmin = boardData.admins.some(a => String(a._id || a) === String(currentUserId));
                      const canRemove = true; // All members can manage participants as requested

                      return (
                        <div key={m._id} className="flex items-center gap-4 bg-zinc-50 p-4 rounded-3xl border border-zinc-100/50">
                          <div className="w-12 h-12 rounded-[20px] bg-white shadow-sm flex items-center justify-center text-zinc-900 font-black border border-zinc-100">{m.name.charAt(0)}</div>
                          <div className="flex-1">
                             <p className="text-sm font-black text-zinc-900">{m.name}</p>
                             <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{m.email}</p>
                          </div>
                          {isBoardAdmin && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[8px] font-black tracking-widest">ADMIN</Badge>}
                          
                          {canRemove && String(m._id) !== String(currentUserId) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveMember(m._id)}
                              className="h-9 w-9 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-2xl transition-all"
                              title="Remove Member"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-4 pt-8 border-t border-zinc-100">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Add New Members</h4>
                  <div className="space-y-4">
                     <div className="relative group/search">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within/search:text-black transition-colors" />
                       <Input 
                        placeholder={isAdmin ? "Search all members..." : "Search team members..."} 
                        value={userSearch} 
                        onChange={e => setUserSearch(e.target.value)}
                        className="rounded-[20px] h-12 pl-12 border-zinc-100 bg-zinc-50 focus:bg-white transition-all text-sm font-medium"
                       />
                     </div>
                     <div className="space-y-2">
                       {Array.isArray(allUsers) ? (
                         allUsers
                          .filter(u => {
                            const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
                            const notInBoard = !boardData?.members?.some(m => m._id === u._id);
                            
                            if (isAdmin) return matchesSearch && notInBoard;
                            
                            // If employee: Must be in the same team as the board
                            const isInSameTeam = u.teams?.some(t => String(t._id || t) === String(boardData?.team?._id || boardData?.team));
                            return matchesSearch && notInBoard && isInSameTeam;
                          })
                          .map(u => (
                            <div key={u._id} className="flex items-center justify-between p-4 rounded-[24px] hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all group/user">
                               <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-sm font-bold shadow-sm group-hover/user:bg-black group-hover/user:text-white transition-all">{u.name.charAt(0)}</div>
                                 <div className="flex flex-col">
                                   <span className="text-sm font-black text-zinc-900 leading-none mb-1">{u.name}</span>
                                   <span className="text-[10px] text-zinc-400 font-medium">{u.email}</span>
                                 </div>
                               </div>
                               <Button size="sm" onClick={() => handleAddMember(u._id)} className="h-9 rounded-xl bg-black text-[#fffe01] hover:bg-zinc-800 px-6 font-black text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">INVITE</Button>
                            </div>
                          ))
                       ) : (
                         <div className="text-center py-4 text-xs font-bold text-zinc-400">Loading members...</div>
                       )}
                       {userSearch && Array.isArray(allUsers) && allUsers.filter(u => {
                          const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase());
                          const notInBoard = !boardData?.members?.some(m => m._id === u._id);
                          if (isAdmin) return matchesSearch && notInBoard;
                          const isInSameTeam = u.teams?.some(t => String(t._id || t) === String(boardData?.team?._id || boardData?.team));
                          return matchesSearch && notInBoard && isInSameTeam;
                       }).length === 0 && (
                          <p className="text-center py-8 text-xs font-bold text-zinc-400 italic">No matching members found...</p>
                       )}
                     </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
