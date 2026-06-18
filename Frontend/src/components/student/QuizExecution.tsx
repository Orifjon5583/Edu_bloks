import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { QuizQuestion } from '@/types';
import { CheckCircle2 } from 'lucide-react';

interface QuizExecutionProps {
  questions: QuizQuestion[];
  answers: Record<string, number>;
  onAnswerChange: (questionId: string, answerIndex: number) => void;
}

export default function QuizExecution({ questions, answers, onAnswerChange }: QuizExecutionProps) {
  return (
    <div className="space-y-4">
      {questions.map((question, qIndex) => {
        const isAnswered = answers[question.id] !== undefined;

        return (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qIndex * 0.1 }}
          >
            <Card className={`transition-all ${isAnswered ? 'border-primary/30 bg-primary/5' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-medium text-sm ${isAnswered
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                    }`}>
                    {isAnswered ? <CheckCircle2 className="w-4 h-4" /> : qIndex + 1}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-medium mb-1">{question.question}</h3>
                      <span className="text-sm text-muted-foreground">
                        {question.points} {question.points === 1 ? 'ball' : 'ball'}
                      </span>
                    </div>
                    {question.questionImage && (
                      <div className="mt-2">
                        <img 
                          src={question.questionImage} 
                          alt="Savol rasmi" 
                          className="max-w-full max-h-64 object-contain rounded-md border shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <RadioGroup
                  value={answers[question.id]?.toString()}
                  onValueChange={(value) => onAnswerChange(question.id, parseInt(value))}
                  className="ml-12 space-y-3"
                >
                  {question.options.map((option, oIndex) => {
                    const optImage = question.optionImages?.[oIndex];
                    return (
                      <motion.div
                        key={oIndex}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[question.id] === oIndex
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        onClick={() => onAnswerChange(question.id, oIndex)}
                      >
                        <div className="pt-1">
                          <RadioGroupItem value={oIndex.toString()} id={`${question.id}-${oIndex}`} />
                        </div>
                        <Label
                          htmlFor={`${question.id}-${oIndex}`}
                          className="flex-1 cursor-pointer font-normal"
                        >
                          {option && <div className="mb-2 text-base">{option}</div>}
                          {optImage && (
                            <img 
                              src={optImage} 
                              alt={`Variant ${oIndex + 1}`} 
                              className="max-w-full max-h-48 object-contain rounded-md border bg-white shadow-sm" 
                            />
                          )}
                        </Label>
                      </motion.div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
