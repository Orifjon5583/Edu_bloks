import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentProgressChartProps {
    data: {
        date: string;
        title: string;
        score: number;
        percent: number;
    }[];
}

export const StudentProgressChart = ({ data }: StudentProgressChartProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Mening natijalarim</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="title" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="percent" name="Foiz (%)" stroke="#8884d8" activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="score" name="Ball" stroke="#82ca9d" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

interface GroupPerformanceChartProps {
    data: {
        title: string;
        avgScore: number;
        submittedCount: number;
        totalStudents: number;
    }[];
}

export const GroupPerformanceChart = ({ data }: GroupPerformanceChartProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Guruhlar o'zlashtirishi</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="title" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="avgScore" name="O'rtacha ball" fill="#8884d8" />
                            <Bar dataKey="submittedCount" name="Topshirganlar" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
