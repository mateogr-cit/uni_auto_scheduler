export type TabId = "overview" | "setup" | "schedules" | "schedule";

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

export type TimeSlot = {
  slot_id: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
};

export type StudentGroup = {
  group_id: number;
  group_name: string;
  deg_id: number;
  year_level: number;
  semester_number: number;
  capacity: number;
};

export type Faculty = {
  f_id: number;
  f_name: string;
  f_abbr: string;
};

export type Degree = {
  d_id: number;
  d_name: string;
  f_id: number;
  degree_abbr: string;
};

export type Student = {
  u_id: number;
  s_status: string;
  group_id: number | null;
  fname: string;
  lname: string;
};

export type Course = {
  c_id: number;
  c_name: string;
  c_abbr: string;
  c_difficulty_weight: number;
  c_year: number;
  c_semester: number;
};

export type StudentDegree = {
  student_degree_id: number;
  group_id: number;
};

export type CourseCurriculum = {
  course_year_id: number;
  c_id: number;
  degree_id: number;
  year_level: number;
  is_active: boolean;
  semester_number: number;
};

export type CourseSchedule = {
  schedule_id: number;
  c_id: number;
  group_id: number;
  room_id: string;
  slot_id: number;
  session_type_id: number;
  u_id: number;
  s_status: string;
  createdAt: string;
  updatedAt: string;
};

export type FormState<T> = Partial<T> & { [key: string]: string | boolean | number };

export type ScheduleDetail = {
  schedule_id: number;
  course: string;
  group: string;
  type: "Lecture" | "Seminar";
  room: string;
  day: string;
  slot_id: number;
  offering_id: number;
};

export type SkippedEntry = {
  course: string;
  course_abbr: string;
  group: string;
  year_level: number;
  semester_number: number;
  session_type: string;
  professor?: string;
  reason: string;
  missing: string[];
  lecture_assigned?: {
    day: string;
    slot_id: number;
    room: string;
  };
};

export type GenerateScheduleResponse = {
  status: "success" | "error";
  semester_name: string;
  offerings_created: number;
  skipped_count: number;
  schedule_details: ScheduleDetail[];
  skipped: SkippedEntry[];
  message: string;
};

export type ValidateScheduleResponse = {
  year: number;
  semester_number: number;
  total_offerings: number;
  total_schedules: number;
  issues: string[];
  warnings: string[];
  is_valid: boolean;
};

export type SessionType = {
  session_type_id: number;
  type_name: "Lecture" | "Seminar";
  duration_hours: number;
};
