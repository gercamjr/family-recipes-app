# Media Table Implementation - Multiple Media Support

## Overview

Updated the Family Recipes App to properly use the Media table for storing multiple images and videos per recipe, as per the original requirements.

## Changes Made

### 1. Backend - Prisma Schema

**File:** `backend/prisma/schema.prisma`

- **Removed** `imageUrl` field from Recipe model (was never actually added to database)
- **Kept** the existing Media model with proper relationships:

  ```prisma
  model Recipe {
    // ... other fields
    media    Media[]   @relation("RecipeMedia")
  }

  model Media {
    id       Int     @id @default(autoincrement())
    url      String  @map("url")
    type     String  @map("type") // 'image' or 'video'
    filename String? @map("filename")
    size     Int?    @map("size")
    mimeType String? @map("mimeType")
    recipe   Recipe  @relation("RecipeMedia", fields: [recipeId], references: [id])
    recipeId Int     @map("recipeId")
  }
  ```

### 2. Backend - Upload Route

**File:** `backend/routes/upload.js`

- **Enhanced** `POST /api/upload` endpoint to return complete media metadata:
  ```javascript
  {
    url: result.secure_url,
    publicId: result.public_id,
    type: mediaType,        // 'image' or 'video'
    filename: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
  }
  ```
- Added `resource_type: 'auto'` to Cloudinary config for auto-detecting videos
- Returns full media object ready for database insertion

### 3. Backend - Recipes Routes

**File:** `backend/routes/recipes.js`

#### POST /api/recipes (Create Recipe)

- **Added** `media` array parameter support
- **Kept** `image_url` for backwards compatibility (deprecated)
- Creates Media records along with Recipe:
  ```javascript
  media: {
    create: media?.map((m) => ({
      url: m.url,
      type: m.type,
      filename: m.filename,
      size: m.size,
      mimeType: m.mimeType,
    }))
  }
  ```

#### PUT /api/recipes/:id (Update Recipe)

- **Added** media update logic
- Deletes existing media and creates new ones when media array is provided
- Properly handles snake_case (`prep_time`, `cook_time`) to camelCase conversion

#### GET Routes

- **Updated** all GET routes to include `media: true` in Prisma queries
- Recipes now return with their associated media items

### 4. Backend - Validation

**File:** `backend/utils/validation.js`

- **Added** media array validation:
  ```javascript
  media: z.array(
    z.object({
      url: z.string().url(),
      type: z.enum(['image', 'video']),
      filename: z.string().optional(),
      size: z.number().optional(),
      mimeType: z.string().optional(),
    })
  ).optional()
  ```
- Kept `image_url` validation for backwards compatibility (deprecated)

### 5. Frontend - RecipeForm Component

**File:** `frontend/src/components/recipes/RecipeForm.jsx`

#### State Management

- **Replaced** single `imageFile` and `imagePreview` with:
  - `mediaFiles` - Array of File objects to upload
  - `mediaPreviews` - Array of preview URLs for display
  - `uploadedMedia` - Array of uploaded media metadata

#### File Upload Handler

- **Updated** `handleImageChange` to support multiple file selection
- Creates preview for each selected file
- Supports both images and videos (`accept='image/*,video/*'`)

#### Media Management

- **Added** `removeMedia(index)` function to remove media items
- Displays media in a responsive grid (2 cols on mobile, 3 on desktop)
- Shows delete button on hover for each media item

#### Form Submission

- **Updated** `onSubmit` to:
  1. Upload all new media files sequentially
  2. Combine with existing uploaded media
  3. Send complete media array to backend
  4. Remove deprecated `image_url` field

#### UI Updates

- **Replaced** single image upload UI with multi-media grid
- Shows existing media when editing
- Visual feedback with thumbnails
- Remove button with hover effect
- Accepts multiple files via file input

### 6. Internationalization

**Files:** `frontend/src/i18n/locales/en.json`, `frontend/src/i18n/locales/es.json`

Added translation keys:

- `recipes.media` - "Media (Images/Videos)" / "Medios (Imágenes/Videos)"
- `recipes.addMedia` - "Add Media" / "Agregar Medios"
- `recipes.mediaHelp` - Help text for media upload

## API Response Format

### Recipe with Media

```json
{
  "recipe": {
    "id": 1,
    "title_en": "Lemonade",
    "title_es": "Limonada",
    // ... other recipe fields
    "media": [
      {
        "id": 1,
        "url": "https://res.cloudinary.com/.../image1.jpg",
        "type": "image",
        "filename": "lemonade.jpg",
        "size": 245678,
        "mimeType": "image/jpeg",
        "recipeId": 1
      },
      {
        "id": 2,
        "url": "https://res.cloudinary.com/.../video1.mp4",
        "type": "video",
        "filename": "making-lemonade.mp4",
        "size": 1234567,
        "mimeType": "video/mp4",
        "recipeId": 1
      }
    ]
  }
}
```

## Database Schema

No migration was needed since the `image_url` column was never added to the database. The Media table already exists with the correct structure.

## Backwards Compatibility

- The `image_url` field is still accepted in API requests (deprecated)
- If provided alone, it creates a single media record
- Frontend handles both old recipes (with `image_url`) and new ones (with `media` array)

## Testing Recommendations

1. **Create new recipe** with multiple images
2. **Edit existing recipe** and add/remove media
3. **Upload video** to verify video support
4. **Test media deletion** when updating recipe
5. **Verify media display** in recipe details view (needs update)
6. **Check mobile responsiveness** of media grid

## Next Steps

1. **Update RecipeDetail component** to display multiple media items
2. **Add media carousel/gallery** for better viewing experience
3. **Implement video player** for video media types
4. **Add image optimization** before upload
5. **Consider lazy loading** for media-heavy recipes
6. **Update tests** to cover media functionality

## Breaking Changes

⚠️ **Frontend API calls now send `media` array instead of `image_url`**

- Old recipes with `image_url` will still work via backwards compatibility
- New recipes will use proper Media table relationships

## Files Modified

### Backend

- `backend/prisma/schema.prisma`
- `backend/routes/upload.js`
- `backend/routes/recipes.js`
- `backend/utils/validation.js`

### Frontend

- `frontend/src/components/recipes/RecipeForm.jsx`
- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/es.json`

### Documentation

- `docs/MEDIA_TABLE_IMPLEMENTATION.md` (this file)
