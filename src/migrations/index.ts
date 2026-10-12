import * as migration_20261006_072604_baseline from './20261006_072604_baseline'
import * as migration_20261012_083247_users_role from './20261012_083247_users_role'

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
]
