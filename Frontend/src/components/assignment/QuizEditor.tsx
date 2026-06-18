import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QuizQuestion } from '@/types';

interface QuizEditorProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

export default function QuizEditor({ questions, onChange }: QuizEditorProps) {
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      points: 1,
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    onChange(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const addOption = (questionId: string) => {
    onChange(questions.map(q => {
      if (q.id === questionId && q.options.length < 6) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    onChange(questions.map(q => {
      if (q.id === questionId && q.options.length > 2) {
        const newOptions = q.options.filter((_, i) => i !== optionIndex);
        const newCorrectIndex = q.correctIndex >= optionIndex && q.correctIndex > 0
          ? q.correctIndex - 1
          : q.correctIndex;
        return { ...q, options: newOptions, correctIndex: newCorrectIndex };
      }
      return q;
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test muharriri</CardTitle>
        <CardDescription>Javob variantlari bilan savollar qo'shing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">Hozircha savollar yo'q</p>
            <Button onClick={addQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Birinchi savolni qo'shish
            </Button>
          </div>
        ) : (
          <>
            {questions.map((question, qIndex) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border bg-muted/30"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground pt-2">
                    <GripVertical className="w-4 h-4" />
                    <span className="font-medium text-foreground">#{qIndex + 1}</span>
                  </div>

                  <div className="flex-1">
                    <Input
                      placeholder="Savolni kiriting..."
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                      className="text-base"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="ml-9 space-y-3">
                  <Label className="text-sm text-muted-foreground">
                    Javob variantlari (to'g'risini tanlang)
                  </Label>

                  <RadioGroup
                    value={question.correctIndex.toString()}
                    onValueChange={(value) => updateQuestion(question.id, { correctIndex: parseInt(value) })}
                  >
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <RadioGroupItem value={oIndex.toString()} id={`${question.id}-${oIndex}`} />
                        <Input
                          placeholder={`Variant ${oIndex + 1}`}
                          value={option}
                          onChange={(e) => updateOption(question.id, oIndex, e.target.value)}
                          className="flex-1"
                        />
                        {question.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeOption(question.id, oIndex)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </RadioGroup>

                  {question.options.length < 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => addOption(question.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Variant qo'shish
                    </Button>
                  )}

                  <div className="flex items-center gap-4 pt-2 border-t mt-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Ballar:</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={question.points}
                        onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <Button onClick={addQuestion} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Savol qo'shish
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
