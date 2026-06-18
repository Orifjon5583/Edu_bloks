import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Users, Clock, TrendingUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { statsApi, assignmentApi } from '@/lib/api';
import { GroupPerformanceChart } from '@/components/analytics/AnalyticsCharts';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: statsApi.getAdminStats,
  });

  // Fetch teacher analytics
  const { data: analytics = [] } = useQuery({
    queryKey: ['teacher-analytics'],
    queryFn: statsApi.getTeacherAnalytics,
  });

  // Fetch recent assignments
  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentApi.getAll(),
  });

  const recentAssignments = assignments.slice(0, 3);

  // Calculate stats by type
  const quizCount = assignments.filter(a => a.type === 'QUIZ').length;
  const scratchCount = assignments.filter(a => a.type === 'SCRATCH_BLOCKS').length;
  const pythonCount = assignments.filter(a => a.type === 'PYTHON_BLOCKS').length;
  const totalCount = assignments.length || 1; // avoid division by zero

  const quizPercent = Math.round((quizCount / totalCount) * 100);
  const scratchPercent = Math.round((scratchCount / totalCount) * 100);
  const pythonPercent = Math.round((pythonCount / totalCount) * 100);

  const getDueInText = (dateStr: Date | string) => {
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
    <DashboardLayout role="admin">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">O'qituvchi paneli</h1>
            <p className="text-muted-foreground mt-1">Vazifalarni boshqarish va o'quvchilar rivojlanishini kuzatish</p>
          </div>

          <Button onClick={() => navigate('/admin/assignments/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Vazifa yaratish
          </Button>
        </motion.div>

        {/* Stats cards */}
        {isLoadingStats ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={BookOpen}
              label="Barcha vazifalar"
              value={assignments.length} // Use loaded assignments count or stats.totalAssignments if available (API doesn't return totalAssignments for admin stats yet explicitly, let's use list length)
              color="primary"
            />
            <StatsCard
              icon={Clock}
              label="Faol"
              value={stats.activeAssignments}
              color="info"
            />
            <StatsCard
              icon={Users}
              label="O'quvchilar"
              value={stats.totalStudents}
              color="success"
            />
            <StatsCard
              icon={TrendingUp}
              label="Bajarilish"
              value={`${stats.completionRate}%`}
              color="warning"
            />
          </motion.div>
        ) : null}

        {/* Analytics Chart */}
        {analytics.length > 0 && (
          <motion.div variants={itemVariants}>
            <GroupPerformanceChart data={analytics} />
          </motion.div>
        )}

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Assignments */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>So'nggi vazifalar</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/assignments')}>
                  Barcha vazifalar
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingAssignments ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : (
                  <div className="space-y-4">
                    {recentAssignments.map((assignment, index) => (
                      <motion.div
                        key={assignment.id}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => navigate(`/admin/assignments/${assignment.id}`)}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${assignment.type === 'QUIZ' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                          }`}>
                          <BookOpen className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{assignment.title}</span>
                            <Badge variant={assignment.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                              {assignment.status === 'PUBLISHED' ? 'Chop etilgan' : 'Qoralama'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{assignment.type === 'QUIZ' ? 'Test' : 'Bloklar'}</span>
                            {assignment.dueAt && <span>Muddat: {getDueInText(assignment.dueAt)}</span>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {recentAssignments.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">Vazifalar yo'q</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Turlar bo'yicha statistika</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quiz vazifalar</span>
                      <span className="text-sm text-muted-foreground">{quizCount} vazifa</span>
                    </div>
                    <Progress value={quizPercent} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Scratch Blocks</span>
                      <span className="text-sm text-muted-foreground">{scratchCount} vazifa</span>
                    </div>
                    <Progress value={scratchPercent} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Python Blocks</span>
                      <span className="text-sm text-muted-foreground">{pythonCount} vazifa</span>
                    </div>
                    <Progress value={pythonPercent} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Student Performance Section */}
        <motion.div variants={itemVariants} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                O'quvchilar o'zlashtirishi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.studentPerformance && stats.studentPerformance.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {stats.studentPerformance.map(student => (
                      <div key={student.id} className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-xs text-muted-foreground">{student.groupName}</div>
                          </div>
                          <Badge variant={student.completionRate >= 80 ? 'default' : student.completionRate >= 50 ? 'secondary' : 'destructive'}>
                            {student.completionRate}%
                          </Badge>
                        </div>
                        <Progress value={student.completionRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    O'quvchilar o'zlashtirishi haqida ma'lumot yo'q
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </motion.div>
    </DashboardLayout >
  );
}

interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'primary' | 'info' | 'warning' | 'success';
}

function StatsCard({ icon: Icon, label, value, color }: StatsCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    info: 'bg-info/10 text-info border-info/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    success: 'bg-success/10 text-success border-success/20',
  };

  return (
    <Card className="card-hover">
      <CardContent className="p-4 lg:p-6">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-3 border`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-2xl lg:text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
