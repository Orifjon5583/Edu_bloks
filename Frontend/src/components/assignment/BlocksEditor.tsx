import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Block, BlockCategory, AssignmentType } from '@/types';
import {
  scratchBlocks,
  pythonBlocks,
  categoryColors,
  categoryLabels,
  pythonCategoryLabels,
  getBlocksForType,
  getCategoryLabels,
} from '@/lib/blocks';

interface BlocksEditorProps {
  type: AssignmentType;
  blocks: Block[];
  solution: string[];
  customBlocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  onSolutionChange: (solution: string[]) => void;
  onCustomBlocksChange: (blocks: Block[]) => void;
}

export default function BlocksEditor({
  type,
  solution,
  customBlocks,
  onSolutionChange,
  onCustomBlocksChange,
}: BlocksEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('events');
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [newBlockLabel, setNewBlockLabel] = useState('');
  const [newBlockCategory, setNewBlockCategory] = useState<BlockCategory>('control');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const isPython = type === 'PYTHON_BLOCKS';
  const baseBlocks = isPython ? pythonBlocks : scratchBlocks;
  const allBlocks = [...baseBlocks, ...customBlocks];
  const labels = isPython ? pythonCategoryLabels : categoryLabels;

  const solutionBlocks = solution.map(id =>
    allBlocks.find(b => b.id === id) || { id, type: id, category: 'events' as BlockCategory, label: id }
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.id !== over.id && solution.includes(active.id as string)) {
      const oldIndex = solution.indexOf(active.id as string);
      const newIndex = solution.indexOf(over.id as string);
      if (newIndex !== -1) {
        onSolutionChange(arrayMove(solution, oldIndex, newIndex));
      }
    }
  };

  const addBlockToSolution = (block: Block) => {
    onSolutionChange([...solution, block.id]);
  };

  const removeFromSolution = (index: number) => {
    const newSolution = [...solution];
    newSolution.splice(index, 1);
    onSolutionChange(newSolution);
  };

  const handleAddCustomBlock = () => {
    if (newBlockLabel.trim()) {
      const newBlock: Block = {
        id: `custom_${Date.now()}`,
        type: 'custom',
        category: newBlockCategory,
        label: newBlockLabel.trim(),
      };
      onCustomBlocksChange([...customBlocks, newBlock]);
      setNewBlockLabel('');
      setIsAddBlockOpen(false);
    }
  };

  const removeCustomBlock = (id: string) => {
    onCustomBlocksChange(customBlocks.filter(b => b.id !== id));
    onSolutionChange(solution.filter(blockId => blockId !== id));
  };

  const activeBlock = activeId ? allBlocks.find(b => b.id === activeId) : null;

  const filteredBlocks = allBlocks.filter(b => b.category === activeCategory);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Block Library */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bloklar kutubxonasi {isPython ? 'Python' : 'Scratch'}</CardTitle>
                <CardDescription>Qo'shish uchun blok ustiga bosing</CardDescription>
              </div>

              <Dialog open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    O'z blokingiz
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>O'z blokingizni qo'shish</DialogTitle>
                    <DialogDescription>
                      Ushbu vazifa uchun maxsus blok yarating
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Blok matni</Label>
                      <Input
                        placeholder={isPython ? 'print("Mening matnim")' : '💡 mening blokim'}
                        value={newBlockLabel}
                        onChange={(e) => setNewBlockLabel(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Toifa</Label>
                      <Select value={newBlockCategory} onValueChange={(v) => setNewBlockCategory(v as BlockCategory)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(labels) as BlockCategory[]).map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {labels[cat]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={handleAddCustomBlock} disabled={!newBlockLabel.trim()}>
                      Blok qo'shish
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(Object.keys(labels) as BlockCategory[]).map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="text-xs"
                >
                  {labels[category]}
                </Button>
              ))}
            </div>

            {/* Blocks */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredBlocks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Ushbu toifada bloklar yo'q
                </div>
              ) : (
                filteredBlocks.map((block) => (
                  <motion.div
                    key={block.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-lg ${categoryColors[block.category]} text-white cursor-pointer shadow-md flex items-center justify-between group`}
                    onClick={() => addBlockToSolution(block)}
                  >
                    <span className={isPython ? 'font-mono text-sm' : ''}>{block.label}</span>
                    {block.id.startsWith('custom_') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomBlock(block.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Custom blocks section */}
            {customBlocks.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Sizning bloklaringiz ({customBlocks.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {customBlocks.map((block) => (
                    <div
                      key={block.id}
                      className={`px-2 py-1 rounded text-xs ${categoryColors[block.category]} text-white`}
                    >
                      {block.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Solution Workspace */}
        <Card>
          <CardHeader>
            <CardTitle>To'g'ri yechim</CardTitle>
            <CardDescription>Bloklarning to'g'ri ketma-ketligini yig'ing</CardDescription>
          </CardHeader>
          <CardContent>
            <SortableContext items={solution} strategy={verticalListSortingStrategy}>
              <div
                className={`min-h-[400px] p-4 rounded-lg border-2 border-dashed transition-colors ${solution.length === 0 ? 'border-muted-foreground/30' : 'border-primary/30'
                  }`}
                id="solution-drop-zone"
              >
                {solution.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Qo'shish uchun chapdagi bloklarni bosing
                  </div>
                ) : (
                  <div className="space-y-2">
                    {solutionBlocks.map((block, index) => (
                      <SortableBlock
                        key={`${block.id}-${index}`}
                        block={block}
                        index={index}
                        isPython={isPython}
                        onRemove={() => removeFromSolution(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </SortableContext>
          </CardContent>
        </Card>
      </div>

      <DragOverlay>
        {activeBlock && (
          <div className={`p-3 rounded-lg ${categoryColors[activeBlock.category]} text-white shadow-lg ${isPython ? 'font-mono text-sm' : ''}`}>
            {activeBlock.label}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

interface SortableBlockProps {
  block: Block;
  index: number;
  isPython: boolean;
  onRemove: () => void;
}

function SortableBlock({ block, index, isPython, onRemove }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${block.id}-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-lg ${categoryColors[block.category]} text-white shadow-md`}
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="w-4 h-4" />
      </div>
      <span className={`flex-1 ${isPython ? 'font-mono text-sm' : ''}`}>{block.label}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-white/20"
        onClick={onRemove}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}
