import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { gamificationApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function Leaderboard() {
    const { user } = useAuth();
    const [scope, setScope] = useState<'GROUP' | 'GLOBAL'>('GROUP');

    const { data: leaderboard = [], isLoading } = useQuery({
        queryKey: ['leaderboard', scope],
        queryFn: () => gamificationApi.getLeaderboard(scope),
    });

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
            case 1: return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
            case 2: return <Medal className="w-6 h-6 text-amber-700 fill-amber-700" />;
            default: return <span className="font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
        }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Reyting
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="GROUP" onValueChange={(v) => setScope(v as any)} className="w-full">
                    <div className="px-6 pb-4">
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="GROUP">Guruhim</TabsTrigger>
                            <TabsTrigger value="GLOBAL">Top O'quvchilar</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="h-[400px]">
                        <div className="px-6 pb-4 space-y-4">
                            {isLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
                            ) : leaderboard.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">Hozircha ma'lumot yo'q</div>
                            ) : (
                                leaderboard.map((student, index) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${student.id === user?.id
                                                ? 'bg-primary/5 border-primary/50'
                                                : 'bg-card hover:bg-accent/50 border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center w-8">
                                            {getRankIcon(index)}
                                        </div>

                                        <Avatar className="h-10 w-10 border-2 border-background">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.login}`} />
                                            <AvatarFallback><UserIcon className="w-4 h-4" /></AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold truncate flex items-center gap-2">
                                                {student.firstName} {student.lastName}
                                                {student.id === user?.id && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Siz</span>}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {student.level}-bosqich &bull; {student.xp} XP
                                            </div>
                                        </div>

                                        <div className="font-bold text-lg tabular-nums text-primary">
                                            {student.xp}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </Tabs>
            </CardContent>
        </Card>
    );
}
