from fastapi import APIRouter, Depends, Response, Query
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
    response: Response,
    skip: int = 0,
    limit: int = 100,
    preview: bool = Query(False, description="Preview mode for anonymous users - returns featured/sample projects"),
    db: Session = Depends(get_db),
):
    # Add caching headers for public endpoint
    cache_time = 180 if preview else 300  # Shorter cache for preview mode
    response.headers["Cache-Control"] = f"public, max-age={cache_time}, stale-while-revalidate=60"
    response.headers["Vary"] = "Authorization"
    
    if preview:
        # For preview mode, return only featured/recent projects with limited data
        limit = min(limit, 6)  # Max 6 projects for preview
    
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