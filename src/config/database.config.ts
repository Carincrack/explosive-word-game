import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: process.env.MYSQLHOST || configService.get<string>('DB_HOST'),
  port: parseInt(
    process.env.MYSQLPORT || String(configService.get<number>('DB_PORT')),
    10,
  ),
  username: process.env.MYSQLUSER || configService.get<string>('DB_USERNAME'),
  password:
    process.env.MYSQLPASSWORD || configService.get<string>('DB_PASSWORD'),
  database: process.env.MYSQLDATABASE || configService.get<string>('DB_NAME'),
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  synchronize: false,
  logging: ['schema', 'error'],
});
