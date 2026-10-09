/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - AuthService
 *
 * Verifica el comportamiento del servicio de autenticación:
 * - Registro de usuarios
 * - Inicio de sesión
 * - Login mock admin
 * - Actualización de perfil
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/auth/auth.service';
import { PrismaService } from '../../../src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Rol, EstadoUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService [QA]', () => {
  let service: AuthService;
  let prismaService: {
    usuario: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwtService: {
    signAsync: jest.Mock;
  };

  const mockUser = {
    id: 'user-123',
    nombre: 'Juan',
    apellido: 'Pérez',
    correo: 'juan@example.com',
    password: 'hashed_password',
    rol: Rol.CLIENTE,
    celular: '3001234567',
    estado: EstadoUsuario.ACTIVO,
    fechaNacimiento: new Date('1990-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaService = {
      usuario: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // REGISTER
  // ============================================================
  describe('register', () => {
    const registerDto = {
      nombre: 'Juan',
      apellido: 'Pérez',
      correo: 'juan@example.com',
      password: 'password123',
      celular: '3001234567',
      fechaNacimiento: '1990-01-01',
    };

    it('debe registrar un usuario correctamente', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      prismaService.usuario.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('message', 'Registro exitoso');
      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prismaService.usuario.create).toHaveBeenCalled();
    });

    it('debe generar el payload del JWT con los datos correctos', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      prismaService.usuario.create.mockResolvedValue(mockUser);

      await service.register(registerDto);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        correo: mockUser.correo,
        rol: mockUser.rol,
      });
    });

    it('debe lanzar BadRequestException si el correo ya está registrado', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Este correo ya está registrado',
      );

      expect(prismaService.usuario.create).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('debe hashear la contraseña con 10 salt rounds', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      prismaService.usuario.create.mockResolvedValue(mockUser);

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('debe crear el usuario con rol CLIENTE y estado ACTIVO por defecto', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      prismaService.usuario.create.mockResolvedValue(mockUser);

      await service.register(registerDto);

      expect(prismaService.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rol: Rol.CLIENTE,
            estado: EstadoUsuario.ACTIVO,
          }),
        }),
      );
    });

    it('debe convertir fechaNacimiento a Date', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      prismaService.usuario.create.mockResolvedValue(mockUser);

      await service.register(registerDto);

      const createCall = prismaService.usuario.create.mock.calls[0][0];
      expect(createCall.data.fechaNacimiento).toBeInstanceOf(Date);
    });

    it('no debe guardar la contraseña en texto plano', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      prismaService.usuario.create.mockResolvedValue(mockUser);

      await service.register(registerDto);

      const createCall = prismaService.usuario.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe('password123');
      expect(createCall.data.password).toBe('hashed_password');
    });
  });

  // ============================================================
  // LOGIN
  // ============================================================
  describe('login', () => {
    const loginDto = {
      correo: 'juan@example.com',
      password: 'password123',
    };

    it('debe iniciar sesión correctamente con credenciales válidas', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Nombre de Usuario y/o contraseñas incorrectas',
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Nombre de Usuario y/o contraseñas incorrectas',
      );

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('no debe revelar si el usuario existe o no en los errores (seguridad)', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(null);

      try {
        await service.login(loginDto);
      } catch (error: any) {
        expect(error.message).not.toContain('usuario no encontrado');
        expect(error.message).not.toContain('no existe');
        expect(error.message).toContain('Nombre de Usuario y/o contraseñas');
      }
    });

    it('debe generar un token con el payload correcto en login', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login(loginDto);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        correo: mockUser.correo,
        rol: mockUser.rol,
      });
    });

    it('debe retornar error con contraseña vacía', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ correo: 'juan@example.com', password: '' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ============================================================
  // LOGIN MOCK ADMIN
  // ============================================================
  describe('loginMockAdmin', () => {
    const mockAdmin = {
      ...mockUser,
      id: 'admin-123',
      correo: 'admin@briseebake.com',
      rol: Rol.ADMIN,
    };

    it('debe retornar un token si el admin ya existe', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(mockAdmin);

      const result = await service.loginMockAdmin();

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(prismaService.usuario.create).not.toHaveBeenCalled();
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockAdmin.id,
        correo: mockAdmin.correo,
        rol: Rol.ADMIN,
      });
    });

    it('debe crear el admin si no existe', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(null);
      prismaService.usuario.create.mockResolvedValue(mockAdmin);

      const result = await service.loginMockAdmin();

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(prismaService.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            correo: 'admin@briseebake.com',
            rol: Rol.ADMIN,
          }),
        }),
      );
    });

    it('debe buscar al admin por correo específico', async () => {
      prismaService.usuario.findUnique.mockResolvedValue(mockAdmin);

      await service.loginMockAdmin();

      expect(prismaService.usuario.findUnique).toHaveBeenCalledWith({
        where: { correo: 'admin@briseebake.com' },
      });
    });
  });

  // ============================================================
  // UPDATE PROFILE
  // ============================================================
  describe('updateProfile', () => {
    const userId = 'user-123';
    const updateDto = {
      nombre: 'Juan Carlos',
      apellido: 'Pérez López',
      celular: '3109876543',
    };

    it('debe actualizar el perfil del usuario', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      prismaService.usuario.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toHaveProperty(
        'message',
        'Perfil actualizado exitosamente',
      );
      expect(result).toHaveProperty('user');
    });

    it('no debe retornar la contraseña en la respuesta (seguridad)', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      prismaService.usuario.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result.user).not.toHaveProperty('password');
    });

    it('debe hashear la nueva contraseña si se proporciona', async () => {
      const updateDtoWithPassword = {
        ...updateDto,
        password: 'newPassword123',
      };
      const updatedUser = { ...mockUser, ...updateDto };
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
      prismaService.usuario.update.mockResolvedValue(updatedUser);

      await service.updateProfile(userId, updateDtoWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
    });

    it('no debe hashear si no se proporciona password', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      prismaService.usuario.update.mockResolvedValue(updatedUser);

      await service.updateProfile(userId, updateDto);

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('debe convertir fechaNacimiento a Date si se proporciona', async () => {
      const updateDtoWithDate = {
        ...updateDto,
        fechaNacimiento: '1995-05-15',
      };
      const updatedUser = { ...mockUser, ...updateDto };
      prismaService.usuario.update.mockResolvedValue(updatedUser);

      await service.updateProfile(userId, updateDtoWithDate);

      const updateCall = prismaService.usuario.update.mock.calls[0][0];
      expect(updateCall.data.fechaNacimiento).toBeInstanceOf(Date);
    });

    it('debe lanzar BadRequestException si el correo está en uso (P2002)', async () => {
      const error = new Error('Unique constraint failed') as any;
      error.code = 'P2002';
      prismaService.usuario.update.mockRejectedValue(error);

      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(
        'El correo ya está en uso por otro usuario',
      );
    });

    it('debe re-lanzar errores que no sean P2002', async () => {
      const otherError = new Error('Database error') as any;
      otherError.code = 'P9999';
      prismaService.usuario.update.mockRejectedValue(otherError);

      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(
        'Database error',
      );
    });

    it('debe actualizar solo los campos proporcionados (partial update)', async () => {
      const partialDto = { nombre: 'Carlos' };
      const updatedUser = { ...mockUser, nombre: 'Carlos' };
      prismaService.usuario.update.mockResolvedValue(updatedUser);

      await service.updateProfile(userId, partialDto);

      expect(prismaService.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: expect.objectContaining({ nombre: 'Carlos' }),
        }),
      );
    });
  });
});
