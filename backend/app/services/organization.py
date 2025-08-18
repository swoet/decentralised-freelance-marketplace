from sqlalchemy.orm import Session
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from .base_service import CRUDBase

class OrganizationService(CRUDBase[Organization, OrganizationCreate, OrganizationUpdate]):
    def create_organization(self, db: Session, org_in: OrganizationCreate, user):
        db_obj = Organization()
        setattr(db_obj, 'name', org_in.name)
        # Ensure we set the correct model field name and prefer the current user if available
        owner_value = getattr(org_in, 'owner_id', None) or getattr(user, 'id', None)
        setattr(db_obj, 'owner_id', owner_value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_organizations(self, db: Session):
        return db.query(Organization).all()

    def update_organization(self, db: Session, org_id: str, org_in: OrganizationUpdate, user):
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if org:
            for field, value in org_in.dict(exclude_unset=True).items():
                setattr(org, field, value)
            db.commit()
            db.refresh(org)
        return org

    def delete_organization(self, db: Session, org_id: str, user):
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if org:
            db.delete(org)
            db.commit()
        return None

organization = OrganizationService(Organization)

# Export functions for backward compatibility
create_organization = organization.create_organization
get_organizations = organization.get_organizations
update_organization = organization.update_organization
delete_organization = organization.delete_organization 