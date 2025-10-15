# 🔄 Migration Guide - Upgrading to v2.0

**Target Audience:** Developers working on CraftNexus  
**Estimated Time:** 2-4 hours for full migration  
**Difficulty:** Intermediate

---

## 📋 **Table of Contents**

1. [Prerequisites](#prerequisites)
2. [Step-by-Step Migration](#step-by-step-migration)
3. [Component Migration Examples](#component-migration-examples)
4. [Common Patterns](#common-patterns)
5. [Troubleshooting](#troubleshooting)

---

## ✅ **Prerequisites**

### **1. Install Dependencies**
```bash
cd frontend
npm install
```

### **2. Verify Installation**
```bash
npm run type-check
```

### **3. Backup Current Code**
```bash
git checkout -b upgrade-v2
git add .
git commit -m "Backup before v2 upgrade"
```

---

## 🚀 **Step-by-Step Migration**

### **Step 1: Update _app.tsx**

**Before:**
```typescript
// pages/_app.tsx
import { AuthProvider } from '../context/AuthContext'
import { RBACProvider } from '../context/RBACContext'

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <RBACProvider>
        <Component {...pageProps} />
      </RBACProvider>
    </AuthProvider>
  )
}
```

**After:**
```typescript
// pages/_app.tsx
import { Providers } from '@/components/Providers'
import '@/styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  )
}

export default MyApp
```

---

### **Step 2: Migrate Authentication**

**Before (Context API):**
```typescript
import { useAuth } from '@/context/AuthContext'

function Dashboard() {
  const { user, login, logout } = useAuth()
  
  return <div>Welcome {user?.username}</div>
}
```

**After (Zustand):**
```typescript
import { useAppStore } from '@/stores/useAppStore'

function Dashboard() {
  const user = useAppStore((state) => state.user)
  const login = useAppStore((state) => state.login)
  const logout = useAppStore((state) => state.logout)
  
  return <div>Welcome {user?.username}</div>
}
```

---

### **Step 3: Migrate API Calls**

**Before (Manual fetch):**
```typescript
function ProjectsList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const response = await fetch('/api/v1/projects')
        const data = await response.json()
        setProjects(data)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <div>{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div>
}
```

**After (React Query):**
```typescript
import { useProjects } from '@/hooks/useApi'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'

function ProjectsList() {
  const { data: projects, isLoading, error } = useProjects(1, {})
  
  if (isLoading) return <SkeletonLoader count={3} />
  if (error) return <Alert variant="error">{error.message}</Alert>
  
  return <div>{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div>
}
```

**Benefits:**
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Loading states handled
- ✅ Error handling built-in
- ✅ 70% less code

---

### **Step 4: Migrate Search with Debounce**

**Before:**
```typescript
function SearchBar() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])
  
  useEffect(() => {
    if (debouncedSearch) {
      fetchResults(debouncedSearch)
    }
  }, [debouncedSearch])
  
  return <input value={search} onChange={(e) => setSearch(e.target.value)} />
}
```

**After:**
```typescript
import { useDebounce } from '@/hooks'

function SearchBar() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  
  const { data } = useProjects(1, { search: debouncedSearch })
  
  return <input value={search} onChange={(e) => setSearch(e.target.value)} />
}
```

---

### **Step 5: Migrate Responsive Design**

**Before:**
```typescript
function Dashboard() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile ? <MobileDashboard /> : <DesktopDashboard />
}
```

**After:**
```typescript
import { useIsMobile } from '@/hooks'

function Dashboard() {
  const isMobile = useIsMobile()
  
  return isMobile ? <MobileDashboard /> : <DesktopDashboard />
}
```

---

### **Step 6: Migrate Forms**

**Before:**
```typescript
function ProjectForm() {
  const [values, setValues] = useState({ title: '', description: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  
  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value })
  }
  
  const validate = () => {
    const newErrors = {}
    if (!values.title) newErrors.title = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    
    setSubmitting(true)
    try {
      await createProject(values)
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="title" value={values.title} onChange={handleChange} />
      {errors.title && <span>{errors.title}</span>}
      <button disabled={submitting}>Submit</button>
    </form>
  )
}
```

**After:**
```typescript
import { useForm } from '@/hooks'
import { useCreateProject } from '@/hooks/useApi'

function ProjectForm() {
  const createProject = useCreateProject()
  
  const { values, errors, handleChange, handleSubmit, isSubmitting } = useForm({
    initialValues: { title: '', description: '' },
    onSubmit: async (values) => {
      await createProject.mutateAsync(values)
    },
    validate: (values) => {
      const errors = {}
      if (!values.title) errors.title = 'Required'
      return errors
    }
  })
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="title" value={values.title} onChange={handleChange} />
      {errors.title && <span>{errors.title}</span>}
      <button disabled={isSubmitting}>Submit</button>
    </form>
  )
}
```

---

## 🎯 **Common Patterns**

### **Pattern 1: Notifications**

**Before:**
```typescript
import toast from 'react-hot-toast'

toast.success('Project created!')
```

**After (Zustand Store):**
```typescript
import { useAppStore } from '@/stores/useAppStore'

const addNotification = useAppStore((state) => state.addNotification)

addNotification({
  type: 'success',
  title: 'Success!',
  message: 'Project created successfully'
})
```

---

### **Pattern 2: Loading States**

**Before:**
```typescript
{loading && <div>Loading...</div>}
```

**After:**
```typescript
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'

{isLoading && <SkeletonLoader count={3} />}
```

---

### **Pattern 3: Error Handling**

**Before:**
```typescript
{error && <div className="text-red-500">{error.message}</div>}
```

**After:**
```typescript
import { Alert } from '@/components/ui/Alert'

{error && <Alert variant="error" title="Error">{error.message}</Alert>}
```

---

### **Pattern 4: Copy to Clipboard**

**Before:**
```typescript
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('Copied!')
  } catch (err) {
    console.error(err)
  }
}
```

**After:**
```typescript
import { useClipboard } from '@/hooks'

const { copy, isCopied } = useClipboard()

<button onClick={() => copy(text)}>
  {isCopied ? 'Copied!' : 'Copy'}
</button>
```

---

### **Pattern 5: Keyboard Shortcuts**

**Before:**
```typescript
useEffect(() => {
  const handleKeyPress = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      openSearch()
    }
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [])
```

**After:**
```typescript
import { useKeyboardShortcut } from '@/hooks'

useKeyboardShortcut(['k'], openSearch, { ctrl: true })
```

---

## 🐛 **Troubleshooting**

### **Issue 1: "Cannot find module '@/stores/useAppStore'"**

**Solution:**
Ensure TypeScript paths are configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

### **Issue 2: "React Query hooks can only be used inside QueryClientProvider"**

**Solution:**
Make sure `Providers` component is wrapping your app in `_app.tsx`.

---

### **Issue 3: "Zustand store returns undefined"**

**Solution:**
Check that you're using the correct selector:
```typescript
// ❌ Wrong
const user = useAppStore().user

// ✅ Correct
const user = useAppStore((state) => state.user)
```

---

### **Issue 4: "PWA not installing"**

**Solution:**
1. Ensure manifest.json is linked in _document.tsx
2. Check service worker is registered
3. Verify HTTPS in production
4. Check browser console for errors

---

### **Issue 5: "TypeScript errors after upgrade"**

**Solution:**
```bash
# Clear TypeScript cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstall
npm install

# Type check
npm run type-check
```

---

## ✅ **Migration Checklist**

- [ ] Install new dependencies
- [ ] Update _app.tsx with Providers
- [ ] Migrate authentication to Zustand
- [ ] Replace manual API calls with React Query hooks
- [ ] Update search with useDebounce
- [ ] Replace responsive checks with useMediaQuery
- [ ] Migrate forms to useForm hook
- [ ] Update notifications to use Zustand store
- [ ] Replace loading states with SkeletonLoader
- [ ] Update error displays with Alert component
- [ ] Test all pages
- [ ] Test PWA installation
- [ ] Run type check
- [ ] Run tests
- [ ] Deploy to staging

---

## 📚 **Additional Resources**

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Next.js 15 Migration Guide](https://nextjs.org/docs/upgrading)
- [PWA Best Practices](https://web.dev/pwa/)

---

## 🎉 **You're Done!**

Your codebase is now using modern React patterns with:
- ✅ Centralized state management
- ✅ Professional data fetching
- ✅ Reusable custom hooks
- ✅ Better performance
- ✅ Easier maintenance

**Happy coding! 🚀**
