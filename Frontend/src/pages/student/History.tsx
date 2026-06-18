import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle, BookOpen, Loader2, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AssignmentType } from '@/types';
import { studentApi } from '@/lib/api';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    SUBMITTED: { label: 'Yuborilgan', color: 'bg-warning/10 text-warning', icon: CheckCircle2 },
    PASSED: { label: 'Bajarilgan', color: 'bg-success/10 text-success', icon: CheckCircle2 },
    FAILED: { label: 'Topshirilmadi', color: 'bg-destructive/10 text-destructive', icon: AlertCircle },
};

const typeLabels: Record<AssignmentType, { label: string; icon: string }> = {
    QUIZ: { label: 'Test', icon: '📝' },
    SCRATCH_BLOCKS: { label: 'Scratch', icon: '🧩' },
    PYTHON_BLOCKS: { label: 'Python', icon: '🐍' },
};

export default function StudentHistory() {
    const navigate = useNavigate();

    const { data: assignments = [], isLoading } = useQuery({
        queryKey: ['student-assignments-history'],
        queryFn: studentApi.getMyAssignments,
    });

    // Filter only completed or submitted assignments
    const historyAssignments = assignments.filter(a =>
        ['SUBMITTED', 'PASSED', 'FAILED'].includes(a.status)
    );

    return (
        <DashboardLayout role="student">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">Vazifalar tarixi</h1>
                    <p className="text-muted-foreground mt-1">Bajarilgan ishlaringiz arxivi</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {historyAssignments.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Tarix bo'sh. Siz hali biron bir vazifani yakunlamadingiz.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            historyAssignments.map((studentAssignment, index) => {
                                const assignmentDetails = studentAssignment.assignment;
                                if (!assignmentDetails) return null;

                                const config = statusConfig[studentAssignment.status] || statusConfig['SUBMITTED'];
                                const typeInfo = typeLabels[assignmentDetails.type];

                                return (
                                    <motion.div
                                        key={studentAssignment.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="card-hover cursor-pointer" onClick={() => navigate(`/student/assignments/${studentAssignment.assignmentId}`)}>
                                            <CardContent className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-secondary/10`}>
                                                        {typeInfo.icon}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <h3 className="font-semibold truncate">{assignmentDetails.title}</h3>
                                                            <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                                                            <Badge className={config.color} variant="secondary">{config.label}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            {studentAssignment.completedAt && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {new Date(studentAssignment.completedAt).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            {studentAssignment.score !== undefined && (
                                                                <span>Natija: {studentAssignment.score}%</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Button variant="ghost" size="sm">
                                                        Ko'rish
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                )}
            </motion.div>
        </DashboardLayout>
    );
}
