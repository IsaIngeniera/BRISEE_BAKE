/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - AuthController
 *
 * Verifica el comportamiento del controlador de autenticación:
 * - Delegación correcta al servicio
 * - Manejo de errores y respuestas HTTP
 * - Validaciones de autorización
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../../src/common/guards/jwt-auth.guard';
import { Rol } from '@prisma/client';

describe('AuthController [QA]', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    loginMockAdmin: jest.Mock;
    updateProfile: jest.Mock;
    loginGoogle: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      loginMockAdmin: jest.fn(),
      updateProfile: jest.fn(),
      loginGoogle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  // ============================================================
  // POST /auth/register
  // ============================================================
  describe('POST /register', () => {
    const registerDto = {
      nombre: 'Juan',
      apellido: 'Pérez',
      correo: 'juan@example.com',
      password: 'password123',
      celular: '3001234567',
      fechaNacimiento: '1990-01-01',
    };

    it('debe llamar a authService.register con el DTO correcto', async () => {
      const expectedResponse = {
        message: 'Registro exitoso',
        access_token: 'token-123',
      };
      authService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });

    it('debe propagar errores del servicio al controlador', async () => {
      authService.register.mockRejectedValue(new Error('Correo ya registrado'));

      await expect(controller.register(registerDto)).rejects.toThrow(
        'Correo ya registrado',
      );
    });

    it('debe retornar el token JWT en la respuesta', async () => {
      authService.register.mockResolvedValue({
        message: 'Registro exitoso',
        access_token: 'jwt-abc-123',
      });

      const result = await controller.register(registerDto);

      expect(result).toHaveProperty('access_token');
    });
  });

  // ============================================================
  // POST /auth/login
  // ============================================================
  describe('POST /login', () => {
    const loginDto = {
      correo: 'juan@example.com',
      password: 'password123',
    };

    it('debe llamar a authService.login con el DTO correcto', async () => {
      const expectedResponse = { access_token: 'token-123' };
      authService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResponse);
    });

    it('debe propagar UnauthorizedException correctamente', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException(
          'Nombre de Usuario y/o contraseñas incorrectas',
        ),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('no debe retornar información sensible en la respuesta', async () => {
      authService.login.mockResolvedValue({ access_token: 'token-123' });

      const result = await controller.login(loginDto);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('user');
    });
  });

  // ============================================================
  // POST /auth/login-admin
  // ============================================================
  describe('POST /login-admin', () => {
    it('debe llamar a authService.loginMockAdmin', async () => {
      const expectedResponse = { access_token: 'admin-token-123' };
      authService.loginMockAdmin.mockResolvedValue(expectedResponse);

      const result = await controller.loginAdmin();

      expect(authService.loginMockAdmin).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it('debe retornar un token válido', async () => {
      authService.loginMockAdmin.mockResolvedValue({
        access_token: 'admin-jwt',
      });

      const result = await controller.loginAdmin();

      expect(result).toHaveProperty('access_token');
    });
  });

  // ============================================================
  // PATCH /auth/profile
  // ============================================================
  describe('PATCH /profile', () => {
    const updateDto = {
      nombre: 'Juan Carlos',
      apellido: 'Pérez López',
      celular: '3109876543',
    };

    const createMockRequest = (userId?: string) =>
      ({
        user: userId ? { sub: userId } : undefined,
      }) as any;

    it('debe actualizar el perfil del usuario autenticado', async () => {
      const req = createMockRequest('user-123');
      const expectedResponse = {
        message: 'Perfil actualizado exitosamente',
        user: {
          id: 'user-123',
          nombre: 'Juan Carlos',
          apellido: 'Pérez López',
          correo: 'juan@example.com',
          rol: Rol.CLIENTE,
        },
      };
      authService.updateProfile.mockResolvedValue(expectedResponse);

      const result = await controller.updateProfile(req, updateDto);

      expect(authService.updateProfile).toHaveBeenCalledWith(
        'user-123',
        updateDto,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debe lanzar UnauthorizedException si no hay user en el request', async () => {
      const req = createMockRequest();

      await expect(controller.updateProfile(req, updateDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.updateProfile(req, updateDto)).rejects.toThrow(
        'Usuario no válido',
      );

      expect(authService.updateProfile).not.toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException si user.sub es undefined', async () => {
      const req = { user: {} } as any;

      await expect(controller.updateProfile(req, updateDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe propagar errores del servicio', async () => {
      const req = createMockRequest('user-123');
      authService.updateProfile.mockRejectedValue(
        new Error('Error al actualizar'),
      );

      await expect(controller.updateProfile(req, updateDto)).rejects.toThrow(
        'Error al actualizar',
      );
    });

    it('la respuesta no debe exponer la contraseña del usuario', async () => {
      const req = createMockRequest('user-123');
      authService.updateProfile.mockResolvedValue({
        message: 'Perfil actualizado exitosamente',
        user: {
          id: 'user-123',
          nombre: 'Juan',
          correo: 'juan@example.com',
        },
      });

      const result = await controller.updateProfile(req, updateDto);

      expect(result.user).not.toHaveProperty('password');
    });
  });

  // ============================================================
  // POST /auth/google (HU-14 SSO)
  // ============================================================
  describe('POST /google (HU-14 SSO)', () => {
    const validGoogleDto = {
      credential: 'mock-google-credential-token',
    };

    it('debe delegar a authService.loginGoogle con el DTO recibido', async () => {
      const expectedResponse = {
        message: 'Inicio de sesión exitoso',
        access_token: 'jwt-google-123',
        user: {
          id: 'google-user-1',
          nombre: 'Ana',
          apellido: 'Gómez',
          correo: 'ana.gomez@gmail.com',
          rol: Rol.CLIENTE,
        },
        isNewUser: false,
      };
      authService.loginGoogle.mockResolvedValue(expectedResponse);

      const result = await controller.googleLogin(validGoogleDto);

      expect(authService.loginGoogle).toHaveBeenCalledWith(validGoogleDto);
      expect(result).toEqual(expectedResponse);
      expect(result).toHaveProperty('access_token');
    });

    it('debe responder exitosamente con creación automática en primer ingreso', async () => {
      const newUserResponse = {
        message: 'Usuario registrado exitosamente con Google',
        access_token: 'jwt-new-user-token',
        user: {
          id: 'new-user-uuid',
          nombre: 'Carlos',
          apellido: 'Pérez',
          correo: 'carlos@gmail.com',
          rol: Rol.CLIENTE,
        },
        isNewUser: true,
      };
      authService.loginGoogle.mockResolvedValue(newUserResponse);

      const result = await controller.googleLogin({
        idToken: 'mock-id-token',
      });

      expect(result.isNewUser).toBe(true);
      expect(result.access_token).toBe('jwt-new-user-token');
    });

    it('debe propagar errores cuando el usuario cancela la ventana emergente', async () => {
      authService.loginGoogle.mockRejectedValue(
        new BadRequestException(
          'El proceso de autenticación con Google fue cancelado o rechazado',
        ),
      );

      await expect(
        controller.googleLogin({ error: 'popup_closed_by_user' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe propagar UnauthorizedException si el token de Google es inválido', async () => {
      authService.loginGoogle.mockRejectedValue(
        new UnauthorizedException(
          'Credenciales de Google inválidas o expiradas',
        ),
      );

      await expect(
        controller.googleLogin({ credential: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('no debe exponer el hash de la contraseña en los datos del usuario', async () => {
      authService.loginGoogle.mockResolvedValue({
        message: 'Inicio de sesión exitoso',
        access_token: 'jwt-token',
        user: {
          id: 'user-1',
          nombre: 'Ana',
          correo: 'ana@gmail.com',
        },
      });

      const result = await controller.googleLogin(validGoogleDto);
      expect(result).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('password');
    });
  });
});
