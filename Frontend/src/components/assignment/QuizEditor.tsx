import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, GripVertical, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QuizQuestion } from '@/types';
import { uploadApi } from '@/lib/api/upload';
import { toast } from 'sonner';

interface QuizEditorProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

export default function QuizEditor({ questions, onChange }: QuizEditorProps) {
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      question: '',
      questionImage: '',
      options: ['', '', '', ''],
      optionImages: ['', '', '', ''],
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

  const updateOptionImage = (questionId: string, optionIndex: number, imageUrl: string) => {
    onChange(questions.map(q => {
      if (q.id === questionId) {
        const newOptionImages = [...(q.optionImages || Array(q.options.length).fill(''))];
        newOptionImages[optionIndex] = imageUrl;
        
        // Agar rasm yuklansa, matnni o'chirib yuboramiz (2 tasidan bittasi bo'lishi shartiga binoan)
        const newOptions = [...q.options];
        if (imageUrl) {
          newOptions[optionIndex] = '';
        }

        return { ...q, options: newOptions, optionImages: newOptionImages };
      }
      return q;
    }));
  };

  const addOption = (questionId: string) => {
    onChange(questions.map(q => {
      if (q.id === questionId && q.options.length < 6) {
        return { 
          ...q, 
          options: [...q.options, ''],
          optionImages: [...(q.optionImages || Array(q.options.length).fill('')), '']
        };
      }
      return q;
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    onChange(questions.map(q => {
      if (q.id === questionId && q.options.length > 2) {
        const newOptions = q.options.filter((_, i) => i !== optionIndex);
        const newOptionImages = (q.optionImages || Array(q.options.length).fill('')).filter((_, i) => i !== optionIndex);
        const newCorrectIndex = q.correctIndex >= optionIndex && q.correctIndex > 0
          ? q.correctIndex - 1
          : q.correctIndex;
        return { ...q, options: newOptions, optionImages: newOptionImages, correctIndex: newCorrectIndex };
      }
      return q;
    }));
  };

  const handleFileUpload = async (file: File, type: 'question' | 'option', questionId: string, optionIndex?: number) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm yuklash mumkin');
      return;
    }
    
    const uploadId = type === 'question' ? `q-${questionId}` : `o-${questionId}-${optionIndex}`;
    setUploadingImageId(uploadId);
    
    try {
      const url = await uploadApi.uploadImage(file);
      if (type === 'question') {
        updateQuestion(questionId, { questionImage: url });
      } else if (typeof optionIndex === 'number') {
        updateOptionImage(questionId, optionIndex, url);
      }
    } catch (error) {
      toast.error('Rasm yuklashda xatolik yuz berdi');
    } finally {
      setUploadingImageId(null);
    }
  };

  const handlePaste = (e: React.ClipboardEvent, type: 'question' | 'option', questionId: string, optionIndex?: number) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleFileUpload(file, type, questionId, optionIndex);
          break; // only handle first image
        }
      }
    }
  };

  const triggerFileInput = (id: string) => {
    document.getElementById(id)?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test muharriri</CardTitle>
        <CardDescription>Javob variantlari bilan savollar qo'shing. Rasmlarni Ctrl+V orqali ham qo'shish mumkin.</CardDescription>
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
                {/* Question area */}
                <div 
                  className="flex items-start gap-3 mb-4"
                  onPaste={(e) => handlePaste(e, 'question', question.id)}
                >
                  <div className="flex items-center gap-2 text-muted-foreground pt-2">
                    <GripVertical className="w-4 h-4" />
                    <span className="font-medium text-foreground">#{qIndex + 1}</span>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Savolni kiriting yoki rasmni shu yerga joylang (Ctrl+V)..."
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                        className="text-base"
                      />
                      <input 
                        type="file" 
                        id={`file-q-${question.id}`} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0], 'question', question.id);
                          }
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => triggerFileInput(`file-q-${question.id}`)}
                        disabled={uploadingImageId === `q-${question.id}`}
                      >
                        {uploadingImageId === `q-${question.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Question Image Preview */}
                    {question.questionImage && (
                      <div className="relative inline-block border rounded-md p-1 bg-white">
                        <img src={question.questionImage} alt="Savol rasmi" className="max-h-48 object-contain rounded" />
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                          onClick={() => updateQuestion(question.id, { questionImage: '' })}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
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

                {/* Options area */}
                <div className="ml-9 space-y-3">
                  <Label className="text-sm text-muted-foreground">
                    Javob variantlari (to'g'risini tanlang)
                  </Label>

                  <RadioGroup
                    value={question.correctIndex.toString()}
                    onValueChange={(value) => updateQuestion(question.id, { correctIndex: parseInt(value) })}
                  >
                    {question.options.map((option, oIndex) => {
                      const optImage = question.optionImages?.[oIndex] || '';
                      const isUploading = uploadingImageId === `o-${question.id}-${oIndex}`;
                      
                      return (
                        <div 
                          key={oIndex} 
                          className="flex items-start gap-3 mt-2"
                          onPaste={(e) => handlePaste(e, 'option', question.id, oIndex)}
                        >
                          <div className="pt-3">
                            <RadioGroupItem value={oIndex.toString()} id={`${question.id}-${oIndex}`} />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                              {!optImage ? (
                                <Input
                                  placeholder={`Variant ${oIndex + 1} matni yoki rasm (Ctrl+V)...`}
                                  value={option}
                                  onChange={(e) => updateOption(question.id, oIndex, e.target.value)}
                                  className="flex-1"
                                />
                              ) : (
                                <div className="flex-1 flex items-center text-sm text-muted-foreground italic px-3 py-2 border rounded-md bg-muted/50">
                                  Variant rasm orqali berilgan
                                </div>
                              )}
                              <input 
                                type="file" 
                                id={`file-o-${question.id}-${oIndex}`} 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleFileUpload(e.target.files[0], 'option', question.id, oIndex);
                                  }
                                }}
                              />
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => triggerFileInput(`file-o-${question.id}-${oIndex}`)}
                                disabled={isUploading}
                              >
                                {isUploading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <ImageIcon className="w-4 h-4" />
                                )}
                              </Button>
                              
                              {question.options.length > 2 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={() => removeOption(question.id, oIndex)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            
                            {/* Option Image Preview */}
                            {optImage && (
                              <div className="relative inline-block border rounded-md p-1 bg-white">
                                <img src={optImage} alt={`Variant ${oIndex + 1} rasmi`} className="max-h-32 object-contain rounded" />
                                <Button 
                                  variant="destructive" 
                                  size="icon" 
                                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                                  onClick={() => updateOptionImage(question.id, oIndex, '')}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
