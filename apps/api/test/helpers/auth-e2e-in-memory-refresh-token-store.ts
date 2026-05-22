import { randomUUID } from 'node:crypto';
import { hashRefreshToken } from '../../src/auth/refresh-token-hash';
import type { RefreshToken } from '../../src/auth/refresh-token.entity';

/** In-memory RefreshTokenService shape for auth flow e2e (login → refresh share state). */
export type InMemoryRefreshTokenServiceOverride = {
  persistForUser: (params: {
    userId: string;
    rawToken: string;
    expiresAt: Date;
  }) => Promise<RefreshToken>;
  findByRawToken: (rawToken: string) => Promise<RefreshToken | null>;
  findActiveByRawToken: (rawToken: string) => Promise<RefreshToken | null>;
  revokeAllActiveForUser: (userId: string) => Promise<void>;
  revoke: (id: string) => Promise<void>;
  markReplaced: (id: string, replacedById: string) => Promise<void>;
  revokeTokenFamily: (anchorId: string) => Promise<void>;
};

export function createInMemoryRefreshTokenServiceOverride(): InMemoryRefreshTokenServiceOverride {
  const byHash = new Map<string, RefreshToken>();
  const byId = new Map<string, RefreshToken>();

  const findByHash = (tokenHash: string): RefreshToken | null =>
    byHash.get(tokenHash) ?? null;

  const collectFamilyTokenIds = (anchorId: string): string[] => {
    const ids = new Set<string>();
    let currentId: string | null = anchorId;

    while (currentId !== null) {
      ids.add(currentId);
      const row = byId.get(currentId);
      currentId = row?.replacedByTokenId ?? null;
    }

    let childId: string = anchorId;
    for (;;) {
      const parent = [...byId.values()].find(
        (row) => row.replacedByTokenId === childId,
      );
      if (parent === undefined) {
        break;
      }
      ids.add(parent.id);
      childId = parent.id;
    }

    return [...ids];
  };

  return {
    persistForUser(params: {
      userId: string;
      rawToken: string;
      expiresAt: Date;
    }): Promise<RefreshToken> {
      const tokenHash = hashRefreshToken(params.rawToken);
      const token: RefreshToken = {
        id: randomUUID(),
        userId: params.userId,
        tokenHash,
        expiresAt: params.expiresAt,
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
      } as RefreshToken;

      byHash.set(tokenHash, token);
      byId.set(token.id, token);
      return Promise.resolve(token);
    },

    findByRawToken(rawToken: string): Promise<RefreshToken | null> {
      return Promise.resolve(findByHash(hashRefreshToken(rawToken)));
    },

    findActiveByRawToken(rawToken: string): Promise<RefreshToken | null> {
      const row = findByHash(hashRefreshToken(rawToken));
      if (row === null) {
        return Promise.resolve(null);
      }
      if (row.revokedAt !== null || row.expiresAt <= new Date()) {
        return Promise.resolve(null);
      }
      return Promise.resolve(row);
    },

    revokeAllActiveForUser(userId: string): Promise<void> {
      const now = new Date();
      for (const row of byId.values()) {
        if (row.userId === userId && row.revokedAt === null) {
          row.revokedAt = now;
        }
      }
      return Promise.resolve();
    },

    revoke(id: string): Promise<void> {
      const row = byId.get(id);
      if (row !== undefined && row.revokedAt === null) {
        row.revokedAt = new Date();
      }
      return Promise.resolve();
    },

    markReplaced(id: string, replacedById: string): Promise<void> {
      const row = byId.get(id);
      if (row !== undefined) {
        row.replacedByTokenId = replacedById;
        row.revokedAt = new Date();
      }
      return Promise.resolve();
    },

    revokeTokenFamily(anchorId: string): Promise<void> {
      const ids = collectFamilyTokenIds(anchorId);
      const now = new Date();
      for (const id of ids) {
        const row = byId.get(id);
        if (row !== undefined && row.revokedAt === null) {
          row.revokedAt = now;
        }
      }
      return Promise.resolve();
    },
  };
}
