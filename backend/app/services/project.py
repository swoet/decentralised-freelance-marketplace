from sqlalchemy.orm import Session
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from .base_service import CRUDBase

class ProjectService(CRUDBase[Project, ProjectCreate, ProjectUpdate]):
    def create_project(self, db: Session, project_in: ProjectCreate, user):
        db_obj = Project()
        setattr(db_obj, 'client_id', project_in.client_id)
        setattr(db_obj, 'org_id', project_in.org_id)
        setattr(db_obj, 'title', project_in.title)
        setattr(db_obj, 'description', project_in.description)
        setattr(db_obj, 'budget_min', project_in.budget_min)
        setattr(db_obj, 'budget_max', project_in.budget_max)
        setattr(db_obj, 'status', project_in.status)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_projects(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(Project).offset(skip).limit(limit).all()

    def update_project(self, db: Session, project_id: str, project_in: ProjectUpdate, user):
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            for field, value in project_in.dict(exclude_unset=True).items():
                setattr(project, field, value)
            db.commit()
            db.refresh(project)
        return project

    def delete_project(self, db: Session, project_id: str, user):
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            db.delete(project)
            db.commit()
        return None

project = ProjectService(Project)

# Export functions for backward compatibility
create_project = project.create_project
get_projects = project.get_projects
update_project = project.update_project
delete_project = project.delete_project 