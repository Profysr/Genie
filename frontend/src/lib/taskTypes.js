import { CheckSquare, Bug, Sparkles, BookOpen, TrendingUp, HelpCircle } from "lucide-react";

export const TASK_TYPES = [
  { value: "task",        label: "Task",        icon: CheckSquare, color: "text-slate-500",   bg: "bg-slate-100"   },
  { value: "bug",         label: "Bug",          icon: Bug,         color: "text-red-500",     bg: "bg-red-50"      },
  { value: "feature",     label: "Feature",      icon: Sparkles,    color: "text-violet-500",  bg: "bg-violet-50"   },
  { value: "story",       label: "Story",        icon: BookOpen,    color: "text-blue-500",    bg: "bg-blue-50"     },
  { value: "improvement", label: "Improvement",  icon: TrendingUp,  color: "text-emerald-500", bg: "bg-emerald-50"  },
  { value: "question",    label: "Question",     icon: HelpCircle,  color: "text-orange-500",  bg: "bg-orange-50"   },
];

export const getTaskType = (value) =>
  TASK_TYPES.find((t) => t.value === value) || TASK_TYPES[0];
