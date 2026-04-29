# Free/Paid PDF & Ebook Resources Setup Guide

## Overview
This system allows admins to upload and manage free/paid PDF and eBook resources for users without redeploying the app.

## Components
1. **Database Table**: `resources` (Supabase)
2. **Admin Panel**: `/admin/resources` - CRUD operations
3. **User Pages**: 
   - `/resources/free` - Free downloads for all users
   - `/resources/paid` - Paid resources (requires payment)
4. **Storage**: Supabase Storage bucket `resources`

## One-Time Setup

### 1. Create Supabase Storage Bucket
```bash
# In Supabase dashboard:
# Storage → Create new bucket → Name: "resources"
# Privacy: Private (access via signed URLs)
```

### 2. Run Database Migration
```bash
# In Supabase SQL Editor, paste and run:
# supabase/sql/003_resources_table.sql

# Or via CLI:
# supabase migration up
```

### 3. Create Admin User
In Supabase Auth Users table, set the user's `raw_user_meta_data`:
```json
{
  "role": "admin"
}
```

## Admin Panel Usage

### Access
Go to `/admin/resources` (requires authentication + admin role)

### Upload Resource
1. Enter title
2. Select file (PDF, EPUB, DOC, DOCX)
3. Toggle "Free" or "Paid"
4. Toggle "Visible" to show/hide
5. Set order (lower = first)
6. Click "Upload Resource"

### Manage Resources
- **Hide/Show**: Toggle visibility without deleting
- **Delete**: Remove resource and file
- **Order**: Controls display sequence on user pages

## User Flow

### Free Users
- Visit `/resources/free`
- Click title to download directly
- No payment required

### Paid Resources
- Free users: Click → redirects to `/payment`
- Paid users: Direct download (when access check implemented)

## Database Schema

```sql
resources (
  id UUID (primary key),
  title TEXT,
  file_url TEXT,
  is_free BOOLEAN,
  visible BOOLEAN,
  order INTEGER,
  size_bytes INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## File Management

Files are stored in `supabase/storage/resources/` bucket.
- Naming: `{timestamp}-{filename}`
- Public URLs are accessible via file_url
- Delete: both DB record AND storage file

## Next Steps
- [ ] Implement Supabase Storage initialization
- [ ] Add admin authentication middleware
- [ ] Set up paid resource access control
- [ ] Add signed URL generation for secure downloads
- [ ] Implement file delete from storage
