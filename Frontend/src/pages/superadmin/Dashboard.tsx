import { motion } from 'framer-motion';
import { Building2, Users, UserCog, BookOpen, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { statsApi } from '@/lib/api';



const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  // Fetch stats from API
  const { data: stats, isLoading } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: statsApi.getSuperAdminStats,
  });

  return (
    <DashboardLayout role="superadmin">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl lg:text-3xl font-bold">Boshqaruv paneli</h1>
          <p className="text-muted-foreground mt-1">Platforma ko'rinishi va asosiy ko'rsatkichlar</p>
        </motion.div>

        {/* Stats cards */}
        {isLoading ? (
          <motion.div variants={itemVariants} className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </motion.div>
        ) : stats ? (
          <>
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                icon={Building2}
                label="Filiallar"
                value={stats.totalBranches}
                color="primary"
                onClick={() => navigate('/sa/branches')}
              />
              <StatsCard
                icon={Users}
                label="Guruhlar"
                value={stats.totalGroups}
                color="info"
                onClick={() => navigate('/sa/groups')}
              />
              <StatsCard
                icon={UserCog}
                label="O'qituvchilar"
                value={stats.totalTeachers}
                color="warning"
                onClick={() => navigate('/sa/teachers')}
              />
              <StatsCard
                icon={Users}
                label="O'quvchilar"
                value={stats.totalStudents}
                color="success"
                onClick={() => navigate('/sa/students')}
              />
            </motion.div>

            {/* Activity and Overview */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Completion Rate */}
              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Bajarish statistikasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Umumiy bajarish foizi</span>
                        <span className="text-sm font-medium">{stats.completionRate}%</span>
                      </div>
                      <Progress value={stats.completionRate} className="h-3" />
                    </div>

                    <div className="p-4 rounded-lg bg-success/10 border border-success/20 col-span-2">
                      <div className="text-2xl font-bold text-success">{stats.activeAssignments}</div>
                      <div className="text-sm text-muted-foreground">Faol topshiriqlar</div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Viktorina topshiriqlari</span>
                        <span className="text-sm font-medium">{stats.statsByType?.quiz || 0}%</span>
                      </div>
                      <Progress value={stats.statsByType?.quiz || 0} className="h-2" />

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Scratch Bloklari</span>
                        <span className="text-sm font-medium">{stats.statsByType?.scratch || 0}%</span>
                      </div>
                      <Progress value={stats.statsByType?.scratch || 0} className="h-2" />

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Python Bloklari</span>
                        <span className="text-sm font-medium">{stats.statsByType?.python || 0}%</span>
                      </div>
                      <Progress value={stats.statsByType?.python || 0} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      So'nggi faollik
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.recentActivity && stats.recentActivity.length > 0 ? (
                        stats.recentActivity.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{activity.action}</p>
                              <p className="text-sm text-muted-foreground truncate">{activity.details}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(activity.createdAt).toLocaleString('ru-RU', {
                                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          So'nggi faollik yo'q
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" className="w-full mt-4 text-primary">
                      Hammasini ko'rish <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Tezkor amallar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickActionButton
                      icon={Building2}
                      label="Filial qo'shish"
                      onClick={() => navigate('/sa/branches')}
                    />
                    <QuickActionButton
                      icon={Users}
                      label="Guruh yaratish"
                      onClick={() => navigate('/sa/groups')}
                    />
                    <QuickActionButton
                      icon={UserCog}
                      label="O'qituvchi qo'shish"
                      onClick={() => navigate('/sa/teachers')}
                    />
                    <QuickActionButton
                      icon={Users}
                      label="O'quvchi qo'shish"
                      onClick={() => navigate('/sa/students')}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Teacher Performance Stats */}
            <motion.div variants={itemVariants} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-primary" />
                    O'qituvchilar samaradorligi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {stats.teacherPerformance && stats.teacherPerformance.length > 0 ? (
                      stats.teacherPerformance.map(teacher => (
                        <div key={teacher.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{teacher.name}</span>
                            <span className="text-muted-foreground">{teacher.totalAssignments} topshiriqlar</span>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                            <div
                              className="bg-success"
                              style={{ width: `${teacher.goodPercent}%` }}
                              title={`Bajarildi: ${teacher.goodPercent}%`}
                            />
                            <div
                              className="bg-destructive/50"
                              style={{ width: `${teacher.badPercent}%` }}
                              title={`Bajarilmadi: ${teacher.badPercent}%`}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Muvaffaqiyatli: {teacher.goodPercent}%</span>
                            <span>Muammolar: {teacher.badPercent}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-4">O'qituvchilar bo'yicha ma'lumot yo'q</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : null}
      </motion.div>
    </DashboardLayout>
  );
}

interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'primary' | 'info' | 'warning' | 'success';
  onClick?: () => void;
}

function StatsCard({ icon: Icon, label, value, color, onClick }: StatsCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    info: 'bg-info/10 text-info border-info/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    success: 'bg-success/10 text-success border-success/20',
  };

  return (
    <Card
      className="card-hover cursor-pointer"
      onClick={onClick}
    >
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

interface QuickActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

function QuickActionButton({ icon: Icon, label, onClick }: QuickActionButtonProps) {
  return (
    <Button
      variant="outline"
      className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
      onClick={onClick}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm">{label}</span>
    </Button>
  );
}
