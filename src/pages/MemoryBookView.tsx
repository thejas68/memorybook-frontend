import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Plus, ArrowLeft, Users, Trash2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { booksApi, pagesApi, reactionsApi } from '../lib/api';

const EMOJIS = ['❤️', '😍', '🥹', '✨', '🔥', '👏'];

const MemoryBookView = () => {
  const { id: bookId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // New page form
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageText, setNewPageText] = useState('');
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  // Invite member form
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookData, pagesData] = await Promise.all([
          booksApi.getOne(bookId!),
          pagesApi.getAll(bookId!),
        ]);
        setBook(bookData);
        setPages(pagesData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [bookId]);

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) return;
    setIsCreatingPage(true);
    try {
      const page = await pagesApi.create(bookId!, newPageTitle, {
        text: newPageText,
      });
      setPages((prev) => [...prev, page]);
      setNewPageTitle('');
      setNewPageText('');
      setPageDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreatingPage(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    try {
      await pagesApi.delete(bookId!, pageId);
      setPages((prev) => prev.filter((p) => p.id !== pageId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReaction = async (pageId: string, emoji: string) => {
    try {
      const reaction = await reactionsApi.add(pageId, emoji);
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId
            ? { ...p, reactions: [...(p.reactions || []), reaction] }
            : p
        )
      );
    } catch {
      // Already reacted — ignore
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteSuccess('');
    try {
      await booksApi.inviteMember(bookId!, inviteEmail, inviteRole);
      setInviteSuccess(`${inviteEmail} has been invited!`);
      setInviteEmail('');
      // Refresh book to show new member
      const bookData = await booksApi.getOne(bookId!);
      setBook(bookData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const getUserRole = () => {
    if (!book || !user) return 'viewer';
    const member = book.members?.find((m: any) => m.userId === user.id);
    return member?.role || 'viewer';
  };

  const canAddPages = ['owner', 'contributor'].includes(getUserRole());
  const isOwner = getUserRole() === 'owner';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading your book...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-body">Book not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">
              {book.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Members count */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground font-body">
              <Users className="h-4 w-4" />
              {book.members?.length} members
            </div>

            {/* Invite button — owners only */}
            {isOwner && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4" /> Invite
                  </Button>
                </DialogTrigger>
                <DialogContent className="paper-texture">
                  <DialogHeader>
                    <DialogTitle>Invite someone to this book</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="font-body">Their Email</Label>
                      <Input
                        placeholder="friend@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="font-body"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body">Role</Label>
                      <select
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm font-body bg-background"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                      >
                        <option value="viewer">Viewer — can only read</option>
                        <option value="contributor">Contributor — can add pages</option>
                      </select>
                    </div>
                    {inviteSuccess && (
                      <p className="text-green-600 text-sm font-body">{inviteSuccess}</p>
                    )}
                    {error && (
                      <p className="text-destructive text-sm font-body">{error}</p>
                    )}
                    <Button
                      variant="warm"
                      className="w-full"
                      onClick={handleInvite}
                      disabled={isInviting || !inviteEmail.trim()}
                    >
                      {isInviting ? 'Inviting...' : 'Send Invite'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Add page button */}
            {canAddPages && (
              <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="warm" size="sm">
                    <Plus className="h-4 w-4" /> Add Page
                  </Button>
                </DialogTrigger>
                <DialogContent className="paper-texture">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Add a new page</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="font-body">Page Title</Label>
                      <Input
                        placeholder="e.g., Day 1 at the beach"
                        value={newPageTitle}
                        onChange={(e) => setNewPageTitle(e.target.value)}
                        className="font-body"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body">Your Memory</Label>
                      <Textarea
                        placeholder="Write about this memory..."
                        value={newPageText}
                        onChange={(e) => setNewPageText(e.target.value)}
                        className="font-body min-h-[120px]"
                      />
                    </div>
                    <Button
                      variant="warm"
                      className="w-full"
                      onClick={handleCreatePage}
                      disabled={isCreatingPage || !newPageTitle.trim()}
                    >
                      {isCreatingPage ? 'Saving...' : 'Save Page'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Empty state */}
        {pages.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No pages yet</h2>
            <p className="text-muted-foreground font-body mb-6">
              Add your first memory to this book
            </p>
            {canAddPages && (
              <Button variant="warm" onClick={() => setPageDialogOpen(true)}>
                <Plus className="h-4 w-4" /> Add First Page
              </Button>
            )}
          </div>
        )}

        {/* Pages */}
        <div className="space-y-6">
          {pages.map((page, index) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="paper-texture rounded-2xl p-6 page-shadow"
            >
              {/* Page header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs text-muted-foreground font-body">
                    Page {page.pageNumber}
                  </span>
                  <h2 className="text-2xl font-bold text-foreground">{page.title}</h2>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    by {page.author?.profile?.displayName || 'Unknown'} ·{' '}
                    {new Date(page.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {/* Delete — only author can delete */}
                {page.authorId === user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePage(page.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Page content */}
              {page.content?.text && (
                <p className="text-foreground font-body leading-relaxed mb-6 whitespace-pre-wrap">
                  {page.content.text}
                </p>
              )}

              {/* Reactions */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {EMOJIS.map((emoji) => {
                    const count = page.reactions?.filter(
                      (r: any) => r.emoji === emoji
                    ).length || 0;
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(page.id, emoji)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all ${
                          count > 0
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-border hover:border-primary/30 hover:bg-primary/5'
                        }`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && (
                          <span className="text-xs text-muted-foreground">{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MemoryBookView;