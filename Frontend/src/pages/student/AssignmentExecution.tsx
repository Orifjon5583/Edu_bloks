import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, Send, RotateCcw, Loader2, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import QuizExecution from '@/components/student/QuizExecution';
import BlocksExecution from '@/components/student/BlocksExecution';
import { QuizContent, BlocksContent } from '@/types';
import { studentApi } from '@/lib/api';

export default function AssignmentExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch assignment
  const { data: studentAssignment, isLoading } = useQuery({
    queryKey: ['student-assignment', id],
    queryFn: () => studentApi.getAssignment(id!),
    enabled: !!id,
  });

  const assignment = studentAssignment?.assignment;

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: studentApi.submitAssignment,
    onSuccess: (data) => {
      // Invalidate queries to update dashboard and assignment view
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['student-assignment', id] });

      setResult({
        score: data.score,
        maxScore: data.maxScore,
        passed: data.score >= data.maxScore * 0.7 // 70% threshold to match backend
      });
      setSubmitted(true);

      toast(data.score >= data.maxScore * 0.6 ? '🎉 Vazifa bajarildi!' : '😔 Yana bir bor urinib ko\'ring', {
        description: `Sizning natijangiz: ${data.score} / ${data.maxScore} ball`,
      });
    },
    onError: () => {
      toast.error('Javobni yuborishda xatolik');
    }
  });

  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number; passed: boolean } | null>(null);

  // Anti-cheat states
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [isBlurred, setIsBlurred] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  // Blocks state
  // Map of taskId -> sequence // or for single task just ID?
  // We'll normalize stricture:
  // If multi-task: Record<string, string[]> (taskId -> sequence)
  // If single-task: string[] (sequence) - but better to normalize to internal structure
  const [taskSequences, setTaskSequences] = useState<Record<string, string[]>>({});
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // Initialize blocks sequence when assignment loads
  useEffect(() => {
    if (studentAssignment?.status === 'PASSED' || studentAssignment?.status === 'FAILED') {
      // Logic for re-attempt
    }

    if (assignment && (assignment.type === 'SCRATCH_BLOCKS' || assignment.type === 'PYTHON_BLOCKS')) {
      const content = assignment.content as any;

      if (content.tasks && Array.isArray(content.tasks)) {
        // Multi-task
        const initialSequences: Record<string, string[]> = {};
        content.tasks.forEach((task: any) => {
          // If we already have state for this task, don't overwrite (unless retry)
          if (!taskSequences[task.id] && Array.isArray(task.blocks)) {
            const shuffled = [...task.blocks].sort(() => Math.random() - 0.5);
            initialSequences[task.id] = shuffled.map((b: any) => b.id);
          }
        });

        if (Object.keys(initialSequences).length > 0) {
          setTaskSequences(prev => ({ ...prev, ...initialSequences }));
        }
      } else {
        // Legacy Single Task
        const content = assignment.content as BlocksContent;
        if (!taskSequences['legacy'] && Array.isArray(content.blocks)) {
          const shuffled = [...content.blocks].sort(() => Math.random() - 0.5);
          setTaskSequences({ 'legacy': shuffled.map(b => b.id) });
        }
      }
    }
  }, [assignment, studentAssignment]);

  // Anti-cheat effect
  useEffect(() => {
    if (submitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatWarnings(prev => prev + 1);
        setIsBlurred(true);
        toast.error("Qoida buzilishi!", { description: "Siz test vaqtida boshqa oynaga o'tdingiz. Bu qoida buzilishi hisoblanadi." });
      } else {
        setIsBlurred(false);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setCheatWarnings(prev => prev + 1);
      toast.error("Qoida buzilishi!", { description: "Sichqonchaning o'ng tugmasini bosish taqiqlangan." });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' || 
        (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P'))
      ) {
        e.preventDefault();
        setCheatWarnings(prev => prev + 1);
        toast.error("Qoida buzilishi!", { description: "Siz taqiqlangan tugmalarni bosdingiz." });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [submitted]);

  const handleQuizSubmit = () => {
    if (!assignment || assignment.type !== 'QUIZ' || !id) return;

    const formattedAnswers = Object.entries(quizAnswers).map(([questionId, selectedIndex]) => ({
      questionId,
      selectedIndex
    }));

    submitMutation.mutate({
      assignmentId: assignment.id,
      answers: formattedAnswers,
      cheatWarnings
    });
  };

  const handleBlocksSubmit = () => {
    if (!assignment || (assignment.type !== 'SCRATCH_BLOCKS' && assignment.type !== 'PYTHON_BLOCKS') || !id) return;

    const content = assignment.content as any;
    if (content.tasks && Array.isArray(content.tasks)) {
      // Multi-task submission
      const tasksAnswers = content.tasks.map((task: any) => ({
        id: task.id,
        sequence: taskSequences[task.id] || []
      }));

      submitMutation.mutate({
        assignmentId: assignment.id,
        answers: { tasks: tasksAnswers },
        cheatWarnings
      });
    } else {
      // Legacy submission
      submitMutation.mutate({
        assignmentId: assignment.id,
        answers: { sequence: taskSequences['legacy'] || [] },
        cheatWarnings
      });
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setResult(null);
    setQuizAnswers({});
    setCurrentTaskIndex(0);
    setCheatWarnings(0);

    if (assignment?.type === 'SCRATCH_BLOCKS' || assignment?.type === 'PYTHON_BLOCKS') {
      // Re-shuffle
      const content = assignment.content as any;
      if (content.tasks && Array.isArray(content.tasks)) {
        const newSequences: Record<string, string[]> = {};
        content.tasks.forEach((task: any) => {
          if (Array.isArray(task.blocks)) {
            const shuffled = [...task.blocks].sort(() => Math.random() - 0.5);
            newSequences[task.id] = shuffled.map((b: any) => b.id);
          }
        });
        setTaskSequences(newSequences);
      } else {
        const content = assignment.content as BlocksContent;
        if (Array.isArray(content.blocks)) {
          const shuffled = [...content.blocks].sort(() => Math.random() - 0.5);
          setTaskSequences({ 'legacy': shuffled.map((b: any) => b.id) });
        }
      }
    }
  };

  const getTimeLeft = (dueAt?: Date | string) => {
    if (!dueAt) return '';
    const date = new Date(dueAt);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} kun ${hours % 24} soat`;
    if (hours > 0) return `${hours} soat`;
    if (diff < 0) return 'Muddat tugadi';
    return 'Bir soatdan kam';
  };

  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!studentAssignment || !assignment) {
    return (
      <DashboardLayout role="student">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Vazifa topilmadi</h2>
            <Button onClick={() => navigate('/student/dashboard')}>
              Vazifalarga qaytish
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const quizContent = assignment.type === 'QUIZ' ? assignment.content as QuizContent : null;
  // Handle both legacy and new structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawContent = assignment.content as any;
  const isMultiTask = !!rawContent.tasks;
  const tasks = isMultiTask ? rawContent.tasks : (rawContent.blocks ? [{ id: 'legacy', blocks: rawContent.blocks, title: 'Mashq' }] : []);

  const currentTask = tasks[currentTaskIndex];

  const answeredCount = Object.keys(quizAnswers).length;
  // For blocks, answered means moved at least once? Or just total tasks? 
  // Let's just track progress by completed tasks later? For now progress bar only for Quiz is fine.
  // Or we can show task progress (1/3).

  const totalQuestions = quizContent?.questions?.length || tasks.length;

  const getTypeLabel = () => {
    switch (assignment.type) {
      case 'QUIZ': return 'Test';
      case 'SCRATCH_BLOCKS': return 'Scratch Blocks';
      case 'PYTHON_BLOCKS': return 'Python Blocks';
      default: return '';
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{assignment.title}</h1>
              <Badge variant={assignment.type === 'QUIZ' ? 'default' : assignment.type === 'PYTHON_BLOCKS' ? 'secondary' : 'outline'}>
                {getTypeLabel()}
              </Badge>
            </div>

            {assignment.description && (
              <p className="text-muted-foreground">{assignment.description}</p>
            )}

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Qoldi: {getTimeLeft(assignment.dueAt)}
              </span>
              {quizContent ? (
                <span>{totalQuestions} savol</span>
              ) : (
                <span>{tasks.length} mashq</span>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Card */}
        {studentAssignment.feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 flex gap-4">
                <MessageSquare className="w-6 h-6 text-blue-500 shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">O'qituvchi izohi:</h3>
                  <p className="text-blue-800">{studentAssignment.feedback}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Progress bar */}
        {!submitted && totalQuestions > 0 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {quizContent ? 'Savollar' : 'Mashqlar'}
                </span>
                <span className="text-sm font-medium">
                  {quizContent ? `${answeredCount} / ${totalQuestions}` : `${currentTaskIndex + 1} / ${tasks.length}`}
                </span>
              </div>
              <Progress
                value={
                  quizContent
                    ? (answeredCount / totalQuestions) * 100
                    : ((currentTaskIndex + 1) / tasks.length) * 100 // Visual progress
                }
                className="h-2"
              />
            </CardContent>
          </Card>
        )}

        {/* Result Card */}
        <AnimatePresence>
          {submitted && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className={`border-2 ${result.passed ? 'border-success bg-success/5' : 'border-destructive bg-destructive/5'}`}>
                <CardContent className="py-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${result.passed ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                      }`}
                  >
                    {result.passed ? (
                      <CheckCircle2 className="w-10 h-10" />
                    ) : (
                      <XCircle className="w-10 h-10" />
                    )}
                  </motion.div>

                  <h2 className="text-2xl font-bold mb-2">
                    {result.passed ? 'A\'lo!' : 'Topshirilmadi'}
                  </h2>

                  <p className="text-lg mb-6">
                    Sizning natijangiz: <span className="font-bold">{result.score}</span> / {result.maxScore}
                    {assignment.type === 'QUIZ' && ' ball'}
                    {(assignment.type === 'SCRATCH_BLOCKS' || assignment.type === 'PYTHON_BLOCKS') && '%'}
                  </p>

                  <div className="flex items-center justify-center gap-4">
                    {(studentAssignment?.attempts || 0) < 2 && (
                      <Button variant="outline" onClick={handleRetry}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Qayta urinish
                      </Button>
                    )}
                    <Button onClick={() => navigate('/student/dashboard')}>
                      Vazifalarga
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assignment Content */}
        {!submitted && (
          <div className={isBlurred ? "filter blur-md select-none pointer-events-none transition-all duration-300" : "transition-all duration-300"}>
            {assignment.type === 'QUIZ' && quizContent && (
              <QuizExecution
                questions={quizContent.questions}
                answers={quizAnswers}
                onAnswerChange={(questionId, answerIndex) => {
                  setQuizAnswers({ ...quizAnswers, [questionId]: answerIndex });
                }}
              />
            )}

            {/* Empty State for Blocks */}
            {(assignment.type === 'SCRATCH_BLOCKS' || assignment.type === 'PYTHON_BLOCKS') && !currentTask && tasks.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Ushbu vazifada mashqlar yo'q</p>
              </div>
            )}

            {(assignment.type === 'SCRATCH_BLOCKS' || assignment.type === 'PYTHON_BLOCKS') && currentTask && (
              <div className="space-y-4">
                {isMultiTask && tasks.length > 1 && (
                  <h3 className="text-lg font-medium">
                    {currentTask.title}
                  </h3>
                )}
                <BlocksExecution
                  key={currentTask.id}
                  blocks={currentTask.blocks || []}
                  sequence={taskSequences[currentTask.id] || []}
                  onSequenceChange={(seq) => setTaskSequences(prev => ({ ...prev, [currentTask.id]: seq }))}
                  isPython={assignment.type === 'PYTHON_BLOCKS'}
                />
              </div>
            )}

            {/* Navigation & Submit Buttons */}
            <div className="flex justify-between items-center pt-4">
              <div>
                {!quizContent && currentTaskIndex > 0 && (
                  <Button variant="outline" onClick={() => setCurrentTaskIndex(curr => curr - 1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Orqaga
                  </Button>
                )}
              </div>

              <div>
                {!quizContent && currentTaskIndex < tasks.length - 1 ? (
                  <Button onClick={() => setCurrentTaskIndex(curr => curr + 1)}>
                    Keyingisi
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={assignment.type === 'QUIZ' ? handleQuizSubmit : handleBlocksSubmit}
                    disabled={(assignment.type === 'QUIZ' && answeredCount < totalQuestions) || (tasks.length === 0 && !quizContent) || submitMutation.isPending}
                  >
                    {submitMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Javobni yuborish
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
