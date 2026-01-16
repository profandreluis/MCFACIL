export type Student = {
	id?: number;
	name: string;
	status?: string;
	number?: number | string | null;
	phone?: string | null;
	profile_photo_url?: string | null;
	life_project?: string | null;
	youth_club_semester_1?: string | null;
	youth_club_semester_2?: string | null;
	elective_semester_1?: string | null;
	elective_semester_2?: string | null;
	tutor_teacher?: string | null;
	guardian_1?: string | null;
	guardian_2?: string | null;
};

export type Teacher = {
	id?: number;
	name: string;
	email?: string | null;
	phone?: string | null;
	profile_photo_url?: string | null;
	subjects?: string[];
	yearly_goals?: string[];
};
