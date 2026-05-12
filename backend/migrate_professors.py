from database import SessionLocal
from models import Prof, User, Course, professor_course_table
from sqlalchemy import text

def migrate_professors():
    db = SessionLocal()

    try:
        # Get all professor users
        professor_users = db.query(User).filter(User.u_role == 'professor').all()
        print(f"Found {len(professor_users)} professor users")

        # Get all courses
        courses = db.query(Course).all()
        course_map = {course.c_abbr: course.c_id for course in courses}
        print(f"Found {len(courses)} courses")

        # Course assignments for each professor (matching the batch script)
        professor_assignments = {
            # Engineering Faculty
            "johnson.robert": ["CS101", "CS201", "CS102", "SE301", "CS202", "SE302"],
            "wilson.kevin": ["CS101", "CS201", "CS102", "SE301", "CS202", "SE302"],
            "garcia.maria": ["CE101", "CE102", "CE201", "CE202", "CE301", "CE302"],
            "davis.jennifer": ["CE101", "CE102", "CE201", "CE202", "CE301", "CE302"],
            "chen.david": ["AI101", "AI102", "AI201", "AI202", "AI301", "AI302"],
            "kim.alex": ["AI101", "AI102", "AI201", "AI202", "AI301", "AI302"],
            "williams.sarah": ["TE101", "TE102", "TE201", "TE202", "TE301", "TE302"],
            "lee.brian": ["TE101", "TE102", "TE201", "TE202", "TE301", "TE302"],
            "anderson.james": ["RM101", "RM102", "RM201", "RM202", "RM301", "RM302"],
            "nguyen.carol": ["RM101", "RM102", "RM201", "RM202", "RM301", "RM302"],
            "brown.emily": ["EE101", "EE102", "EE201", "EE202", "EE301", "EE302"],
            "miller.frank": ["EE101", "EE102", "EE201", "EE202", "EE301", "EE302"],
            "taylor.michael": ["MATH101", "MATH102", "MATH201", "MATH202"],
            "moore.susan": ["MATH101", "MATH102", "MATH201", "MATH202"],
            "jackson.richard": ["MATH101", "MATH102", "MATH201", "MATH202"],
            "martinez.lisa": ["PHYS101", "PHYS102"],
            "garcia.paul": ["PHYS101", "PHYS102"],

            # Economics Faculty
            "miller.thomas": ["DM101", "DM102", "DM201", "DM202", "DM301", "DM302"],
            "clark.nancy": ["DM101", "DM102", "DM201", "DM202", "DM301", "DM302"],
            "thompson.amanda": ["FI101", "FI102", "FI201", "FI202", "FI301", "FI302"],
            "harris.george": ["FI101", "FI102", "FI201", "FI202", "FI301", "FI302"],
            "white.christopher": ["BA101", "BA102", "BA201", "BA202", "BA301", "BA302"],
            "lewis.diana": ["BA101", "BA102", "BA201", "BA202", "BA301", "BA302"],
            "harris.jessica": ["IFE101", "IFE102", "IFE201", "IFE202", "IFE301", "IFE302"],
            "walker.edward": ["IFE101", "IFE102", "IFE201", "IFE202", "IFE301", "IFE302"],
            "clark.daniel": ["BAIT101", "BAIT102", "BAIT201", "BAIT202", "BAIT301", "BAIT302"],
            "hall.fiona": ["BAIT101", "BAIT102", "BAIT201", "BAIT202", "BAIT301", "BAIT302"],
            "lewis.michelle": ["ECON101", "ECON102"],
            "young.henry": ["ECON101", "ECON102"],
            "walker.robert": ["BUS101", "BUS102"],
            "king.irene": ["BUS101", "BUS102"],
            "hall.patricia": ["STAT101", "STAT201"],
            "wright.jack": ["STAT101", "STAT201"],
            "young.mark": ["ENG101", "ENG102"],
            "scott.karen": ["ENG101", "ENG102"],
            "king.elizabeth": ["COMP101"],
            "green.larry": ["COMP101"],
        }

        created_count = 0
        for user in professor_users:
            # Check if Prof entry already exists
            existing = db.query(Prof).filter(Prof.u_id == user.u_id).first()
            if existing:
                print(f"  Prof entry already exists for {user.username} (ID: {user.u_id})")
                continue

            # Create Prof entry
            prof = Prof(u_id=user.u_id)
            db.add(prof)
            db.flush()  # Flush to get the prof entry created

            # Assign courses
            course_abbrs = professor_assignments.get(user.username, [])
            course_ids = []
            for abbr in course_abbrs:
                if abbr in course_map:
                    course_ids.append(course_map[abbr])

            if course_ids:
                for c_id in course_ids:
                    db.execute(professor_course_table.insert().values(u_id=user.u_id, c_id=c_id))

            print(f"  Created Prof entry for {user.username} (ID: {user.u_id}) with {len(course_ids)} courses")
            created_count += 1

        db.commit()
        print(f"\nSuccessfully created {created_count} Prof entries!")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_professors()
