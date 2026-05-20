import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createCliDataSourceOptions } from './create-typeorm-options';
import { loadCliEnv } from './load-cli-env';

export default new DataSource(createCliDataSourceOptions(loadCliEnv()));
