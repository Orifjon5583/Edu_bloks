import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle, BookOpen, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AssignmentType } from '@/types';
import { studentApi, authApi, statsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ProfileStats from '@/components/gamification/ProfileStats';
import Leaderboard from '@/components/gamification/Leaderboard';
import { StudentProgressChart } from '@/components/analytics/AnalyticsCharts';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  NEW: { label: 'Yangi', color: 'bg-primary/10 text-primary', icon: BookOpen },
  PENDING: { label: 'Yangi', color: 'bg-primary/10 text-primary', icon: BookOpen },
  IN_PROGRESS: { label: 'Jarayonda', color: 'bg-info/10 text-info', icon: Clock },
  SUBMITTED: { label: 'Yuborilgan', color: 'bg-warning/10 text-warning', icon: CheckCircle2 },
  PASSED: { label: 'Bajarilgan', color: 'bg-success/10 text-success', icon: CheckCircle2 },
  FAILED: { label: 'Bajarilmadi', color: 'bg-destructive/10 text-destructive', icon: AlertCircle },
  OVERDUE: { label: 'Muddati o\'tgan', color: 'bg-destructive/10 text-destructive', icon: AlertCircle },
};

const typeLabels: Record<AssignmentType, { label: string; icon: string }> = {
  QUIZ: { label: 'Test', icon: '📝' },
  SCRATCH_BLOCKS: { label: 'Scratch', icon: '🧩' },
  PYTHON_BLOCKS: { label: 'Python', icon: '🐍' },
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Initial user data

  // Fetch fresh user data for Gamification stats
  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getCurrentUser,
    initialData: user, // Fallback to context user
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: studentApi.getMyAssignments,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['student-progress'],
    queryFn: statsApi.getStudentProgress,
  });

  const getDueInText = (dateStr?: Date | string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Muddati o\'tgan';
    if (diffDays === 0) return 'Bugun';
    if (diffDays === 1) return 'Ertaga';
    return `${diffDays} kun`;
  };

  return (
    <DashboardLayout role="student">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Gamification Stats */}
        {currentUser && (
          <ProfileStats
            xp={currentUser.xp || 0}
            level={currentUser.level || 1}
            firstName={currentUser.firstName}
            lastName={currentUser.lastName}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content: Assignments */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Mening vazifalarim</h1>
              <p className="text-muted-foreground mt-1">Vazifalarni bajaring va rivojlanishni kuzating</p>
            </div>

            {progress.length > 0 && (
              <StudentProgressChart data={progress} />
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4">
                {assignments.map((studentAssignment, index) => {
                  const assignmentDetails = studentAssignment.assignment;
                  if (!assignmentDetails) return null;

                  const config = statusConfig[studentAssignment.status] || statusConfig['PENDING'];
                  const typeInfo = typeLabels[assignmentDetails.type];
                  const dueText = getDueInText(assignmentDetails.dueAt);

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
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${assignmentDetails.type === 'QUIZ' ? 'bg-primary/10' :
                              assignmentDetails.type === 'PYTHON_BLOCKS' ? 'bg-info/10' : 'bg-accent/10'
                              }`}>
                              {typeInfo.icon}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold truncate">{assignmentDetails.title}</h3>
                                <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                                <Badge className={config.color} variant="secondary">{config.label}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {dueText && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" /> {dueText}
                                  </span>
                                )}
                                {studentAssignment.score !== undefined && studentAssignment.status !== 'PENDING' && studentAssignment.status !== 'IN_PROGRESS' && (
                                  <span>Natija: {studentAssignment.score}%</span>
                                )}
                              </div>
                            </div>

                            <Button>
                              {studentAssignment.status === 'PENDING' ? 'Boshlash' :
                                studentAssignment.status === 'IN_PROGRESS' ? 'Davom ettirish' : 'Ko\'rish'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}

                {assignments.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Sizda hozircha vazifalar yo'q</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
