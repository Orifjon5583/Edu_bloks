import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Users, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login: authLogin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = await authLogin(login, password);

    if (success) {
      const userData = JSON.parse(localStorage.getItem('eduTask_user') || '{}');
      // Normalize role to lowercase to handle backend returning UPPERCASE
      const role = (userData.role || '').toLowerCase();

      switch (role) {
        case 'superadmin':
          navigate('/sa/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'student':
          navigate('/student/dashboard');
          break;
        default:
          navigate('/');
      }
    } else {
      setError('Noto\'g\'ri login yoki parol');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-animated relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark opacity-50" />

        {/* Floating shapes */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 rounded-full bg-primary/20 blur-xl"
          animate={{ y: [0, 30, 0], x: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-32 right-20 w-48 h-48 rounded-full bg-accent/20 blur-xl"
          animate={{ y: [0, -40, 0], x: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-info/20 blur-xl"
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex flex-col justify-center p-12 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="w-8 h-8" />
              </div>
              <span className="text-3xl font-bold">EduTask</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              <span className="text-accent">Interaktiv</span> ta'lim <br />
              platformasi
            </h1>

            <p className="text-lg text-primary-foreground/80 mb-8 max-w-md">
              Topshiriqlar yarating, o'quvchilar rivojlanishini kuzating va tekshirishni avtomatlashtiring
            </p>

            <div className="grid grid-cols-2 gap-6">
              <FeatureCard
                icon={BookOpen}
                title="Aqlli topshiriqlar"
                description="Viktorina va blokli dasturlash"
              />
              <FeatureCard
                icon={Users}
                title="Jamoalar uchun"
                description="Guruhlar va filiallarni boshqarish"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">EduTask</span>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">Tizimga kirish</CardTitle>
              <CardDescription>
                Platformaga kirish uchun ma'lumotlarni kiriting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login">Login</Label>
                  <Input
                    id="login"
                    type="text"
                    placeholder="Loginni kiriting"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Parol</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Parolni kiriting"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kirilmoqda...
                    </>
                  ) : (
                    'Kirish'
                  )}
                </Button>
              </form>

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
      <Icon className="w-6 h-6 mb-2" />
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-primary-foreground/70">{description}</p>
    </div>
  );
}

function DemoAccount({ role, login, password }: { role: string; login: string; password: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <span className="font-medium">{role}:</span>
      <code className="text-xs bg-background px-2 py-1 rounded">
        {login} / {password}
      </code>
    </div>
  );
}
