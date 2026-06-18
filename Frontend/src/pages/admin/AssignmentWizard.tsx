import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Eye, Send, CheckCircle2, Loader2, Users, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssignmentType, QuizQuestion, Block, AssignmentStatus } from '@/types';
import QuizEditor from '@/components/assignment/QuizEditor';
import BlocksEditor from '@/components/assignment/BlocksEditor';
import { toast } from 'sonner';
import { groupApi, assignmentApi, userApi } from '@/lib/api'; // userApi added
import { getBlocksForType } from '@/lib/blocks';

const steps = [
  { id: 1, title: 'Asosiy ma\'lumotlar', description: 'Nom, tavsif va tayinlash' },
  { id: 2, title: 'Vazifa turi', description: 'Vazifa formatini tanlang' },
  { id: 3, title: 'Tarkib', description: 'Vazifa tarkibini yarating' },
];

export default function AssignmentWizard() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get ID from URL
  const [searchParams] = useSearchParams();
  const cloneFromId = searchParams.get('cloneFrom');

  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const isEditMode = !!id;
  const sourceId = id || cloneFromId;

  // Step 1: Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignMode, setAssignMode] = useState<'GROUP' | 'STUDENT'>('GROUP');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [customDeadline, setCustomDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  // Step 2: Type selection
  const [assignmentType, setAssignmentType] = useState<AssignmentType | null>(null);

  // Step 3: Content
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Multi-task state
  interface BlockTask {
    id: string;
    title: string;
    description?: string;
    solution: string[];
    customBlocks: Block[];
  }

  const [tasks, setTasks] = useState<BlockTask[]>([
    { id: '1', title: 'Mashq 1', solution: [], customBlocks: [] }
  ]);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);

  // Fetch groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: groupApi.getAll,
  });

  // Fetch students for selection
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students-selection'],
    queryFn: () => userApi.getAll('student'),
  });

  // Fetch assignment if editing or cloning
  const { data: sourceAssignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: ['assignment', sourceId],
    queryFn: () => assignmentApi.getById(sourceId!),
    enabled: !!sourceId,
  });

  // Populate form when assignment loads
  useEffect(() => {
    if (sourceAssignment) {
      setTitle(sourceAssignment.title);
      setDescription(sourceAssignment.description || '');
      setAssignmentType(sourceAssignment.type);
      setIsPublic(sourceAssignment.isPublic || false);
      setTags(sourceAssignment.tags || []);

      // If editing, load targets and date. If cloning, start fresh.
      if (isEditMode) {
        // Determine mode based on what's assigned
        if (sourceAssignment.groups && sourceAssignment.groups.length > 0) {
          setAssignMode('GROUP');
          setSelectedGroups(sourceAssignment.groups.map(g => g.id));
        } else if (sourceAssignment.assignedStudents && sourceAssignment.assignedStudents.length > 0) {
          setAssignMode('STUDENT');
          setSelectedStudents(sourceAssignment.assignedStudents.map((s: any) => s.id));
        } else {
          // If neither (draft with no target), default to GROUP
          setAssignMode('GROUP');
        }

        // Deadline
        if (sourceAssignment.dueAt) {
          const date = new Date(sourceAssignment.dueAt);
          setCustomDeadline(true); // Always show if set
          setDeadlineDate(date.toISOString().split('T')[0]);
          setDeadlineTime(date.toTimeString().slice(0, 5));
        }
      }

      // Content (Load for both Edit and Clone)
      if (sourceAssignment.type === 'QUIZ') {
        const content = sourceAssignment.content as any;
        if (content.questions) {
          setQuizQuestions(content.questions);
        }
      } else {
        // Block tasks
        const content = sourceAssignment.content as any;
        if (content.tasks) {
          setTasks(content.tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            solution: t.solution || [],
            customBlocks: t.customBlocks || [],
            description: t.description
          })));
        } else if (content.blocks) {
          // Legacy single task format
          setTasks([{
            id: '1',
            title: 'Mashq 1',
            solution: content.solution || [],
            customBlocks: content.customBlocks || [], // Assuming customBlocks might exist or empty
            description: content.description
          }]);
        }
      }
    }
  }, [sourceAssignment, isEditMode]);

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: assignmentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Vazifa muvaffaqiyatli yaratildi');
      navigate('/admin/assignments');
    },
    onError: () => {
      toast.error('Vazifa yaratishda xatolik');
    },
  });

  // Update assignment mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => assignmentApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Vazifa yangilandi');
      navigate('/admin/assignments');
    },
    onError: () => {
      toast.error('Vazifa yangilashda xatolik');
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const canProceedStep1 = title.trim().length >= 3 && (
    (assignMode === 'GROUP' && selectedGroups.length > 0) ||
    (assignMode === 'STUDENT' && selectedStudents.length > 0)
  );

  const canProceedStep2 = assignmentType !== null;
  const canPublish = assignmentType === 'QUIZ'
    ? quizQuestions.length > 0
    : tasks.every(t => t.solution.length > 0);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const constructPayload = (status: AssignmentStatus) => {
    // ... payload construction logic same as before ...
    if (!assignmentType) return null;

    let content: any = null;

    if (assignmentType === 'QUIZ') {
      content = { questions: quizQuestions };
    } else {
      const tasksPayload = tasks.map(task => {
        const baseBlocks = getBlocksForType(assignmentType);
        const allAvailableBlocks = [...baseBlocks, ...task.customBlocks];
        const relevantBlocks = allAvailableBlocks.filter(b => task.solution.includes(b.id));

        return {
          id: task.id,
          title: task.title,
          blocks: relevantBlocks,
          solution: task.solution,
          customBlocks: task.customBlocks,
          mode: 'ORDER'
        };
      });
      content = { tasks: tasksPayload };
    }

    if (!content) return null;

    let dueAt: string | undefined = undefined;
    if (customDeadline && deadlineDate && deadlineTime) {
      dueAt = new Date(`${deadlineDate}T${deadlineTime}`).toISOString();
    } else {
      const date = new Date();
      date.setHours(date.getHours() + 36);
      dueAt = date.toISOString();
    }

    const finalGroupIds = assignMode === 'GROUP' ? selectedGroups : [];
    // Reset groups if in student mode, so backend can wipe them if needed? 
    // Wait, update schema handles "set". If we pass empty array, it wipes.
    // So yes, if mode is STUDENT, passing groupIds=[] is correct to remove groups if updating.

    const finalStudentIds = assignMode === 'STUDENT' ? selectedStudents : [];

    const payload = {
      title,
      description,
      type: assignmentType,
      status, // Note: update API might accept status or not depending on schema. My validator allows it?
      // updateAssignmentSchema in validator doesn't strictly allow 'status' unless I added it? 
      // Checking validator... updateAssignmentSchema doesn't have status. 
      // But usually updating draft->published happens via publish endpoint?
      // Or we can assume 'Save Draft' keeps it draft. 'Publish' calls publish endpoint?
      // For Edit, if already Published, we just update content.
      // If Draft, we might Update AND Publish?

      content,
      isPublic,
      tags: tags.filter(t => t), // Filter empty strings
      groupIds: finalGroupIds,
      studentIds: finalStudentIds,
      dueAt,
    };

    return payload;
  };

  const handleSaveDraft = () => {
    // If Editing, just update. If creating, create.
    const payload = constructPayload('DRAFT');
    if (!payload) return;

    if (isEditMode) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handlePublish = () => {
    // ... checks ...
    if (!assignmentType) { toast.error('Vazifa turini tanlang'); return; }
    if (tasks.length === 0) { toast.error('Kamida bitta mashq qo\'shing'); return; }

    const payload = constructPayload('PUBLISHED');
    if (!payload) return;

    if (isEditMode) {
      // If editing, we just update everything. 
      // BUT if it was draft, we want to set status to PUBLISHED.
      // My updateAssignment logic currently doesn't update status unless I added it to schema.
      // I did NOT add status to updateAssignmentSchema. 
      // So I should probably add it or handle it.
      // Or if status is changing, I should call publish endpoint?
      // Simpler: Allow 'status' in update schema.
      // Let's assume for now I will add status to update schema in next step if needed. 
      // Or I can force it via a separate call if needed.
      // Let's send it in payload first.

      // Wait, if I am "Publishing" a draft, I want to trigger the "create student assignments" logic.
      // My recent change to updateAssignment DOES that logic if status IS published (checks existing status).
      // If I update status to PUBLISHED in the same call...
      // I need to add 'status' to update schema.
      updateMutation.mutate({ ...payload, status: 'PUBLISHED' });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Reset blocks when changing type
  const handleTypeChange = (type: AssignmentType) => {
    setAssignmentType(type);
    setTasks([{ id: '1', title: 'Mashq 1', solution: [], customBlocks: [] }]);
    setActiveTaskIndex(0);
  };

  // Task management handlers
  const handleAddTask = () => {
    // ... same as before
    const newId = (tasks.length + 1).toString();
    setTasks([...tasks, {
      id: newId,
      title: `Mashq ${newId}`,
      solution: [],
      customBlocks: []
    }]);
    setActiveTaskIndex(tasks.length);
  };

  const handleRemoveTask = (index: number) => {
    // ... same as before
    if (tasks.length <= 1) return;
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
    if (activeTaskIndex >= newTasks.length) {
      setActiveTaskIndex(newTasks.length - 1);
    }
  };

  const updateActiveTask = (updates: Partial<BlockTask>) => {
    // ... same as before
    const newTasks = [...tasks];
    newTasks[activeTaskIndex] = { ...newTasks[activeTaskIndex], ...updates };
    setTasks(newTasks);
  };

  const currentTask = tasks[activeTaskIndex];

  return (
    <DashboardLayout role="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/assignments')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Vazifa yaratish</h1>
            <p className="text-muted-foreground">Qadam {currentStep} / 3</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${currentStep > step.id
                  ? 'bg-primary text-primary-foreground'
                  : currentStep === step.id
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'bg-muted text-muted-foreground'
                  }`}>
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="hidden sm:block">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-4 rounded transition-all ${currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Asosiy ma'lumotlar</CardTitle>
                  <CardDescription>Vazifa haqida ma'lumot to'ldiring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Vazifa nomi *</Label>
                    <Input
                      id="title"
                      placeholder="Masalan: Pythonda o'zgaruvchilar asoslari"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
                    <Textarea
                      id="description"
                      placeholder="Vazifa haqida qisqacha..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Kimgadir tayinlash *</Label>

                    <Tabs value={assignMode} onValueChange={(v) => setAssignMode(v as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="GROUP">
                          <Users className="w-4 h-4 mr-2" />
                          Guruhlar
                        </TabsTrigger>
                        <TabsTrigger value="STUDENT">
                          <User className="w-4 h-4 mr-2" />
                          O'quvchilar
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {assignMode === 'GROUP' && (
                      <>
                        {isLoadingGroups ? (
                          <div className="py-4 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                            {groups.map((group) => (
                              <div
                                key={group.id}
                                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedGroups.includes(group.id)
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                                  }`}
                                onClick={() => toggleGroup(group.id)}
                              >
                                <Checkbox
                                  checked={selectedGroups.includes(group.id)}
                                  onCheckedChange={() => toggleGroup(group.id)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{group.name}</div>
                                  <div className="text-xs text-muted-foreground">{group._count?.students || 0} o'quvchi</div>
                                </div>
                              </div>
                            ))}
                            {groups.length === 0 && <div className="text-muted-foreground p-2">Guruhlar topilmadi</div>}
                          </div>
                        )}
                      </>
                    )}

                    {assignMode === 'STUDENT' && (
                      <>
                        {isLoadingStudents ? (
                          <div className="py-4 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                            {students.map((student) => (
                              <div
                                key={student.id}
                                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedStudents.includes(student.id)
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                                  }`}
                                onClick={() => toggleStudent(student.id)}
                              >
                                <Checkbox
                                  checked={selectedStudents.includes(student.id)}
                                  onCheckedChange={() => toggleStudent(student.id)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{student.firstName} {student.lastName}</div>
                                  {/* @ts-ignore */}
                                  <div className="text-xs text-muted-foreground">{student.group?.name || 'Guruhsiz'}</div>
                                </div>
                              </div>
                            ))}
                            {students.length === 0 && <div className="text-muted-foreground p-2">O'quvchilar topilmadi</div>}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Boshqa muddat</Label>
                        <p className="text-sm text-muted-foreground">
                          Standart: chop etilgandan so'ng 36 soat
                        </p>
                      </div>
                      <Switch
                        checked={customDeadline}
                        onCheckedChange={setCustomDeadline}
                      />
                    </div>

                    {customDeadline && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid sm:grid-cols-2 gap-4"
                      >
                        <div className="space-y-2">
                          <Label>Sana</Label>
                          <Input
                            type="date"
                            value={deadlineDate}
                            onChange={(e) => setDeadlineDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Vaqt</Label>
                          <Input
                            type="time"
                            value={deadlineTime}
                            onChange={(e) => setDeadlineTime(e.target.value)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Teglar (vergul bilan ajrating)</Label>
                    <Input
                      value={tags.join(', ')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTags(val.split(',').map(t => t.trim()));
                      }}
                      placeholder="masalan: 1-sinf, sonlar, mantiq"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPublic"
                      checked={isPublic}
                      onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                    />
                    <Label htmlFor="isPublic" className="font-normal cursor-pointer">
                      Kutubxonaga joylash (boshqa o'qituvchilar ko'ra oladi)
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Vazifa turini tanlang</CardTitle>
                  <CardDescription>O'quvchilar uchun vazifa formatini belgilang</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <TypeCard
                      type="QUIZ"
                      title="Test (Quiz)"
                      description="Variantli savollar"
                      icon="📝"
                      selected={assignmentType === 'QUIZ'}
                      onClick={() => handleTypeChange('QUIZ')}
                    />
                    <TypeCard
                      type="SCRATCH_BLOCKS"
                      title="Scratch Blocks"
                      description="Vizual Scratch bloklari"
                      icon="🧩"
                      selected={assignmentType === 'SCRATCH_BLOCKS'}
                      onClick={() => handleTypeChange('SCRATCH_BLOCKS')}
                    />
                    <TypeCard
                      type="PYTHON_BLOCKS"
                      title="Python Blocks"
                      description="Python kod bloklari"
                      icon="🐍"
                      selected={assignmentType === 'PYTHON_BLOCKS'}
                      onClick={() => handleTypeChange('PYTHON_BLOCKS')}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                {assignmentType === 'QUIZ' && (
                  <QuizEditor
                    questions={quizQuestions}
                    onChange={setQuizQuestions}
                  />
                )}

                {(assignmentType === 'SCRATCH_BLOCKS' || assignmentType === 'PYTHON_BLOCKS') && (
                  <div className="space-y-4">
                    {/* Task Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {tasks.map((task, index) => (
                        <div
                          key={task.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${index === activeTaskIndex
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card hover:bg-muted'
                            }`}
                          onClick={() => setActiveTaskIndex(index)}
                        >
                          {task.title}
                          {tasks.length > 1 && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTask(index);
                              }}
                              className="w-4 h-4 rounded-full hover:bg-destructive hover:text-white flex items-center justify-center transition-colors"
                            >
                              &times;
                            </div>
                          )}
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={handleAddTask}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Qo'shish
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      <Input
                        value={currentTask.title}
                        onChange={(e) => updateActiveTask({ title: e.target.value })}
                        placeholder="Mashq nomi"
                        className="text-lg font-medium"
                      />
                      <BlocksEditor
                        key={currentTask.id} // Re-mount component when task changes
                        type={assignmentType}
                        blocks={[]} // Not used by component
                        solution={currentTask.solution}
                        customBlocks={currentTask.customBlocks}
                        onBlocksChange={() => { }}
                        onSolutionChange={(solution) => updateActiveTask({ solution })}
                        onCustomBlocksChange={(customBlocks) => updateActiveTask({ customBlocks })}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={isPending}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Orqaga
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isPending || (currentStep === 1 && !canProceedStep1)}>
              {isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {isEditMode ? 'Saqlash' : 'Qoralamani saqlash'}
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !canProceedStep1) ||
                  (currentStep === 2 && !canProceedStep2)
                }
              >
                Keyingisi
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" disabled={true}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ko'rib chiqish
                </Button>
                <Button onClick={handlePublish} disabled={!canPublish || isPending}>
                  {isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  {isEditMode ? 'Yangilash' : 'Chop etish'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface TypeCardProps {
  type: AssignmentType;
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
}

function TypeCard({ title, description, icon, selected, onClick, disabled, badge }: TypeCardProps) {
  return (
    <div
      className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${disabled
        ? 'opacity-50 cursor-not-allowed border-border'
        : selected
          ? 'border-primary bg-primary/5 shadow-glow'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }`}
      onClick={disabled ? undefined : onClick}
    >
      {badge && (
        <Badge className="absolute top-2 right-2" variant="secondary">
          {badge}
        </Badge>
      )}
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
