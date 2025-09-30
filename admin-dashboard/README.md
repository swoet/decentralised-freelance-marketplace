# Admin Dashboard - FreelanceX

A comprehensive admin dashboard for managing the FreelanceX decentralized freelance marketplace platform.

## Features

### 📊 Dashboard Overview
- Real-time platform statistics and metrics
- System health monitoring
- Recent activity feed
- Quick action buttons

### 👥 User Management
- View all platform users with filters (role, status, search)
- User details and statistics
- Suspend/activate user accounts
- Pagination for large datasets

### 📈 Analytics
- Revenue analytics with customizable time periods
- User growth and engagement metrics
- Project analytics and completion rates
- Platform health insights

### 🤖 AI Systems
- Monitor AI matching and content generation systems
- View AI request statistics and success rates
- Manage active AI models
- Performance metrics and response time distribution

### ⛓️ Blockchain Management
- Monitor smart contracts and transactions
- Track escrow contracts and payments
- View total value locked (TVL)
- Recent blockchain transaction history

### 📁 Project Management
- View all platform projects
- Filter by status (active, completed, cancelled)
- Project statistics and budget tracking

### ⭐ Reputation System
- Monitor user reviews and ratings
- View top-rated freelancers
- Rating distribution analytics
- Flagged review management

### 🆘 Support Center
- Manage support tickets
- Track ticket status and priorities
- Team performance metrics
- Ticket categorization

### 🔐 Admin Management (Super Admin Only)
- Create and manage admin users
- Role management (admin/super_admin)
- Password reset functionality
- Admin activity tracking

## Tech Stack

- **Framework**: Next.js 13+ (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT tokens via custom context
- **API Integration**: RESTful API with FastAPI backend

## Setup Instructions

### Prerequisites

- Node.js 16+ installed
- Backend API running on `http://localhost:8000`

### Installation

1. Navigate to the admin dashboard directory:
```bash
cd admin-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env.local` file with:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3001](http://localhost:3001) in your browser

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
admin-dashboard/
├── components/
│   ├── AdminLayout.tsx      # Main layout with sidebar and navigation
│   └── ...
├── context/
│   └── AdminAuthContext.tsx # Authentication context and hooks
├── pages/
│   ├── index.tsx            # Dashboard overview
│   ├── login.tsx            # Admin login page
│   ├── users.tsx            # User management
│   ├── analytics.tsx        # Platform analytics
│   ├── ai-systems.tsx       # AI systems monitoring
│   ├── blockchain.tsx       # Blockchain management
│   ├── projects.tsx         # Project management
│   ├── reputation.tsx       # Reputation system
│   ├── support.tsx          # Support center
│   ├── admin-management.tsx # Admin user management
│   └── _app.tsx             # App wrapper with providers
├── styles/
│   └── globals.css          # Global styles and Tailwind
├── .env.local               # Environment variables
└── package.json
```

## Authentication

### Admin Roles

1. **Super Admin**
   - Full access to all features
   - Can manage other admins
   - Access to admin management page

2. **Admin**
   - Access to all features except admin management
   - Can manage users, projects, and support

### Login Flow

1. Navigate to `/login`
2. Enter admin email and password
3. System verifies admin role on backend
4. JWT token stored in localStorage
5. Redirect to dashboard

### Session Management

- Tokens stored in `localStorage`
- Session verification on page load
- Auto-redirect to login if unauthorized
- Manual logout available in header

## API Integration

All API calls use the pattern:
```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/admin/endpoint`,
  {
    headers: { 
      'Authorization': `Bearer ${token}` 
    }
  }
);
```

### Key Endpoints

- `POST /api/v1/auth/login` - Admin login
- `GET /api/v1/admin/dashboard/stats` - Dashboard statistics
- `GET /api/v1/admin/dashboard/activity` - Recent activity
- `GET /api/v1/admin/users` - User list with filters
- `GET /api/v1/admin/analytics/*` - Analytics data
- `GET /api/v1/admin/users/admins` - Admin user list
- `POST /api/v1/admin/users/create-admin` - Create admin

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Super admin restrictions for sensitive operations
- Token expiration handling
- Secure password reset flow
- Activity logging for audit trails

## Styling

### Custom CSS Classes

The dashboard uses custom Tailwind CSS classes defined in `globals.css`:

- `.admin-card` - Standard card container
- `.admin-button-primary` - Primary action button
- `.admin-button-secondary` - Secondary button
- `.admin-button-danger` - Destructive action button
- `.admin-input` - Form input field
- `.admin-select` - Select dropdown
- `.stat-card` - Dashboard stat card

### Color Scheme

- Primary: Blue (#2563EB)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Danger: Red (#EF4444)
- Neutral: Gray scale

## Development

### Adding New Pages

1. Create page component in `pages/`
2. Add route to navigation in `AdminLayout.tsx`
3. Implement authentication check
4. Connect to backend API endpoints

### Creating New Components

Follow the existing pattern:
```typescript
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function NewPage() {
  const { admin, token, isLoading } = useAdminAuth();
  
  // Auth check
  useEffect(() => {
    if (!isLoading && !admin) {
      router.push('/login');
    }
  }, [admin, isLoading, router]);
  
  // Component logic...
}
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Set environment variables
4. Deploy

### Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

**Login fails with network error**
- Verify backend is running on correct port
- Check NEXT_PUBLIC_API_URL in .env.local
- Ensure CORS is configured on backend

**403 Forbidden errors**
- Verify user has admin or super_admin role
- Check JWT token is valid
- Confirm endpoint requires correct role level

**Pages not loading**
- Clear browser cache and localStorage
- Restart development server
- Check for console errors

## Support

For issues or questions:
1. Check backend API logs
2. Verify user permissions
3. Review browser console for errors
4. Check network tab for failed requests

## License

Proprietary - FreelanceX Platform
