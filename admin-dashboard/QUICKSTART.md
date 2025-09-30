# Admin Dashboard - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Install Dependencies
```bash
cd admin-dashboard
npm install
```

### 2. Configure Environment
Ensure `.env.local` exists with:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Start Development Server
```bash
npm run dev
```

Access at: **http://localhost:3001**

## 🔐 First Login

### Create Super Admin (Backend)
Run this in your backend environment:
```python
# In backend directory, run Python shell or create script
from app.services.user import user
from app.schemas.user import UserCreate
from app.core.database import SessionLocal

db = SessionLocal()
admin_data = UserCreate(
    email="admin@freelancex.com",
    password="Admin123!",
    full_name="Super Admin",
    role="super_admin",
    wallet_address=None
)
admin_user = user.create(db, obj_in=admin_data)
print(f"Super admin created: {admin_user.email}")
```

### Login Credentials
- **Email**: admin@freelancex.com
- **Password**: Admin123!

## 📋 Available Pages

| Page | Route | Access Level |
|------|-------|--------------|
| Dashboard | `/` | Admin, Super Admin |
| User Management | `/users` | Admin, Super Admin |
| Analytics | `/analytics` | Admin, Super Admin |
| AI Systems | `/ai-systems` | Admin, Super Admin |
| Blockchain | `/blockchain` | Admin, Super Admin |
| Projects | `/projects` | Admin, Super Admin |
| Reputation | `/reputation` | Admin, Super Admin |
| Support | `/support` | Admin, Super Admin |
| Admin Management | `/admin-management` | Super Admin Only |

## 🛠️ Common Tasks

### Create New Admin
1. Login as super admin
2. Navigate to Admin Management
3. Click "Create New Admin"
4. Fill form and submit

### View User Details
1. Navigate to User Management
2. Use filters or search
3. Click "View" on any user

### Monitor Platform Health
1. Dashboard shows key metrics
2. Check system health indicator
3. View recent activity feed

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📦 Tech Stack Overview

- **Frontend**: Next.js 13+ with TypeScript
- **Styling**: Tailwind CSS with custom admin classes
- **Auth**: JWT with AdminAuthContext
- **State**: React Context API
- **API**: RESTful with fetch

## 🐛 Quick Troubleshooting

### "Network Error" on login
```bash
# Check backend is running
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### "403 Forbidden"
- Verify user has admin/super_admin role in database
- Check JWT token in browser DevTools → Application → Local Storage

### Styles not loading
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Port already in use
```bash
# Change port in package.json
"dev": "next dev -p 3002"
```

## 📝 Next Steps

1. **Customize branding** - Update logo and colors in components
2. **Add more features** - Extend based on requirements
3. **Setup production** - Configure environment for deployment
4. **Enable 2FA** - Implement two-factor authentication
5. **Add notifications** - Real-time alerts for admins

## 🔗 Related Files

- **Backend API**: `backend/app/api/v1/admin.py`
- **Database Models**: `backend/app/models/`
- **Frontend Auth**: `admin-dashboard/context/AdminAuthContext.tsx`
- **Main Layout**: `admin-dashboard/components/AdminLayout.tsx`

## 📞 Support

Check the main `README.md` for detailed documentation and troubleshooting guides.
