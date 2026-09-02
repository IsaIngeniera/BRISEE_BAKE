import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { CarritoModule } from './carrito/carrito.module';

@Module({
  imports: [ProductsModule, AuthModule, CarritoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
