import { Block, BlockCategory } from '@/types';

// Scratch blocks library
export const scratchBlocks: Block[] = [
  // Events
  { id: 'when_flag', type: 'when_flag', category: 'events', label: '🚩 bayroq bosilganda' },
  { id: 'when_key', type: 'when_key', category: 'events', label: '⌨️ tugma bosilganda' },
  { id: 'when_clicked', type: 'when_clicked', category: 'events', label: '🖱️ sprayt bosilganda' },

  // Control
  { id: 'wait', type: 'wait', category: 'control', label: '⏱️ 1 soniya kutish' },
  { id: 'repeat', type: 'repeat', category: 'control', label: '🔄 10 marta takrorlash' },
  { id: 'forever', type: 'forever', category: 'control', label: '♾️ har doim takrorlash' },
  { id: 'if', type: 'if', category: 'control', label: '❓ agar ... bo\'lsa' },
  { id: 'if_else', type: 'if_else', category: 'control', label: '❓ agar ... bo\'lsa ... aks holda' },
  { id: 'stop', type: 'stop', category: 'control', label: '🛑 to\'xtatish' },

  // Motion
  { id: 'move', type: 'move', category: 'motion', label: '➡️ 10 qadam yurish' },
  { id: 'turn_right', type: 'turn_right', category: 'motion', label: '↻ o\'ngga 15° burilish' },
  { id: 'turn_left', type: 'turn_left', category: 'motion', label: '↺ chapga 15° burilish' },
  { id: 'goto', type: 'goto', category: 'motion', label: '📍 x: 0 y: 0 ga o\'tish' },
  { id: 'glide', type: 'glide', category: 'motion', label: '✈️ x: 0 y: 0 ga 1 soniyada suzish' },

  // Looks
  { id: 'say', type: 'say', category: 'looks', label: '💬 "Salom!" deyish' },
  { id: 'say_for', type: 'say_for', category: 'looks', label: '💬 "Salom!" deyish 2 soniya' },
  { id: 'think', type: 'think', category: 'looks', label: '💭 "Hmm..." deb o\'ylash' },
  { id: 'show', type: 'show', category: 'looks', label: '👁️ ko\'rinish' },
  { id: 'hide', type: 'hide', category: 'looks', label: '👁️‍🗨️ yashirinish' },
  { id: 'change_size', type: 'change_size', category: 'looks', label: '📐 o\'lchamni 10 ga o\'zgartirish' },

  // Variables
  { id: 'set_var', type: 'set_var', category: 'variables', label: '📊 o\'zgaruvchini belgilash = 0' },
  { id: 'change_var', type: 'change_var', category: 'variables', label: '📈 o\'zgaruvchini 1 ga o\'zgartirish' },
  { id: 'show_var', type: 'show_var', category: 'variables', label: '👁️ o\'zgaruvchini ko\'rsatish' },

  // Operators
  { id: 'add', type: 'add', category: 'operators', label: '➕ () + ()' },
  { id: 'subtract', type: 'subtract', category: 'operators', label: '➖ () - ()' },
  { id: 'multiply', type: 'multiply', category: 'operators', label: '✖️ () * ()' },
  { id: 'divide', type: 'divide', category: 'operators', label: '➗ () / ()' },
  { id: 'equals', type: 'equals', category: 'operators', label: '🟰 () = ()' },
  { id: 'greater', type: 'greater', category: 'operators', label: '▶️ () > ()' },
  { id: 'less', type: 'less', category: 'operators', label: '◀️ () < ()' },
];

