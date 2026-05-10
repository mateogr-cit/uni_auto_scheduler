'use client';

import { useState, useEffect } from 'react';
import { Users2, Plus, Edit, Trash2, GraduationCap, Calendar, Building2, RefreshCcw, Clock, ChevronDown } from 'lucide-react';
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

interface Degree {
  d_id: number;
  d_name: string;
  degree_abbr: string;
  f_id: number;
}

interface StudentGroup {
  group_id: number;
  group_name: string;
  deg_id: number;
  year_level: number;
  semester_number: number;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  degree?: Degree;
}

interface StudentGroupAvailability {
  id?: number;
  group_id: number;
  day_of_week: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export default function StudentGroupsPage() {
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudentGroup | null>(null);
  const [availabilities, setAvailabilities] = useState<Record<string, StudentGroupAvailability>>(
    DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: { group_id: 0, day_of_week: day, start_time: "09:00", end_time: "15:00", is_available: true }
    }), {})
  );
  const [formData, setFormData] = useState<{
    group_name: string;
    deg_id: string;
    year_level: string;
    semester_number: string;
    capacity: string;
  }>({
    group_name: '',
    deg_id: '',
    year_level: '',
    semester_number: '',
    capacity: '',
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchGroups();
    fetchDegrees();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${API_BASE}/student-groups/`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    }
  };

  const fetchDegrees = async () => {
    try {
      const response = await fetch(`${API_BASE}/degrees/`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setDegrees(data);
    } catch (err) {
      console.error('Failed to fetch degrees', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingGroup
        ? `${API_BASE}/student-groups/${editingGroup.group_id}`
        : `${API_BASE}/student-groups/`;
      const method = editingGroup ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_name: formData.group_name,
          deg_id: parseInt(formData.deg_id),
          year_level: parseInt(formData.year_level),
          semester_number: parseInt(formData.semester_number),
          capacity: parseInt(formData.capacity),
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const groupData = await response.json();
      const groupId = editingGroup?.group_id || groupData.group_id;

      // Update availability
      const availabilityList = Object.values(availabilities).map(a => ({
        group_id: groupId,
        day_of_week: a.day_of_week,
        start_time: a.start_time.length === 5 ? `${a.start_time}:00` : a.start_time,
        end_time: a.end_time.length === 5 ? `${a.end_time}:00` : a.end_time,
        is_available: a.is_available
      }));

      await fetch(`${API_BASE}/student-group-availability/batch/?group_id=${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(availabilityList),
      });

      toast.success(`Student group ${editingGroup ? 'updated' : 'created'} successfully.`);
      fetchGroups();
      setShowForm(false);
      setEditingGroup(null);
      resetForm();
    } catch (err) {
      console.error('Failed to save group', err);
      toast.error('Failed to save student group.');
    }
  };

  const handleEdit = async (group: StudentGroup) => {
    setEditingGroup(group);
    setFormData({
      group_name: group.group_name,
      deg_id: group.deg_id.toString(),
      year_level: group.year_level.toString(),
      semester_number: group.semester_number.toString(),
      capacity: group.capacity.toString(),
    });

    // Fetch availability data
    try {
      const response = await fetch(`${API_BASE}/student-group-availability/?group_id=${group.group_id}`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const availData: StudentGroupAvailability[] = await response.json();

      const newAvail: Record<string, StudentGroupAvailability> = DAYS.reduce((acc, day) => ({
        ...acc,
        [day]: { group_id: group.group_id, day_of_week: day, start_time: "09:00", end_time: "15:00", is_available: true }
      }), {});

      availData.forEach(a => {
        newAvail[a.day_of_week] = {
          ...a,
          start_time: a.start_time.substring(0, 5),
          end_time: a.end_time.substring(0, 5)
        };
      });

      setAvailabilities(newAvail);
    } catch (err) {
      console.error('Failed to fetch availability', err);
    }

    setShowForm(true);
  };

  const handleDelete = async (groupId: number) => {
    if (!confirm('Are you sure you want to delete this student group?')) return;

    try {
      const response = await fetch(`${API_BASE}/student-groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      toast.success('Student group deleted successfully.');
      fetchGroups();
    } catch (err) {
      console.error('Failed to delete group', err);
      toast.error('Failed to delete student group.');
    }
  };

  const resetForm = () => {
    setFormData({
      group_name: '',
      deg_id: '',
      year_level: '',
      semester_number: '',
      capacity: '',
    });
    setAvailabilities(
      DAYS.reduce((acc, day) => ({
        ...acc,
        [day]: { group_id: 0, day_of_week: day, start_time: "09:00", end_time: "15:00", is_available: true }
      }), {})
    );
  };

  const getYearLabel = (year: number) => {
    const labels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    return labels[year - 1] || `${year}th Year`;
  };

  const getSemesterLabel = (semester: number) => {
    return semester === 1 ? 'Semester 1' : 'Semester 2';
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-red-600/10 text-red-600 rounded-lg">
              <Users2 size={24} />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Student Groups
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage academic groups for scheduling and enrollment.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              fetchGroups();
              fetchDegrees();
            }}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingGroup(null);
              resetForm();
            }}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white px-5 py-2.5 font-medium transition-colors shadow-lg shadow-red-500/25"
          >
            <Plus size={20} />
            Add Group
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">
            {editingGroup ? 'Edit Student Group' : 'Create Student Group'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="group_name">Group Name</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Users2 data-icon="inline-start" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="group_name"
                    placeholder="e.g., SE1, CS2"
                    value={formData.group_name}
                    onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                    required
                  />
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="deg_id">Degree Programme</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <GraduationCap data-icon="inline-start" />
                  </InputGroupAddon>
                  <Select
                    value={formData.deg_id || ""}
                    onValueChange={(value: string) => setFormData({ ...formData, deg_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Degree" />
                    </SelectTrigger>
                    <SelectContent>
                      {degrees.map((deg) => (
                        <SelectItem key={deg.d_id} value={deg.d_id.toString()}>
                          {deg.d_name} ({deg.degree_abbr})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="year_level">Year Level</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Calendar data-icon="inline-start" />
                  </InputGroupAddon>
                  <Select
                    value={formData.year_level}
                    onValueChange={(value) => setFormData({ ...formData, year_level: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="semester_number">Semester</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Building2 data-icon="inline-start" />
                  </InputGroupAddon>
                  <Select
                    value={formData.semester_number}
                    onValueChange={(value) => setFormData({ ...formData, semester_number: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Users2 data-icon="inline-start" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="capacity"
                    type="number"
                    placeholder="e.g., 40"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    min="1"
                  />
                </InputGroup>
              </Field>
            </FieldGroup>

            {/* Weekly Availability */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-red-600" />
                <h3 className="text-lg font-bold">Weekly Availability</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      availabilities[day].is_available
                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50'
                        : 'bg-zinc-50 dark:bg-zinc-800/50 border-transparent opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-sm uppercase tracking-wider">
                        {day.substring(0, 3)}
                      </span>
                      <Checkbox
                        checked={availabilities[day].is_available}
                        onCheckedChange={(checked) =>
                          setAvailabilities({
                            ...availabilities,
                            [day]: { ...availabilities[day], is_available: checked as boolean }
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <Clock data-icon="inline-start" />
                        </InputGroupAddon>
                        <InputGroupInput
                          type="time"
                          value={availabilities[day].start_time}
                          disabled={!availabilities[day].is_available}
                          onChange={(e) =>
                            setAvailabilities({
                              ...availabilities,
                              [day]: { ...availabilities[day], start_time: e.target.value }
                            })
                          }
                        />
                      </InputGroup>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <Clock data-icon="inline-start" />
                        </InputGroupAddon>
                        <InputGroupInput
                          type="time"
                          value={availabilities[day].end_time}
                          disabled={!availabilities[day].is_available}
                          onChange={(e) =>
                            setAvailabilities({
                              ...availabilities,
                              [day]: { ...availabilities[day], end_time: e.target.value }
                            })
                          }
                        />
                      </InputGroup>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingGroup(null);
                  resetForm();
                }}
                className="cursor-pointer px-6 py-3 rounded-xl font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer px-10 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/10 dark:shadow-white/5"
              >
                {editingGroup ? 'Update Group' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-12 flex flex-col items-center justify-center text-center flex flex-col gap-4">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
            <Users2 className="text-zinc-400" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              No Student Groups Yet
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Create your first student group to start organizing students for scheduling.
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingGroup(null);
              resetForm();
            }}
            className="cursor-pointer bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-red-500/25"
          >
            Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div
              key={group.group_id}
              className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 rounded-xl flex items-center justify-center">
                    <Users2 className="text-red-600 dark:text-red-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {group.group_name}
                    </h3>
                    {group.degree && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {group.degree.d_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(group)}
                    className="cursor-pointer p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(group.group_id)}
                    className="cursor-pointer p-2 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Year</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {getYearLabel(group.year_level)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Semester</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {getSemesterLabel(group.semester_number)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Capacity</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {group.capacity} students
                  </span>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              setShowForm(true);
              setEditingGroup(null);
              resetForm();
            }}
            className="cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-zinc-400 group flex flex-col gap-2 border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 hover:text-red-500 transition-all min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-red-500/50">
              <Plus size={24} />
            </div>
            <span className="font-medium">Add New Group</span>
          </button>
        </div>
      )}
    </div>
  );
}
