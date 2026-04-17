export type TabId = "overview" | "setup" | "curriculum" | "enrollments" | "schedule";

export type StudentGroup = {
  group_id: number;
  group_name: string;
  deg_id: number;
  year_level: number;
  semester_number: number;
  capacity: number;
};

export type Semester = {
  sem_id: number;
  sem_name: string;
  start_date: string;
  end_date: string;
  is_special_semester: boolean;
  week_count: number;
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
};

export type StudentDegree = {
  student_degree_id: number;
  group_id: number;
  deg_id: number;
  yr_lvl: number;
};

export type CourseCurriculum = {
  course_year_id: number;
  c_id: number;
  degree_id: number;
  year_level: number;
  is_active: boolean;
  semester_number: number;
};

export type CourseOffering = {
  offering_id: number;
  c_id: number;
  sem_id: number;
  max_students: number;
  group_id: number;
  hrs_per_week?: number;
};

export type Enrollment = {
  id: number;
  offering_id: number;
  u_id: number;
};

export type FormState<T> = Partial<T> & { [key: string]: string | boolean | number };

export type ScheduleDetail = {
  offering_id: number;
  course: string;
  group: string;
  type: "Lecture" | "Seminar";
  room: string;
  day: string;
  slot_id: number;
};

export type GenerateScheduleResponse = {
  status: "success" | "error";
  semester_id: number;
  semester_name: string;
  offerings_created: number;
  schedule_details: ScheduleDetail[];
  message: string;
};

export type ValidateScheduleResponse = {
  semester_id: number;
  semester_name: string;
  total_offerings: number;
  issues: string[];
  warnings: string[];
  is_valid: boolean;
};

export type SessionType = {
  session_type_id: number;
  type_name: "Lecture" | "Seminar";
  duration_hours: number;
};
