/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - UsuariosController
 *
 * Verifica el comportamiento del controlador de usuarios:
 * - Autorización vía JWT y RolesGuard
 * - Prevención de auto-modificación de rol (seguridad)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosController } from '../../../src/usuarios/usuarios.controller';
import { UsuariosService } from '../../../src/usuarios/usuarios.service';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../src/common/guards/roles.guard';
import { Rol } from '@prisma/client';
import { Reflector } from '@nestjs/core';

describe('UsuariosController [QA]', () => {
  let controller: UsuariosController;
  let usuariosService: {
    findAllClientes: jest.Mock;
    updateRol: jest.Mock;
  };

  const createMockRequest = (userId: string) =>
    ({
      user: { sub: userId },
    }) as any;

  beforeEach(async () => {
    usuariosService = {
      findAllClientes: jest.fn(),
      updateRol: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [
        { provide: UsuariosService, useValue: usuariosService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsuariosController>(UsuariosController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  // ============================================================
  // GET /usuarios/clientes (ADMIN)
  // ============================================================
  describe('GET /usuarios/clientes (findAllClientes)', () => {
    it('debe retornar la lista de clientes', async () => {
      const clientes = [
        { id: 'u1', nombre: 'Juan', correo: 'juan@example.com' },
        { id: 'u2', nombre: 'María', correo: 'maria@example.com' },
      ];
      usuariosService.findAllClientes.mockResolvedValue(clientes);

      const result = await controller.findAllClientes();

      expect(usuariosService.findAllClientes).toHaveBeenCalled();
      expect(result).toEqual(clientes);
    });

    it('debe retornar array vacío si no hay clientes', async () => {
      usuariosService.findAllClientes.mockResolvedValue([]);

      const result = await controller.findAllClientes();

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // PATCH /usuarios/:id/rol (ADMIN)
  // ============================================================
  describe('PATCH /usuarios/:id/rol (updateRol)', () => {
    it('debe actualizar el rol de otro usuario', async () => {
      const req = createMockRequest('admin-123');
      const expectedResponse = {
        id: 'user-456',
        nombre: 'Juan',
        correo: 'juan@example.com',
        rol: Rol.ADMIN,
      };
      usuariosService.updateRol.mockResolvedValue(expectedResponse);

      const result = await controller.updateRol(
        'user-456',
        { rol: Rol.ADMIN },
        req,
      );

      expect(usuariosService.updateRol).toHaveBeenCalledWith(
        'user-456',
        Rol.ADMIN,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debe lanzar BadRequestException si intenta cambiarse su propio rol (seguridad)', async () => {
      const req = createMockRequest('user-123');

      try {
        await controller.updateRol('user-123', { rol: Rol.CLIENTE }, req);
        fail('Debería haber lanzado BadRequestException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('No puedes cambiar tus propios permisos.');
      }

      expect(usuariosService.updateRol).not.toHaveBeenCalled();
    });

    it('debe permitir cambiar rol a CLIENTE', async () => {
      const req = createMockRequest('admin-123');
      usuariosService.updateRol.mockResolvedValue({
        id: 'user-456',
        rol: Rol.CLIENTE,
      });

      await controller.updateRol('user-456', { rol: Rol.CLIENTE }, req);

      expect(usuariosService.updateRol).toHaveBeenCalledWith(
        'user-456',
        Rol.CLIENTE,
      );
    });

    it('debe permitir promover a ADMIN', async () => {
      const req = createMockRequest('admin-123');
      usuariosService.updateRol.mockResolvedValue({
        id: 'user-456',
        rol: Rol.ADMIN,
      });

      await controller.updateRol('user-456', { rol: Rol.ADMIN }, req);

      expect(usuariosService.updateRol).toHaveBeenCalledWith(
        'user-456',
        Rol.ADMIN,
      );
    });

    it('la auto-modificación debe fallar antes de llamar al servicio', async () => {
      const req = createMockRequest('self-user');

      try {
        await controller.updateRol('self-user', { rol: Rol.ADMIN }, req);
      } catch {
        // Expected error
      }

      expect(usuariosService.updateRol).not.toHaveBeenCalled();
    });

    it('debe propagar errores del servicio al controlador', async () => {
      const req = createMockRequest('admin-123');
      usuariosService.updateRol.mockRejectedValue(
        new Error('Usuario no encontrado'),
      );

      await expect(
        controller.updateRol('no-existe', { rol: Rol.ADMIN }, req),
      ).rejects.toThrow('Usuario no encontrado');
    });
  });
});
