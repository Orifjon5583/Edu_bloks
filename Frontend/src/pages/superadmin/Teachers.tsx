import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, MoreVertical, Key, Copy, Check, Loader2, Edit } from 'lucide-react';
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
import { User } from '@/types';
import { userApi, authApi } from '@/lib/api';



export default function Teachers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [credentials, setCredentials] = useState<{ login: string; password: string } | null>(null);
  const [copied, setCopied] = useState<'login' | 'password' | null>(null);

  // Password reset modal states
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch teachers
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => userApi.getAll('admin'),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      // Don't show success toast here, credentials dialog is enough confirmation
      setIsDialogOpen(false);
      setIsCredentialsDialogOpen(true);
      setFirstName('');
      setLastName('');
      setResetUser(null);
    },
    onError: () => {
      toast.error('O\'qituvchi yaratishda xatolik');
    },
  });

  // Update mutation (for password reset)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> & { password?: string } }) =>
      userApi.update(id, data),
    onSuccess: () => {
      toast.success('Parol muvaffaqiyatli o\'zgartirildi');
      // No need to show credentials dialog again if manually changed
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
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('O\'qituvchi muvaffaqiyatli o\'chirildi');
    },
    onError: () => {
      toast.error('O\'qituvchi o\'chirishda xatolik');
    },
  });

  const filteredTeachers = teachers.filter(teacher =>
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    teacher.login.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (firstName.trim() && lastName.trim()) {
      try {
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
          role: 'admin',
        });
      } catch (error) {
        toast.error('Hisob ma\'lumotlarini yaratishda xatolik');
      }
    }
  };



  const handleOpenResetPassword = (teacher: User) => {
    setResetUser(teacher);
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
    if (confirm('Siz haqiqatan ham ushbu o\'qituvchini o\'chirmoqchimisiz?')) {
      deleteMutation.mutate(id);
    }
  };

  const copyToClipboard = (text: string, type: 'login' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
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
            <h1 className="text-2xl lg:text-3xl font-bold">O'qituvchilar</h1>
            <p className="text-muted-foreground mt-1">Platforma o'qituvchilarini boshqarish</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                O'qituvchi qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>O'qituvchi qo'shish</DialogTitle>
                <DialogDescription>
                  O'qituvchi ma'lumotlarini to'ldiring. Login va parol avtomatik tarzda yaratiladi.
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

                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={!firstName.trim() || !lastName.trim() || createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="O'qituvchilarni qidirish..."
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
              O'qituvchilar ro'yxati ({filteredTeachers.length})
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
                    <TableHead>F.I.Sh</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Parol</TableHead>
                    <TableHead>Guruhlar</TableHead>
                    <TableHead>Qo'shilgan sana</TableHead>
                    <TableHead className="w-[100px]">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher, index) => (
                    <motion.tr
                      key={teacher.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b"
                    >
                      <TableCell className="font-medium">
                        {teacher.lastName} {teacher.firstName}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {teacher.login}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {(teacher as any).password || '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="p-0 h-auto font-normal"
                          onClick={() => {
                            // Navigate to groups page with teacher's name in search
                            // implementation depends on router, here just explaining
                            window.location.href = `/sa/groups`;
                          }}
                        >
                          {(teacher as any)._count?.teacherGroups || 0}
                        </Button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(teacher.createdAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">

                            <DropdownMenuItem onClick={() => handleOpenResetPassword(teacher)}>
                              <Key className="w-4 h-4 mr-2" />
                              Parolni o'zgartirish
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(teacher.id)}
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
                  {filteredTeachers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        O'qituvchilar topilmadi
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
