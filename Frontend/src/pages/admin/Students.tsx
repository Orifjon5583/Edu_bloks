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
import { userApi, groupApi, authApi } from '@/lib/api';



export default function AdminStudents() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [filterGroup, setFilterGroup] = useState<string>('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [credentials, setCredentials] = useState<{ login: string; password: string } | null>(null);
    const [copied, setCopied] = useState<'login' | 'password' | null>(null);

    // Fetch students (Teacher sees all students in their branch/groups)
    // Note: userApi.getAll('student') for ADMIN role should return relevant students
    const { data: students = [], isLoading: isLoadingStudents } = useQuery({
        queryKey: ['students-admin'],
        queryFn: () => userApi.getAll('student'),
    });

    // Fetch teacher's groups
    const { data: groups = [] } = useQuery({
        queryKey: ['groups-admin'],
        queryFn: groupApi.getTeacherGroups,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: userApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students-admin'] });
            setIsDialogOpen(false);
            setIsCredentialsDialogOpen(true);
            resetForm();
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
            toast.success('Parol muvaffaqiyatli tiklandi');
            setIsCredentialsDialogOpen(true);
        },
        onError: () => {
            toast.error('Parol tiklashda xatolik');
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: userApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students-admin'] });
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
        // Filter by group if selected, otherwise show all accessible students
        const matchesGroup = filterGroup === 'all' || student.groupId === filterGroup;
        return matchesSearch && matchesGroup;
    });

    const handleCreate = async () => {
        if (firstName.trim() && lastName.trim() && selectedGroup) {
            try {
                const creds = await authApi.generateCredentials('STUDENT');
                setCredentials(creds);
                createMutation.mutate({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    login: creds.login,
                    password: creds.password,
                    role: 'student',
                    groupId: selectedGroup,
                    // Branch ID is handled by backend based on teacher's branch or group's branch
                });
            } catch (error) {
                toast.error('Hisob ma\'lumotlarini yaratishda xatolik');
            }
        }
    };

    const handleResetPassword = async (student: User) => {
        try {
            const { password: newPassword } = await authApi.generatePassword();
            setCredentials({ login: student.login, password: newPassword });
            updateMutation.mutate({
                id: student.id,
                data: { password: newPassword },
            });
        } catch (error) {
            toast.error('Parol yaratishda xatolik');
        }
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
    };

    const copyToClipboard = (text: string, type: 'login' | 'password') => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const getProgress = (student: User) => {
        // Calculate progress from studentAssignments if available
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
        <DashboardLayout role="admin">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold">Mening O'quvchilarim</h1>
                        <p className="text-muted-foreground mt-1">Guruhlaringizdagi o'quvchilarni boshqarish</p>
                    </div>
                    {/* Add Student button removed for teachers */}
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
                                        <TableHead>Guruh</TableHead>
                                        <TableHead>Rivojlanish</TableHead>
                                        <TableHead className="w-[100px]">Amallar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map((student, index) => {
                                        const progress = getProgress(student);
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const groupName = (student as any).group?.name || groups.find(g => g.id === student.groupId)?.name;

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
                                                <TableCell>
                                                    {groupName ? (
                                                        <Badge variant="secondary">{groupName}</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">Tayinlanmagan</span>
                                                    )}
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
                                                            <DropdownMenuItem onClick={() => handleResetPassword(student)}>
                                                                <Key className="w-4 h-4 mr-2" />
                                                                Parolni tiklash
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
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
