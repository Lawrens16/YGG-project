// Daily tasks utilities: deterministic 3 tasks per UTC day

export type DailyTask = {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'leadership' | 'technology' | 'community' | 'sports' | 'arts';
};

const ALL_TASKS: DailyTask[] = [
  { id: 'trash-pickup', title: 'Pick up 5 pieces of trash', description: 'Help clean your surroundings.', category: 'community' },
  { id: 'water-plants', title: 'Water a plant', description: 'Care for a plant at home or outdoors.', category: 'community' },
  { id: 'help-elderly', title: 'Help an elderly person', description: 'Assist someone elderly with a small task.', category: 'community' },
  { id: 'read-30', title: 'Read for 30 minutes', description: 'Spend time reading an educational book.', category: 'academic' },
  { id: 'code-kata', title: 'Solve one coding kata', description: 'Practice problem-solving skills.', category: 'technology' },
  { id: 'run-2k', title: 'Run or walk 2 km', description: 'Do a short cardio session.', category: 'sports' },
  { id: 'art-sketch', title: 'Make a simple sketch', description: 'Create a small piece of art.', category: 'arts' },
  { id: 'mentor-peer', title: 'Mentor a peer', description: 'Help a classmate understand a topic.', category: 'leadership' },
];

// Simple deterministic PRNG from seed
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailyTasks(date: Date = new Date()): DailyTask[] {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const seed = y * 10000 + m * 100 + d;
  const rand = mulberry32(seed);
  const pool = [...ALL_TASKS];
  const picks: DailyTask[] = [];
  while (picks.length < 3 && pool.length > 0) {
    const idx = Math.floor(rand() * pool.length);
    picks.push(pool.splice(idx, 1)[0]);
  }
  return picks;
}

export function isTaskMatch(captionOrTitle: string, tasks: DailyTask[]): DailyTask | null {
  const t = captionOrTitle.toLowerCase();
  return tasks.find((task) => t.includes(task.title.toLowerCase()) || t.includes(task.id)) || null;
}


