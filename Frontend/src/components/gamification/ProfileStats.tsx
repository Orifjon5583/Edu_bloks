import { motion } from 'framer-motion';
import { Trophy, Star, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProfileStatsProps {
    xp: number;
    level: number;
    firstName: string;
    lastName: string;
}

const LEVELS = [
    { level: 1, xp: 0 },
    { level: 2, xp: 100 },
    { level: 3, xp: 300 },
    { level: 4, xp: 600 },
    { level: 5, xp: 1000 },
    { level: 6, xp: 1500 },
    { level: 7, xp: 2100 },
    { level: 8, xp: 2800 },
    { level: 9, xp: 3600 },
    { level: 10, xp: 4500 },
];

export default function ProfileStats({ xp, level, firstName, lastName }: ProfileStatsProps) {
    const currentLevelObj = LEVELS.find(l => l.level === level) || LEVELS[0];
    const nextLevelObj = LEVELS.find(l => l.level === level + 1);

    const currentLevelXP = currentLevelObj.xp;
    const nextLevelXP = nextLevelObj ? nextLevelObj.xp : currentLevelXP * 1.5; // Fallback

    const progress = Math.min(100, Math.max(0, ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100));

    return (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />

            <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-center gap-6">
                {/* Avatar / Level Circle */}
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg shadow-primary/20">
                        {level}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full border-2 border-background flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        LVL
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-2 w-full">
                    <div>
                        <h2 className="text-xl font-bold">{firstName} {lastName}</h2>
                        <p className="text-muted-foreground text-sm flex items-center justify-center md:justify-start gap-1">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            {xp} XP / {nextLevelXP} XP
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                            <span>Daraja {level}</span>
                            <span>Daraja {level + 1}</span>
                        </div>
                        <Progress value={progress} className="h-2.5 bg-background/50" indicatorClassName="bg-gradient-to-r from-primary to-purple-500" />
                        <p className="text-xs text-muted-foreground text-right">
                            Keyingi darajaga {nextLevelXP - xp} XP qoldi
                        </p>
                    </div>
                </div>

                {/* Badges Placeholder - can be expanded to show list */}
                <div className="hidden lg:flex gap-2">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent" title="Boshlang'ich">
                        <Star className="w-5 h-5" />
                    </div>
                    {/* Add more placeholders or map real badges */}
                </div>
            </CardContent>
        </Card>
    );
}
