import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreVertical, Users, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Group } from '@/types';
import { groupApi, branchApi, userApi } from '@/lib/api';

export default function Groups() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // Fetch groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: groupApi.getAll,
  });

  // Fetch teachers (users with role ADMIN)
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => userApi.getAll('admin'),
  });

  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: branchApi.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; teacherId?: string; branchId?: string }) =>
      groupApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Guruh muvaffaqiyatli yaratildi');
      resetForm();
    },
    onError: () => {
      toast.error('Guruh yaratishda xatolik');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; teacherId: string; branchId: string }> }) =>
      groupApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Guruh muvaffaqiyatli yangilandi');
      resetForm();
    },
    onError: () => {
      toast.error('Guruh yangilashda xatolik');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: groupApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Guruh muvaffaqiyatli o\'chirildi');
    },
    onError: () => {
      toast.error('Guruh o\'chirishda xatolik');
    },
  });

  const filteredGroups = groups.filter(group => {
    const teacherName = group.teacher?.firstName && group.teacher?.lastName
      ? `${group.teacher.lastName} ${group.teacher.firstName}`
      : '';

    return (
      group.name.toLowerCase().includes(search.toLowerCase()) ||
      teacherName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCreate = () => {
    if (newGroupName.trim() && selectedTeacher) {
      createMutation.mutate({
        name: newGroupName.trim(),
        teacherId: selectedTeacher,
        branchId: selectedBranch || undefined,
      });
    }
  };

  const handleEdit = () => {
    if (editingGroup && newGroupName.trim() && selectedTeacher) {
      updateMutation.mutate({
        id: editingGroup.id,
        data: {
          name: newGroupName.trim(),
          teacherId: selectedTeacher,
          branchId: selectedBranch || '', // Send empty string if no branch selected
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Siz haqiqatan ham ushbu guruhni o\'chirmoqchimisiz?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (group: Group) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setSelectedTeacher(group.teacherId || '');
    setSelectedBranch(group.branchId || '');
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingGroup(null);
    setNewGroupName('');
    setSelectedTeacher('');
    setSelectedBranch('');
    setIsDialogOpen(false);
  };

  const isLoadingAction = createMutation.isPending || updateMutation.isPending;

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
            <h1 className="text-2xl lg:text-3xl font-bold">Guruhlar</h1>
            <p className="text-muted-foreground mt-1">O'quv guruhlarini boshqarish</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Guruh yaratish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGroup ? 'Guruhni tahrirlash' : 'Guruh yaratish'}
                </DialogTitle>
                <DialogDescription>
                  {editingGroup ? 'Guruh ma\'lumotlarini o\'zgartiring' : 'Yangi guruh haqida ma\'lumot to\'ldiring'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Guruh nomi</Label>
                  <Input
                    id="name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Masalan: Python Junior"
                  />
                </div>

                <div className="space-y-2">
                  <Label>O'qituvchi</Label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger>
                      <SelectValue placeholder="O'qituvchini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.lastName} {teacher.firstName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Filial (ixtiyoriy)</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filialni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-branch">Filialsiz</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={editingGroup ? handleEdit : handleCreate}
                  disabled={!newGroupName.trim() || !selectedTeacher || isLoadingAction}
                >
                  {isLoadingAction && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingGroup ? 'Saqlash' : 'Yaratish'}
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
                placeholder="Guruhlarni qidirish..."
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
              Guruhlar ro'yxati ({filteredGroups.length})
              {isLoadingGroups && <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingGroups ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>O'qituvchi</TableHead>
                    <TableHead>Filial</TableHead>
                    <TableHead>O'quvchilar</TableHead>
                    <TableHead className="w-[100px]">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group, index) => (
                    <motion.tr
                      key={group.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b"
                    >
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>
                        {group.teacher ? `${group.teacher.lastName} ${group.teacher.firstName}` : <span className="text-muted-foreground">Tayinlanmagan</span>}
                      </TableCell>
                      <TableCell>
                        {group.branch ? (
                          <Badge variant="secondary">{group.branch.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {group._count?.students || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(group)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Tahrirlash
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(group.id)}
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
                  {filteredGroups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Guruhlar topilmadi
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
