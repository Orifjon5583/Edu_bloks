import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, Clock, MoreVertical, Edit, Trash2, Eye, Loader2, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Assignment, AssignmentType } from '@/types';
import { assignmentApi } from '@/lib/api';

const typeLabels: Record<AssignmentType, string> = {
  QUIZ: 'Test',
  SCRATCH_BLOCKS: 'Scratch Blocks',
  PYTHON_BLOCKS: 'Python Blocks',
};

export default function Assignments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentApi.getAll(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: assignmentApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Vazifa o\'chirildi');
    },
    onError: () => {
      toast.error('Vazifa o\'chirishda xatolik');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Siz haqiqatan ham ushbu vazifani o\'chirmoqchimisiz?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || assignment.type === filterType;
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDueDate = (date?: Date | string) => {
    if (!date) return 'Muddatsiz';
    const dateObj = new Date(date);
    const now = new Date();
    const diff = dateObj.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Muddati o\'tgan';
    if (days === 0) return 'Bugun';
    if (days === 1) return 'Ertaga';
    return `${days} kun`;
  };

  // Helper to get stats from assignment object (if API provides them or we calculate localy)
  // Currently defined API interface: Assignment. We need to see if we have extra fields for stats or need to fetch details.
  // Assuming basic Assignment object for now.
  // In the future: extend API to return stats with the list. 
  // For now mocking stats/calculating 0
  const getAssignmentStats = (assignment: Assignment) => {
    // Mock stats as they are not yet in the list API response fully
    // But we can check studentAssignments if available
    return {
      completionRate: 0,
      assignedCount: assignment.groupIds?.length ? 'Guruhlar' : 0 // Simplified
    };
  };


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
            <h1 className="text-2xl lg:text-3xl font-bold">Vazifalar</h1>
            <p className="text-muted-foreground mt-1">O'quv vazifalarini boshqarish</p>
          </div>

          <Button onClick={() => navigate('/admin/assignments/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Vazifa yaratish
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Vazifalarni qidirish..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Vazifa turi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  <SelectItem value="QUIZ">Test</SelectItem>
                  <SelectItem value="SCRATCH_BLOCKS">Scratch Blocks</SelectItem>
                  <SelectItem value="PYTHON_BLOCKS">Python Blocks</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Holat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="PUBLISHED">Chop etilgan</SelectItem>
                  <SelectItem value="DRAFT">Qoralama</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignments.map((assignment, index) => {
              const stats = getAssignmentStats(assignment);
              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="card-hover h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${assignment.type === 'QUIZ' ? 'bg-primary/10 text-primary' :
                          assignment.type === 'SCRATCH_BLOCKS' ? 'bg-accent/10 text-accent' :
                            'bg-info/10 text-info'
                          }`}>
                          <BookOpen className="w-5 h-5" />
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/assignments/${assignment.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ko'rish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/assignments/${assignment.id}/edit`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Tahrirlash
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/assignments/new?cloneFrom=${assignment.id}`)}>
                              <BookOpen className="w-4 h-4 mr-2" />
                              Nusxalash
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/assignments/${assignment.id}/submissions`)}>
                              <Check className="w-4 h-4 mr-2" />
                              Natijalar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(assignment.id)}
                              className="text-destructive"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              O'chirish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <CardTitle className="text-lg mt-3 line-clamp-2">{assignment.title}</CardTitle>

                      {assignment.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {assignment.description}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col justify-end">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline">{typeLabels[assignment.type]}</Badge>
                        <Badge variant={assignment.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                          {assignment.status === 'PUBLISHED' ? 'Chop etilgan' : 'Qoralama'}
                        </Badge>
                      </div>

                      {assignment.status === 'PUBLISHED' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                            <div className="flex items-center gap-1 ml-auto">
                              <Clock className="w-4 h-4" />
                              {formatDueDate(assignment.dueAt)}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}

            {filteredAssignments.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Vazifalar topilmadi</h3>
                    <p className="text-muted-foreground mb-4">
                      O'quvchilaringiz uchun birinchi vazifani yarating
                    </p>
                    <Button onClick={() => navigate('/admin/assignments/new')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Vazifa yaratish
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
