import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Check, X, Search, Filter } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { assignmentApi, studentApi } from '@/lib/api';
import { toast } from 'sonner';

export default function SubmissionReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [feedback, setFeedback] = useState('');
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    // Fetch Assignment Details
    const { data: assignment } = useQuery({
        queryKey: ['assignment', id],
        queryFn: () => assignmentApi.getById(id!),
        enabled: !!id,
    });

    // Fetch Results
    const { data: results = [], isLoading } = useQuery({
        queryKey: ['assignment-results', id],
        queryFn: () => assignmentApi.getResults(id!),
        enabled: !!id,
    });

    // Mutation for sending feedback
    const feedbackMutation = useMutation({
        mutationFn: (data: { studentAssignmentId: string; feedback: string }) =>
            studentApi.giveFeedback(data.studentAssignmentId, data.feedback),
        onSuccess: () => {
            toast.success("Muvaffaqiyatli saqlandi");
            setIsFeedbackOpen(false);
            setFeedback('');
            queryClient.invalidateQueries({ queryKey: ['assignment-results', id] });
        },
        onError: () => {
            toast.error("Xatolik yuz berdi");
        }
    });

    const handleOpenFeedback = (item: any) => {
        setSelectedStudent(item);
        setFeedback(item.feedback || '');
        setIsFeedbackOpen(true);
    };

    const handleSaveFeedback = () => {
        if (!selectedStudent) return;
        feedbackMutation.mutate({
            studentAssignmentId: selectedStudent.id,
            feedback
        });
    };

    const filteredResults = results.filter(item => {
        const matchesSearch =
            item.student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.student.lastName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusColors: Record<string, string> = {
        NEW: 'bg-gray-100 text-gray-800',
        IN_PROGRESS: 'bg-blue-100 text-blue-800',
        SUBMITTED: 'bg-yellow-100 text-yellow-800',
        PASSED: 'bg-green-100 text-green-800',
        FAILED: 'bg-red-100 text-red-800',
        OVERDUE: 'bg-red-100 text-red-800',
    };

    if (isLoading) return <div>Yuklanmoqda...</div>;

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/assignments')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{assignment?.title} - Natijalar</h1>
                        <p className="text-muted-foreground">O'quvchilar natijalari va fikrlar</p>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="O'quvchini izlash..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Barchasi</SelectItem>
                            <SelectItem value="NEW">Yangi</SelectItem>
                            <SelectItem value="PASSED">Bajarilgan</SelectItem>
                            <SelectItem value="FAILED">Bajarilmagan</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">O'quvchi</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Guruh</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Urinishlar</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ball / 100</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Qoida buzishlar</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Harakatlar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResults.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                                Natijalar topilmadi
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredResults.map((item) => (
                                            <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle font-medium">
                                                    {item.student.firstName} {item.student.lastName}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {item.student.group?.name || '-'}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant="secondary" className={statusColors[item.status]}>
                                                        {item.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle text-center">
                                                    {item.attempts}
                                                </td>
                                                <td className="p-4 align-middle font-bold">
                                                    {item.bestScore !== null ? item.bestScore : '-'}
                                                </td>
                                                <td className="p-4 align-middle text-center">
                                                    {item.cheatWarnings > 0 ? (
                                                        <Badge variant="destructive">{item.cheatWarnings} marta</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenFeedback(item)}
                                                        className="gap-2"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                        {item.feedback ? 'Tahrirlash' : 'Izoh yozish'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>O'qituvchi izohi</DialogTitle>
                            <CardDescription>
                                {selectedStudent?.student.firstName} {selectedStudent?.student.lastName} uchun izoh qoldiring.
                            </CardDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Textarea
                                placeholder="Masalan: Ajoyib natija, lekin testlarga e'tiborliroq bo'ling..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsFeedbackOpen(false)}>Bekor qilish</Button>
                            <Button onClick={handleSaveFeedback} disabled={feedbackMutation.isPending}>
                                {feedbackMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
