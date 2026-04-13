export type TabId = "overview" | "setup" | "faculty" | "curriculum" | "enrollments";

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
};

export type StudentDegree = {
  student_degree_id: number;
  u_id: number;
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
