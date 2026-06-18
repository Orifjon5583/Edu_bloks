import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Branch } from '@/types';
import { branchApi } from '@/lib/api';

export default function Branches() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Fetch branches
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: branchApi.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: branchApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Filial muvaffaqiyatli yaratildi');
      setNewBranchName('');
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error('Filial yaratishda xatolik');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      branchApi.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Filial muvaffaqiyatli yangilandi');
      setEditingBranch(null);
      setNewBranchName('');
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error('Filial yangilashda xatolik');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: branchApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Filial muvaffaqiyatli o\'chirildi');
    },
    onError: () => {
      toast.error('Filial o\'chirishda xatolik');
    },
  });

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (newBranchName.trim()) {
      createMutation.mutate({ name: newBranchName.trim() });
    }
  };

  const handleEdit = () => {
    if (editingBranch && newBranchName.trim()) {
      updateMutation.mutate({
        id: editingBranch.id,
        name: newBranchName.trim(),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Siz haqiqatan ham ushbu filialni o\'chirmoqchimisiz?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setNewBranchName(branch.name);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingBranch(null);
    setNewBranchName('');
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout role="superadmin">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Filiallar</h1>
            <p className="text-muted-foreground mt-1">Tashkilot filiallarini boshqarish</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Filial qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBranch ? 'Filialni tahrirlash' : 'Filial qo\'shish'}
                </DialogTitle>
                <DialogDescription>
                  {editingBranch ? 'Filial nomini o\'zgartiring' : 'Yangi filial nomini kiriting'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="Filial nomini kiriting"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={editingBranch ? handleEdit : handleCreate}
                  disabled={!newBranchName.trim() || createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingBranch ? 'Saqlash' : 'Yaratish'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filiallarni qidirish..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Filiallar ro'yxati ({filteredBranches.length})
              {isLoading && <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Yaratilgan sana</TableHead>
                    <TableHead className="w-[100px]">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map((branch, index) => (
                    <motion.tr
                      key={branch.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b"
                    >
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(branch.createdAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(branch)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Tahrirlash
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(branch.id)}
                              className="text-destructive"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              O'chirish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {filteredBranches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Filiallar topilmadi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
