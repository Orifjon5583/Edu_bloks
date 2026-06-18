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
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Shuffle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Block, BlockCategory } from '@/types';

const categoryColors: Record<BlockCategory, string> = {
  events: 'bg-[hsl(45,100%,51%)]',
  control: 'bg-[hsl(33,100%,50%)]',
  operators: 'bg-[hsl(120,60%,45%)]',
  variables: 'bg-[hsl(262,52%,47%)]',
  looks: 'bg-[hsl(282,68%,47%)]',
  motion: 'bg-[hsl(217,89%,61%)]',
};

interface BlocksExecutionProps {
  blocks: Block[];
  sequence: string[];
  onSequenceChange: (sequence: string[]) => void;
  isPython?: boolean;
}

export default function BlocksExecution({ blocks, sequence, onSequenceChange, isPython = false }: BlocksExecutionProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sequence.indexOf(active.id as string);
      const newIndex = sequence.indexOf(over.id as string);
      onSequenceChange(arrayMove(sequence, oldIndex, newIndex));
    }
  };

  const shuffleBlocks = () => {
    const shuffled = [...sequence].sort(() => Math.random() - 0.5);
    onSequenceChange(shuffled);
  };

  const activeBlock = activeId ? blocks.find(b => b.id === activeId) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {isPython ? '🐍 Python kodni yig\'ing' : '🧩 To\'g\'ri ketma-ketlikni yig\'ing'}
            </CardTitle>
            <CardDescription>Bloklarni kerakli tartibda joylashtiring</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={shuffleBlocks}>
            <Shuffle className="w-4 h-4 mr-2" />
            Aralashtirish
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sequence} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sequence.map((blockId, index) => {
                const block = blocks.find(b => b.id === blockId);
                if (!block) return null;

                return (
                  <SortableBlock
                    key={blockId}
                    block={block}
                    index={index}
                    isPython={isPython}
                  />
                );
              })}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeBlock && (
              <div className={`flex items-center gap-3 p-4 rounded-lg ${categoryColors[activeBlock.category]} text-white shadow-2xl scale-105 ${isPython ? 'font-mono' : ''}`}>
                <GripVertical className="w-5 h-5" />
                <span className="font-medium">{activeBlock.label}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Instructions */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-dashed">
          <h4 className="font-medium mb-2">💡 Maslahat</h4>
          <p className="text-sm text-muted-foreground">
            {isPython
              ? 'Bloklarni tartibini o\'zgartirish uchun ≡ belgisi orqali sudrang. Python kodi uchun to\'g\'ri ketma-ketlikni yig\'ing.'
              : 'Bloklarni tartibini o\'zgartirish uchun ≡ belgisi orqali sudrang. Voqea blokidan (sariq) boshlang va mantiqiy ketma-ketlikni quring.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface SortableBlockProps {
  block: Block;
  index: number;
  isPython: boolean;
}

function SortableBlock({ block, index, isPython }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-lg ${categoryColors[block.category]} text-white shadow-md cursor-grab active:cursor-grabbing`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3 flex-1">
        <GripVertical className="w-5 h-5 flex-shrink-0" />
        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
          {index + 1}
        </span>
        <span className={`font-medium ${isPython ? 'font-mono text-sm' : ''}`}>{block.label}</span>
      </div>
    </motion.div>
  );
}
