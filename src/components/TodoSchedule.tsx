/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Filter,
  CheckSquare,
  Search,
  ChevronRight,
  ChevronDown,
  Tag,
  MapPin,
  User,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { TodoItem, ScheduleItem, UserProfile, Subtask } from '../types';
import { isFridayHoliday } from '../utils';

interface TodoScheduleProps {
  todos: TodoItem[];
  schedules: ScheduleItem[];
  onUpdateTodos: (todos: TodoItem[]) => void;
  onUpdateSchedules: (schedules: ScheduleItem[]) => void;
  profile: UserProfile;
}

export const TodoSchedule: React.FC<TodoScheduleProps> = ({
  todos,
  schedules,
  onUpdateTodos,
  onUpdateSchedules,
  profile
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'todos'>('schedule');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('all');

  // Form states for creating new Todo
  const [showAddTodoModal, setShowAddTodoModal] = useState<boolean>(false);
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');
  const [newTodoDesc, setNewTodoDesc] = useState<string>('');
  const [newTodoCategory, setNewTodoCategory] = useState<TodoItem['category']>('line_balancing');
  const [newTodoPriority, setNewTodoPriority] = useState<TodoItem['priority']>('medium');
  const [newTodoLine, setNewTodoLine] = useState<string>('18');
  const [newTodoDueTime, setNewTodoDueTime] = useState<string>('05:00 PM');
  const [newTodoTargetDate, setNewTodoTargetDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [newTodoSubtasks, setNewTodoSubtasks] = useState<string[]>(['']);

  // Form states for creating new Schedule Item
  const [showAddScheduleModal, setShowAddScheduleModal] = useState<boolean>(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState<string>('');
  const [newScheduleDesc, setNewScheduleDesc] = useState<string>('');
  const [newScheduleStartTime, setNewScheduleStartTime] = useState<string>('09:00 AM');
  const [newScheduleEndTime, setNewScheduleEndTime] = useState<string>('10:00 AM');
  const [newScheduleLine, setNewScheduleLine] = useState<string>('18');
  const [newScheduleLocation, setNewScheduleLocation] = useState<string>('Padma Floor');

  // Filtered Todos
  const filteredTodos = todos.filter(todo => {
    if (statusFilter !== 'all' && todo.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && todo.priority !== priorityFilter) return false;
    if (selectedLineFilter !== 'all' && todo.lineNo !== selectedLineFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = todo.title.toLowerCase().includes(q);
      const matchDesc = todo.description.toLowerCase().includes(q);
      const matchLine = todo.lineNo.includes(q);
      if (!matchTitle && !matchDesc && !matchLine) return false;
    }
    return true;
  });

  // Filtered Schedules
  const filteredSchedules = schedules.filter(item => {
    if (selectedLineFilter !== 'all' && item.lineNo !== selectedLineFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchLoc = item.locationOrFloor.toLowerCase().includes(q);
      if (!matchTitle && !matchLoc) return false;
    }
    return true;
  });

  // Task Actions
  const handleToggleTodoStatus = (id: string) => {
    const updated = todos.map(todo => {
      if (todo.id === id) {
        const nextStatus: TodoItem['status'] =
          todo.status === 'completed'
            ? 'pending'
            : todo.status === 'pending'
            ? 'in_progress'
            : 'completed';
        return {
          ...todo,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined
        };
      }
      return todo;
    });
    onUpdateTodos(updated);
  };

  const handleToggleSubtask = (todoId: string, subtaskId: string) => {
    const updated = todos.map(todo => {
      if (todo.id === todoId) {
        const updatedSubs = todo.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        const allCompleted = updatedSubs.length > 0 && updatedSubs.every(s => s.completed);
        return {
          ...todo,
          subtasks: updatedSubs,
          status: allCompleted ? 'completed' : todo.status
        };
      }
      return todo;
    });
    onUpdateTodos(updated);
  };

  const handleDeleteTodo = (id: string) => {
    onUpdateTodos(todos.filter(t => t.id !== id));
  };

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    const subtasks: Subtask[] = newTodoSubtasks
      .filter(t => t.trim().length > 0)
      .map((t, idx) => ({
        id: `st-${Date.now()}-${idx}`,
        title: t.trim(),
        completed: false
      }));

    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      title: newTodoTitle.trim(),
      description: newTodoDesc.trim(),
      category: newTodoCategory,
      priority: newTodoPriority,
      status: 'pending',
      targetDate: newTodoTargetDate,
      dueTime: newTodoDueTime,
      lineNo: newTodoLine,
      assignedToRole: 'Line IE Officer',
      assignedToName: profile.name,
      assignedByRole: profile.role,
      assignedByName: profile.name,
      subtasks,
      createdAt: new Date().toISOString()
    };

    onUpdateTodos([newTodo, ...todos]);
    setShowAddTodoModal(false);
    setNewTodoTitle('');
    setNewTodoDesc('');
    setNewTodoSubtasks(['']);
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleTitle.trim()) return;

    const newSchedule: ScheduleItem = {
      id: `sch-${Date.now()}`,
      title: newScheduleTitle.trim(),
      description: newScheduleDesc.trim(),
      startTime: newScheduleStartTime,
      endTime: newScheduleEndTime,
      targetDate: new Date().toISOString().split('T')[0],
      lineNo: newScheduleLine,
      category: 'Line Supervision',
      assignedToRole: 'Line IE',
      assignedToName: profile.name,
      assignedByRole: profile.role,
      assignedByName: profile.name,
      status: 'upcoming',
      alertMinutesBefore: 15,
      locationOrFloor: newScheduleLocation
    };

    onUpdateSchedules([...schedules, newSchedule]);
    setShowAddScheduleModal(false);
    setNewScheduleTitle('');
    setNewScheduleDesc('');
  };

  const pendingTodosCount = todos.filter(t => t.status !== 'completed').length;
  const completedTodosCount = todos.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 surface-card operations-intro">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#176f78] text-white">
              Daily Operational Rhythm
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] border border-[#b2d6d8]">
              IE Field Control
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#17343a] tracking-tight page-title">
            Schedule &amp; Action Item Tracking
          </h1>
          <p className="text-xs sm:text-sm text-[#527078] mt-1">
            Hour-by-hour operational timeline, floor supervision routines, and IE Kaizen action items
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'todos' ? (
            <button
              onClick={() => setShowAddTodoModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#176f78] text-white font-bold text-xs flex items-center gap-2 shadow-xs hover:bg-[#12555c] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddScheduleModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#176f78] text-white font-bold text-xs flex items-center gap-2 shadow-xs hover:bg-[#12555c] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Filters Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Dual Tab Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-[#e7e1d5]/60 border border-[#d9d2c2]">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-white text-[#176f78] shadow-xs'
                : 'text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Floor Routine Schedule</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono-numbers bg-[#f1eee6] text-[#527078]">
              {schedules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('todos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'todos'
                ? 'bg-white text-[#176f78] shadow-xs'
                : 'text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>IE Kaizen Action Items</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-numbers ${
              pendingTodosCount > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-[#f1eee6] text-[#527078]'
            }`}>
              {pendingTodosCount}
            </span>
          </button>
        </div>

        {/* Search & Filter Inputs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#527078]" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
            />
          </div>

          {/* Status Filter for Todos */}
          {activeTab === 'todos' && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          )}

          {/* Priority Filter for Todos */}
          {activeTab === 'todos' && (
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-hidden"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'schedule' ? (
        /* Schedule Timeline View */
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#d9d2c2] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e1d5] mb-4">
              <h3 className="font-display text-sm font-bold uppercase text-[#17343a] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#176f78]" />
                <span>Today's Chronological Floor Routine &amp; Milestone Schedule</span>
              </h3>
              <span className="text-xs text-[#527078] font-mono-numbers">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {filteredSchedules.length === 0 ? (
              <div className="text-center py-12 text-[#527078]">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-bold">No schedule events matching current filter</p>
                <p className="text-xs mt-0.5">Click "Add Event" to plan today's supervision milestones</p>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 border-l-2 border-[#d9d2c2] space-y-6">
                {filteredSchedules.map(item => {
                  const isCompleted = item.status === 'completed';
                  const isInProgress = item.status === 'in_progress';

                  return (
                    <div key={item.id} className="relative group">
                      {/* Timeline Node Dot */}
                      <div
                        className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 border-white'
                            : isInProgress
                            ? 'bg-amber-500 border-white ring-4 ring-amber-200'
                            : 'bg-white border-[#176f78]'
                        }`}
                      />

                      {/* Schedule Card */}
                      <div className="p-4 rounded-xl border border-[#e7e1d5] bg-[#fbfaf6] hover:bg-white hover:shadow-xs transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-numbers text-xs font-bold text-[#176f78] bg-[#eef7f7] px-2 py-0.5 rounded border border-[#b2d6d8]">
                              {item.startTime} &ndash; {item.endTime}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-[#d9d2c2] text-[#527078]">
                              Line {item.lineNo}
                            </span>
                            <span className="text-xs text-[#527078] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#527078]" />
                              {item.locationOrFloor}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isInProgress
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-[#f1eee6] text-[#527078]'
                              }`}
                            >
                              {item.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <h4 className="font-bold text-sm text-[#17343a] mt-2">{item.title}</h4>
                        <p className="text-xs text-[#527078] mt-1">{item.description}</p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#e7e1d5] text-[11px] text-[#527078]">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#527078]" />
                            <span>
                              {item.assignedToName} ({item.assignedToRole})
                            </span>
                          </div>
                          <span className="font-mono-numbers text-[10px]">Alert {item.alertMinutesBefore}m prior</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Action Items (Todos) View */
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-[#527078]">Total Tasks</span>
              <div className="font-mono-numbers text-xl font-bold text-[#17343a] mt-0.5">
                {todos.length}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-amber-700">Pending Action</span>
              <div className="font-mono-numbers text-xl font-bold text-amber-700 mt-0.5">
                {pendingTodosCount}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Completed</span>
              <div className="font-mono-numbers text-xl font-bold text-emerald-700 mt-0.5">
                {completedTodosCount}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-[#176f78]">Completion %</span>
              <div className="font-mono-numbers text-xl font-bold text-[#176f78] mt-0.5">
                {todos.length > 0 ? Math.round((completedTodosCount / todos.length) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="space-y-3">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-[#d9d2c2] bg-white text-[#527078]">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-bold">No tasks found matching current filters</p>
                <p className="text-xs mt-0.5">Click "Create Task" above to register a new IE Kaizen item</p>
              </div>
            ) : (
              filteredTodos.map(todo => {
                const isCompleted = todo.status === 'completed';
                const isInProgress = todo.status === 'in_progress';
                const completedSubs = todo.subtasks.filter(s => s.completed).length;

                return (
                   <div
                    key={todo.id}
                     className={`p-4 sm:p-5 rounded-2xl border transition-all todo-card ${
                      isCompleted
                        ? 'bg-[#fbfaf6] border-[#d9d2c2] opacity-80'
                        : 'bg-white border-[#d9d2c2] hover:border-[#176f78] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Status Checkbox Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleTodoStatus(todo.id)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : isInProgress
                              ? 'bg-amber-50 border-amber-500 text-amber-600'
                              : 'border-[#d9d2c2] bg-white hover:border-[#176f78]'
                          }`}
                        >
                          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isInProgress && <Clock className="w-3 h-3" />}
                        </button>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm font-bold ${
                                isCompleted ? 'line-through text-[#527078]' : 'text-[#17343a]'
                              }`}
                            >
                              {todo.title}
                            </span>

                            {/* Priority Badge */}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                todo.priority === 'urgent'
                                  ? 'bg-rose-100 text-rose-800'
                                  : todo.priority === 'high'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {todo.priority}
                            </span>

                            {/* Line Tag */}
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#f1eee6] text-[#527078]">
                              Line {todo.lineNo}
                            </span>

                            {/* Category Tag */}
                            <span className="text-[10px] text-[#527078] font-mono-numbers">
                              #{todo.category.replace('_', ' ')}
                            </span>
                          </div>

                          {todo.description && (
                            <p className="text-xs text-[#527078] mt-1.5 leading-relaxed">
                              {todo.description}
                            </p>
                          )}

                          {/* Subtasks Checklist */}
                          {todo.subtasks.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-[#e7e1d5]/70 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-bold text-[#527078]">
                                <span>Action Steps ({completedSubs}/{todo.subtasks.length})</span>
                                <span className="font-mono-numbers">
                                  {Math.round((completedSubs / todo.subtasks.length) * 100)}%
                                </span>
                              </div>
                              <div className="space-y-1">
                                {todo.subtasks.map(st => (
                                  <label
                                    key={st.id}
                                    className="flex items-center gap-2 text-xs text-[#17343a] cursor-pointer hover:text-[#176f78]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={st.completed}
                                      onChange={() => handleToggleSubtask(todo.id, st.id)}
                                      className="rounded border-[#d9d2c2] text-[#176f78] focus:ring-[#176f78]"
                                    />
                                    <span className={st.completed ? 'line-through text-[#527078]' : ''}>
                                      {st.title}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Footer Details */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-[#e7e1d5] text-[11px] text-[#527078]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>Due: {todo.dueTime} ({todo.targetDate})</span>
                              {isFridayHoliday(todo.targetDate) && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[9.5px] flex items-center gap-1">
                                  <span>🌴</span>
                                  <span>Friday Holiday</span>
                                </span>
                              )}
                              <span>•</span>
                              <span>Assignee: {todo.assignedToName}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="text-rose-600 hover:text-rose-800 transition-colors p-1 rounded hover:bg-rose-50 cursor-pointer"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Todo */}
      {showAddTodoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#d9d2c2] shadow-2xl p-6 space-y-4">
            <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
              Create Industrial Engineering Task
            </h3>
            <form onSubmit={handleCreateTodo} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Neckline folder angle calibration"
                  value={newTodoTitle}
                  onChange={e => setNewTodoTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Category
                  </label>
                  <select
                    value={newTodoCategory}
                    onChange={e => setNewTodoCategory(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a]"
                  >
                    <option value="line_balancing">Line Balancing</option>
                    <option value="bottleneck_study">Bottleneck Study</option>
                    <option value="time_study">Time Study</option>
                    <option value="kaizen_ci">Kaizen / CI</option>
                    <option value="tr_sample">Trial / Sample</option>
                    <option value="general">General Routine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Priority
                  </label>
                  <select
                    value={newTodoPriority}
                    onChange={e => setNewTodoPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a]"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Sewing Line
                  </label>
                  <input
                    type="text"
                    value={newTodoLine}
                    onChange={e => setNewTodoLine(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Target Time
                  </label>
                  <input
                    type="text"
                    value={newTodoDueTime}
                    onChange={e => setNewTodoDueTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-[#527078]">
                    Target Date
                  </label>
                  {isFridayHoliday(newTodoTargetDate) && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 flex items-center gap-1">
                      <span>🌴</span>
                      <span>Friday Weekly Holiday</span>
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={newTodoTargetDate}
                  onChange={e => setNewTodoTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                />
                {isFridayHoliday(newTodoTargetDate) && (
                  <p className="text-[11px] text-amber-800 mt-1 font-medium bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                    🌴 Notice: This task is scheduled on a Friday (Factory Weekly Holiday). Standard assembly lines are closed.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newTodoDesc}
                  onChange={e => setNewTodoDesc(e.target.value)}
                  placeholder="Root cause, operational station, or standard observation..."
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e7e1d5]">
                <button
                  type="button"
                  onClick={() => setShowAddTodoModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#527078] hover:bg-[#f1eee6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c]"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Schedule Event */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#d9d2c2] shadow-2xl p-6 space-y-4">
            <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
              Add Floor Schedule Event
            </h3>
            <form onSubmit={handleCreateSchedule} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Morning Top-5 Huddle"
                  value={newScheduleTitle}
                  onChange={e => setNewScheduleTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={newScheduleStartTime}
                    onChange={e => setNewScheduleStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={newScheduleEndTime}
                    onChange={e => setNewScheduleEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Line No
                  </label>
                  <input
                    type="text"
                    value={newScheduleLine}
                    onChange={e => setNewScheduleLine(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Floor Location
                  </label>
                  <input
                    type="text"
                    value={newScheduleLocation}
                    onChange={e => setNewScheduleLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                  Event Description
                </label>
                <textarea
                  rows={2}
                  value={newScheduleDesc}
                  onChange={e => setNewScheduleDesc(e.target.value)}
                  placeholder="Routine focus and inspection milestones..."
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e7e1d5]">
                <button
                  type="button"
                  onClick={() => setShowAddScheduleModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#527078] hover:bg-[#f1eee6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c]"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
