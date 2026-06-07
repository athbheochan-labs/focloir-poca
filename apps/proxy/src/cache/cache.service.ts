import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

const TTL_SECONDS = 3600; // 1 hour

interface MemEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private readonly mem = new Map<string, MemEntry>();

  async onModuleInit() {
    const client = new Redis({
      host: 'localhost',
      port: 6379,
      lazyConnect: true,
      // Don't retry — if Valkey is absent at startup we fall back to in-memory
      // immediately rather than spamming reconnect attempts.
      retryStrategy: () => null,
    });
    // Attach before connect() so any ECONNREFUSED during the probe is handled.
    client.on('error', () => {});

    try {
      await client.connect();
      this.redis = client;
      // Replace the silent handler with a real one for post-startup errors.
      this.redis.on('error', (err: Error) =>
        this.logger.warn(`Cache: Valkey error — ${err.message}`),
      );
      this.logger.log('Cache: connected to Valkey');
    } catch {
      client.disconnect();
      this.logger.warn('Cache: Valkey unavailable — using in-memory fallback');
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    const entry = this.mem.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.mem.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set(key: string, value: unknown): Promise<void> {
    const serialized = JSON.stringify(value);
    if (this.redis) {
      await this.redis.setex(key, TTL_SECONDS, serialized);
      return;
    }
    this.mem.set(key, {
      value: serialized,
      expiresAt: Date.now() + TTL_SECONDS * 1000,
    });
  }
}
