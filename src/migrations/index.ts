import * as migration_20261006_072604_baseline from './20261006_072604_baseline'
import * as migration_20261012_083247_users_role from './20261012_083247_users_role'
import * as migration_20261019_105134_categories_tags from './20261019_105134_categories_tags'
import * as migration_20261019_134452_articles from './20261019_134452_articles'
import * as migration_20261020_085631_notes from './20261020_085631_notes'
import * as migration_20261020_100223_pages from './20261020_100223_pages'
import * as migration_20261020_104138_comments from './20261020_104138_comments'
import * as migration_20261020_113306_bookmarks from './20261020_113306_bookmarks'

export const migrations = [
  {
    up: migration_20261006_072604_baseline.up,
    down: migration_20261006_072604_baseline.down,
    name: '20261006_072604_baseline',
  },
  {
    up: migration_20261012_083247_users_role.up,
    down: migration_20261012_083247_users_role.down,
    name: '20261012_083247_users_role',
  },
  {
    up: migration_20261019_105134_categories_tags.up,
    down: migration_20261019_105134_categories_tags.down,
    name: '20261019_105134_categories_tags',
  },
  {
    up: migration_20261019_134452_articles.up,
    down: migration_20261019_134452_articles.down,
    name: '20261019_134452_articles',
  },
  {
    up: migration_20261020_085631_notes.up,
    down: migration_20261020_085631_notes.down,
    name: '20261020_085631_notes',
  },
  {
    up: migration_20261020_100223_pages.up,
    down: migration_20261020_100223_pages.down,
    name: '20261020_100223_pages',
  },
  {
    up: migration_20261020_104138_comments.up,
    down: migration_20261020_104138_comments.down,
    name: '20261020_104138_comments',
  },
  {
    up: migration_20261020_113306_bookmarks.up,
    down: migration_20261020_113306_bookmarks.down,
    name: '20261020_113306_bookmarks',
  },
]
