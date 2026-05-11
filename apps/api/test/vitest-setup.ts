/**
 * Vitest setup file shared by unit and e2e configs.
 *
 * `reflect-metadata` MUST be imported before any code that relies on
 * NestJS dependency injection or decorator metadata (controllers,
 * providers, modules, pipes, etc.). Without it, `Test.createTestingModule`
 * will fail with "Cannot read properties of undefined (reading 'prototype')"
 * or similar metadata-related errors.
 */
import 'reflect-metadata';
