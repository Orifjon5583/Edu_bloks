import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, MoreVertical, Key, Copy, Check, Loader2 } from 'lucide-react';
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
import { User } from '@/types';
import { userApi, groupApi, branchApi } from '@/lib/api';

// Removed old generateCredentials function

export default function Students() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [credentials, setCredentials] = useState<{ login: string; password: string } | null>(null);
  const [copied, setCopied] = useState<'login' | 'password' | null>(null);

  // Password reset modal states
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => userApi.getAll('student'),
  });

  // Fetch groups
  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: groupApi.getAll,
  });

  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: branchApi.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsDialogOpen(false);
      setIsCredentialsDialogOpen(true);
      resetForm();
      setResetUser(null);
    },
    onError: () => {
      toast.error('O\'quvchi yaratishda xatolik');
    },
  });

  // Update mutation (for password reset)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> & { password?: string } }) =>
      userApi.update(id, data),
    onSuccess: () => {
      toast.success('Parol muvaffaqiyatli o\'zgartirildi');
      // setIsCredentialsDialogOpen(true);
    },
    onError: () => {
      toast.error('Parol tiklashda xatolik');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('O\'quvchi muvaffaqiyatli o\'chirildi');
    },
    onError: () => {
      toast.error('O\'quvchi o\'chirishda xatolik');
    },
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      student.login.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = filterGroup === 'all' || student.groupId === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const handleCreate = () => {
    if (firstName.trim() && lastName.trim() && selectedGroup) {
      const baseName = firstName.trim().toLowerCase().replace(/\s+/g, '');
      const generatedLogin = `${baseName}123`;
      const generatedPassword = `${baseName}123`;
      const creds = { login: generatedLogin, password: generatedPassword };
      
      setCredentials(creds);
      createMutation.mutate({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        login: creds.login,
        password: creds.password,
        role: 'student',
        groupId: selectedGroup,
        branchId: selectedBranch || undefined,
      });
    }
  };

  const handleOpenResetPassword = (student: User) => {
    setResetUser(student);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleResetPasswordSubmit = () => {
    if (!resetUser) return;
    
    // Check old password if available
    const actualOldPassword = (resetUser as any).password;
    if (actualOldPassword && oldPassword !== actualOldPassword) {
      toast.error('Eski parol noto\'g\'ri!');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Yangi parollar mos tushmadi!');
      return;
    }

    if (newPassword.length < 3) {
      toast.error('Yangi parol juda qisqa!');
      return;
    }

    updateMutation.mutate({
      id: resetUser.id,
      data: { password: newPassword },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Siz haqiqatan ham ushbu o\'quvchini o\'chirmoqchimisiz?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setSelectedGroup('');
    setSelectedBranch('');
  };

  const copyToClipboard = (text: string, type: 'login' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // Calculate real progress from studentAssignments
  const getProgress = (student: User) => {
    const assignments = (student as any).studentAssignments;
    if (!assignments || assignments.length === 0) {
      return 0;
    }

    // Count completed assignments (PASSED or SUBMITTED)
    const completed = assignments.filter(
      (a: { status: string }) => a.status === 'PASSED' || a.status === 'SUBMITTED'
    ).length;

    return Math.round((completed / assignments.length) * 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-success';
    if (progress >= 50) return 'bg-warning';
    return 'bg-destructive';
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
            <h1 className="text-2xl lg:text-3xl font-bold">O'quvchilar</h1>
            <p className="text-muted-foreground mt-1">Platforma o'quvchilarini boshqarish</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                O'quvchi qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>O'quvchi qo'shish</DialogTitle>
                <DialogDescription>
                  O'quvchi ma'lumotlarini to'ldiring. Login va parol avtomatik tarzda yaratiladi.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ism</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ismni kiriting"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Familiya</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Familiyani kiriting"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Guruh</Label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Guruhni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
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
                  onClick={handleCreate}
                  disabled={!firstName.trim() || !lastName.trim() || !selectedGroup || isLoadingAction}
                >
                  {isLoadingAction && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Yaratish
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Credentials Modal */}
        <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kirish ma'lumotlari</DialogTitle>
              <DialogDescription>
                Ushbu ma'lumotlarni saqlang — parol faqat bir marta ko'rsatiladi
              </DialogDescription>
            </DialogHeader>
            {credentials && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Login</Label>
                  <div className="flex gap-2">
                    <Input value={credentials.login} readOnly />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(credentials.login, 'login')}
                    >
                      {copied === 'login' ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Parol</Label>
                  <div className="flex gap-2">
                    <Input value={credentials.password} readOnly />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(credentials.password, 'password')}
                    >
                      {copied === 'password' ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setIsCredentialsDialogOpen(false)}
                >
                  Yopish
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reset Password Modal */}
        <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Parolni o'zgartirish</DialogTitle>
              <DialogDescription>
                Foydalanuvchi parolini o'zgartirish uchun ma'lumotlarni kiriting.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Eski parol</Label>
                <Input
                  id="oldPassword"
                  type="text"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Eski parolni kiriting"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Yangi parol</Label>
                <Input
                  id="newPassword"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yangi parolni kiriting"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Yangi parolni takrorlang</Label>
                <Input
                  id="confirmPassword"
                  type="text"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Yangi parolni qayta kiriting"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleResetPasswordSubmit}
                disabled={!oldPassword || !newPassword || !confirmPassword || updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Saqlash
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="O'quvchilarni qidirish..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Barcha guruhlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha guruhlar</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              O'quvchilar ro'yxati ({filteredStudents.length})
              {isLoadingStudents && <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>F.I.Sh</TableHead>
                    <TableHead>Parol</TableHead>
                    <TableHead>Guruh</TableHead>
                    <TableHead>Filial</TableHead>
                    <TableHead>O'qituvchi</TableHead>
                    <TableHead>Rivojlanish</TableHead>
                    <TableHead className="w-[100px]">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => {
                    const progress = getProgress(student);
                    // Find group/branch names from loaded data if not present in student object
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const groupName = (student as any).group?.name || groups.find(g => g.id === student.groupId)?.name;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const branchName = (student as any).branch?.name || branches.find(b => b.id === student.branchId)?.name;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const teacher = (student as any).group?.teacher;
                    const teacherName = teacher ? `${teacher.lastName} ${teacher.firstName}` : '—';

                    return (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.lastName} {student.firstName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{student.login}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {(student as any).password || '—'}
                        </TableCell>
                        <TableCell>
                          {groupName ? (
                            <Badge variant="secondary">{groupName}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Tayinlanmagan</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {branchName ? (
                            <span className="text-muted-foreground">{branchName}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{teacherName}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getProgressColor(progress)} transition-all`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{progress}%</span>
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
                              <DropdownMenuItem onClick={() => handleOpenResetPassword(student)}>
                                <Key className="w-4 h-4 mr-2" />
                                Parolni o'zgartirish
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(student.id)}
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
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        O'quvchilar topilmadi
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
