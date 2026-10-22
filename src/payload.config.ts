import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Tags } from './collections/Tags'
import { Articles } from './collections/Articles'
import { Notes } from './collections/Notes'
import { Pages } from './collections/Pages'
import { Comments } from './collections/Comments'
import { Bookmarks } from './collections/Bookmarks'
import { MEDIA_MAX_FILE_SIZE } from './collections/mediaLimits'
import { getDatabaseAdapter } from './db/adapter'
import { createEmailAdapter } from './auth/emailAdapter'
import { googleOAuthPlugin } from './auth/googleOAuth'
import { getServerUrl } from './auth/serverUrl'
import { editor } from './editor/lexical'
import { createR2StoragePlugin } from './storage/r2'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const serverURL = getServerUrl()
const emailAdapter = createEmailAdapter()
export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Blog Admin',
      description: 'CMS for the personal blog — one-author publishing workflow.',
    },
  },
  // Order within admin.group: Content → Taxonomy → Community → System (step 033).
  collections: [Articles, Notes, Pages, Media, Categories, Tags, Comments, Bookmarks, Users],
  localization: {
    locales: [
      { code: 'uk', label: 'Ukrainian' },
      { code: 'ru', label: 'Russian' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'uk',
    fallback: true,
  },
  editor,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: getDatabaseAdapter(),
  ...(emailAdapter ? { email: emailAdapter } : {}),
  sharp,
  // Same-origin Next app: CSRF allowlist + CORS for the public origin (step 030).
  csrf: [serverURL],
  cors: [serverURL],
  // Collection UploadConfig has no per-collection fileSize; Busboy limit is global.
  upload: {
    limits: {
      fileSize: MEDIA_MAX_FILE_SIZE,
    },
  },
  plugins: [googleOAuthPlugin, createR2StoragePlugin()],
})
