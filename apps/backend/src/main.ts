
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Security Headers
    app.use(helmet());

    // CORS - Allow Frontend
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Strict origin
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    // Global Validation
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true, // Strip unseen properties
        forbidNonWhitelisted: true, // Throw error on unseen properties
        transform: true, // Auto-transform payloads to DTO instances
    }));

    await app.listen(process.env.PORT ?? 3000);
    console.log(`Application is running on: ${await app.getUrl()} `);
}
bootstrap();
