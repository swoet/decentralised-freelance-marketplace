from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.project import create_project, get_projects, update_project, delete_project
from app.api.deps import get_db, get_current_active_user
from typing import List

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("/", response_model=ProjectResponse)
def create_project_view(
    project_in: ProjectCreate, db: Session = Depends(get_db), user=Depends(get_current_active_user)
):
    return create_project(db, project_in, user)

@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    projects = get_projects(db, skip=skip, limit=limit)
    return projects

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project_view(
    project_id: str, project_in: ProjectUpdate, db: Session = Depends(get_db), user=Depends(get_current_active_user)
):
    return update_project(db, project_id, project_in, user)

@router.delete("/{project_id}", status_code=204)
def delete_project_view(
    project_id: str, db: Session = Depends(get_db), user=Depends(get_current_active_user)
):
    delete_project(db, project_id, user)
    return None 