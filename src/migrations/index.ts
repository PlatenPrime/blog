import * as migration_20261006_072604_baseline from './20261006_072604_baseline';

export const migrations = [
  {
    up: migration_20261006_072604_baseline.up,
    down: migration_20261006_072604_baseline.down,
    name: '20261006_072604_baseline'
  },
];
