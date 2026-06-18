import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Copy, Loader2, Tags } from 'lucide-react';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assignmentApi } from '@/lib/api';
import { toast } from 'sonner';

export default function Library() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    // Fetch library assignments
    const { data: assignments = [], isLoading } = useQuery({
        queryKey: ['library', searchTerm, typeFilter],
        queryFn: () => assignmentApi.getLibrary({
            search: searchTerm,
            type: typeFilter,
            limit: 50 // Fetch more items
        }),
    });

    // Duplicate mutation
    const duplicateMutation = useMutation({
        mutationFn: assignmentApi.duplicate,
        onSuccess: (newAssignment) => {
            toast.success('Vazifa nusxalandi');
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            // navigate(`/admin/assignments/${newAssignment.id}/edit`); // Optional: redirect to edit
        },
        onError: () => {
            toast.error('Xatolik yuz berdi');
        }
    });

    const handleDuplicate = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        duplicateMutation.mutate(id);
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Vazifalar kutubxonasi</h1>
                    <p className="text-muted-foreground mt-2">
                        Boshqa o'qituvchilar tomonidan yaratilgan ochiq vazifalarni toping va ishlating
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Qidirish..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Turi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Barchasi</SelectItem>
                            <SelectItem value="QUIZ">Testlar</SelectItem>
                            <SelectItem value="SCRATCH_BLOCKS">Scratch</SelectItem>
                            <SelectItem value="PYTHON_BLOCKS">Python</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignments.length > 0 ? (
                            // API library endpoint potentially returns { data: [], pagination: {} } if pagination used,
                            // or just [] if not. Let's handle both or ensure service returns array if not paginated explicitly.
                            // In service: getLibraryAssignments returns { data, pagination } if pagination param provided.
                            // In API call above, we passed limit: 50, so it returns objects.
                            // Let's safe access: (assignments.data || assignments).
                            (Array.isArray(assignments) ? assignments : assignments.data || []).map((assignment: any) => (
                                <motion.div
                                    key={assignment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    layout
                                >
                                    <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
                                        <CardHeader>
                                            <div className="flex justify-between items-start gap-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${assignment.type === 'QUIZ' ? 'bg-blue-100 text-blue-600' :
                                                        assignment.type === 'PYTHON_BLOCKS' ? 'bg-yellow-100 text-yellow-600' :
                                                            'bg-orange-100 text-orange-600'
                                                    }`}>
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <Badge variant="outline">{assignment.type}</Badge>
                                            </div>
                                            <CardTitle className="mt-4 line-clamp-2">{assignment.title}</CardTitle>
                                            <CardDescription className="line-clamp-2">
                                                {assignment.description || 'Tavsif yo\'q'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                                                <span className="flex items-center gap-1">
                                                    By: {assignment.createdBy.firstName} {assignment.createdBy.lastName}
                                                </span>
                                            </div>
                                            {/* Tags if available */}
                                            {assignment.tags && assignment.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {assignment.tags.map((tag: string) => (
                                                        <Badge key={tag} variant="secondary" className="text-xs">
                                                            <Tags className="w-3 h-3 mr-1" /> {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="pt-0">
                                            <Button
                                                className="w-full"
                                                variant="secondary"
                                                onClick={(e) => handleDuplicate(assignment.id, e)}
                                                disabled={duplicateMutation.isPending}
                                            >
                                                {duplicateMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <Copy className="w-4 h-4 mr-2" />
                                                )}
                                                Nusxalash
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                Vazifalar topilmadi
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
