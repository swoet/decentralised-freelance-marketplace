from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.organization import OrganizationCreate, OrganizationResponse, OrganizationUpdate
from app.services.organization import create_organization, get_organizations, update_organization, delete_organization
from app.api.deps import get_db, get_current_active_user
from typing import List

router = APIRouter(prefix="/organizations", tags=["organizations"])

@router.post("/", response_model=OrganizationResponse)
def create_organization_view(org_in: OrganizationCreate, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    return create_organization(db, org_in, user)

@router.get("/", response_model=List[OrganizationResponse])
def list_organizations(db: Session = Depends(get_db)):
    return get_organizations(db)

@router.put("/{org_id}", response_model=OrganizationResponse)
def update_organization_view(org_id: str, org_in: OrganizationUpdate, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    return update_organization(db, org_id, org_in, user)

@router.delete("/{org_id}", status_code=204)
def delete_organization_view(org_id: str, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    delete_organization(db, org_id, user)
    return None 