// Python blocks library
export const pythonBlocks: Block[] = [
  // Events / Main
  { id: 'py_main', type: 'py_main', category: 'events', label: 'if __name__ == "__main__":' },
  { id: 'py_def', type: 'py_def', category: 'events', label: 'def function_name():' },
  { id: 'py_class', type: 'py_class', category: 'events', label: 'class ClassName:' },

  // Control
  { id: 'py_if', type: 'py_if', category: 'control', label: 'if shart:' },
  { id: 'py_elif', type: 'py_elif', category: 'control', label: 'elif shart:' },
  { id: 'py_else', type: 'py_else', category: 'control', label: 'else:' },
  { id: 'py_for', type: 'py_for', category: 'control', label: 'for i in range(10):' },
  { id: 'py_for_list', type: 'py_for_list', category: 'control', label: 'for item in list:' },
  { id: 'py_while', type: 'py_while', category: 'control', label: 'while shart:' },
  { id: 'py_break', type: 'py_break', category: 'control', label: 'break' },
  { id: 'py_continue', type: 'py_continue', category: 'control', label: 'continue' },
  { id: 'py_return', type: 'py_return', category: 'control', label: 'return qiymat' },
  { id: 'py_try', type: 'py_try', category: 'control', label: 'try:' },
  { id: 'py_except', type: 'py_except', category: 'control', label: 'except Exception:' },

  // Input/Output (Looks equivalent)
  { id: 'py_print', type: 'py_print', category: 'looks', label: 'print("Hello!")' },
  { id: 'py_print_var', type: 'py_print_var', category: 'looks', label: 'print(variable)' },
  { id: 'py_print_f', type: 'py_print_f', category: 'looks', label: 'print(f"Value: {x}")' },
  { id: 'py_input', type: 'py_input', category: 'looks', label: 'input("Kiriting: ")' },
  { id: 'py_input_int', type: 'py_input_int', category: 'looks', label: 'int(input("Raqam: "))' },

  // Variables
  { id: 'py_assign', type: 'py_assign', category: 'variables', label: 'x = 0' },
  { id: 'py_assign_str', type: 'py_assign_str', category: 'variables', label: 'name = "matn"' },
  { id: 'py_assign_list', type: 'py_assign_list', category: 'variables', label: 'my_list = []' },
  { id: 'py_assign_dict', type: 'py_assign_dict', category: 'variables', label: 'my_dict = {}' },
  { id: 'py_list_append', type: 'py_list_append', category: 'variables', label: 'list.append(item)' },
  { id: 'py_increment', type: 'py_increment', category: 'variables', label: 'x += 1' },
  { id: 'py_decrement', type: 'py_decrement', category: 'variables', label: 'x -= 1' },

  // Operators
  { id: 'py_add', type: 'py_add', category: 'operators', label: 'a + b' },
  { id: 'py_subtract', type: 'py_subtract', category: 'operators', label: 'a - b' },
  { id: 'py_multiply', type: 'py_multiply', category: 'operators', label: 'a * b' },
  { id: 'py_divide', type: 'py_divide', category: 'operators', label: 'a / b' },
  { id: 'py_floor_div', type: 'py_floor_div', category: 'operators', label: 'a // b' },
  { id: 'py_modulo', type: 'py_modulo', category: 'operators', label: 'a % b' },
  { id: 'py_power', type: 'py_power', category: 'operators', label: 'a ** b' },
  { id: 'py_equals', type: 'py_equals', category: 'operators', label: 'a == b' },
  { id: 'py_not_equals', type: 'py_not_equals', category: 'operators', label: 'a != b' },
  { id: 'py_greater', type: 'py_greater', category: 'operators', label: 'a > b' },
  { id: 'py_less', type: 'py_less', category: 'operators', label: 'a < b' },
  { id: 'py_and', type: 'py_and', category: 'operators', label: 'a and b' },
  { id: 'py_or', type: 'py_or', category: 'operators', label: 'a or b' },
  { id: 'py_not', type: 'py_not', category: 'operators', label: 'not a' },

  // Type conversions (Motion equivalent - transformations)
  { id: 'py_int', type: 'py_int', category: 'motion', label: 'int(value)' },
  { id: 'py_str', type: 'py_str', category: 'motion', label: 'str(value)' },
  { id: 'py_float', type: 'py_float', category: 'motion', label: 'float(value)' },
  { id: 'py_len', type: 'py_len', category: 'motion', label: 'len(list)' },
  { id: 'py_range', type: 'py_range', category: 'motion', label: 'range(start, end)' },
  { id: 'py_list_func', type: 'py_list_func', category: 'motion', label: 'list(iterable)' },
];

export const categoryColors: Record<BlockCategory, string> = {
  events: 'bg-[hsl(45,100%,51%)]',
  control: 'bg-[hsl(33,100%,50%)]',
  operators: 'bg-[hsl(120,60%,45%)]',
  variables: 'bg-[hsl(262,52%,47%)]',
  looks: 'bg-[hsl(282,68%,47%)]',
  motion: 'bg-[hsl(217,89%,61%)]',
};

export const categoryLabels: Record<BlockCategory, string> = {
  events: 'Voqealar',
  control: 'Boshqaruv',
  operators: 'Operatorlar',
  variables: 'O\'zgaruvchilar',
  looks: 'Ko\'rinish',
  motion: 'Harakat',
};

export const pythonCategoryLabels: Record<BlockCategory, string> = {
  events: 'Funksiyalar/Sinflar',
  control: 'Boshqaruv',
  operators: 'Operatorlar',
  variables: 'O\'zgaruvchilar',
  looks: 'Kiritish/Chiqarish',
  motion: 'O\'zgartirishlar',
};

export function getBlocksForType(type: 'SCRATCH_BLOCKS' | 'PYTHON_BLOCKS'): Block[] {
  return type === 'PYTHON_BLOCKS' ? pythonBlocks : scratchBlocks;
}

export function getCategoryLabels(type: 'SCRATCH_BLOCKS' | 'PYTHON_BLOCKS') {
  return type === 'PYTHON_BLOCKS' ? pythonCategoryLabels : categoryLabels;
}
