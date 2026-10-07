/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - UsuariosService
 *
 * Verifica el comportamiento del servicio de usuarios:
 * - Listado de clientes (acceso admin)
 * - Actualización de roles
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosService } from '../../../src/usuarios/usuarios.service';
import { PrismaService } from '../../../src/prisma.service';
import { Rol, EstadoUsuario } from '@prisma/client';

describe('UsuariosService [QA]', () => {
  let service: UsuariosService;
  let prismaService: {
    usuario: {
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUsuarios = [
    {
      id: 'user-1',
      nombre: 'Juan',
      apellido: 'Pérez',
      correo: 'juan@example.com',
      celular: '3001111111',
      estado: EstadoUsuario.ACTIVO,
      rol: Rol.CLIENTE,
      createdAt: new Date('2026-01-01'),
    },
    {
      id: 'user-2',
      nombre: 'María',
      apellido: 'López',
      correo: 'maria@example.com',
      celular: '3002222222',
      estado: EstadoUsuario.ACTIVO,
      rol: Rol.CLIENTE,
      createdAt: new Date('2026-02-01'),
    },
  ];

  beforeEach(async () => {
    prismaService = {
      usuario: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // FIND ALL CLIENTES
  // ============================================================
  describe('findAllClientes', () => {
    it('debe retornar la lista de clientes', async () => {
      prismaService.usuario.findMany.mockResolvedValue(mockUsuarios);

      const result = await service.findAllClientes();

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockUsuarios);
    });

    it('no debe retornar la contraseña de los usuarios (seguridad)', async () => {
      prismaService.usuario.findMany.mockResolvedValue(mockUsuarios);

      await service.findAllClientes();

      const call = prismaService.usuario.findMany.mock.calls[0][0];
      expect(call.select).not.toHaveProperty('password');
      expect(call.select).toHaveProperty('correo', true);
      expect(call.select).toHaveProperty('rol', true);
    });

    it('debe retornar array vacío si no hay usuarios', async () => {
      prismaService.usuario.findMany.mockResolvedValue([]);

      const result = await service.findAllClientes();

      expect(result).toEqual([]);
    });

    it('debe ordenar por fecha de creación descendente', async () => {
      prismaService.usuario.findMany.mockResolvedValue(mockUsuarios);

      await service.findAllClientes();

      expect(prismaService.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('debe incluir campos de interés para admin (nombre, correo, estado, rol)', async () => {
      prismaService.usuario.findMany.mockResolvedValue(mockUsuarios);

      await service.findAllClientes();

      const call = prismaService.usuario.findMany.mock.calls[0][0];
      expect(call.select).toHaveProperty('id', true);
      expect(call.select).toHaveProperty('nombre', true);
      expect(call.select).toHaveProperty('apellido', true);
      expect(call.select).toHaveProperty('correo', true);
      expect(call.select).toHaveProperty('celular', true);
      expect(call.select).toHaveProperty('estado', true);
      expect(call.select).toHaveProperty('rol', true);
      expect(call.select).toHaveProperty('createdAt', true);
    });
  });

  // ============================================================
  // UPDATE ROL
  // ============================================================
  describe('updateRol', () => {
    const userId = 'user-1';

    it('debe actualizar el rol de un usuario a ADMIN', async () => {
      const updatedUser = {
        id: userId,
        nombre: 'Juan',
        correo: 'juan@example.com',
        rol: Rol.ADMIN,
      };
      prismaService.usuario.update.mockResolvedValue(updatedUser);

      const result = await service.updateRol(userId, Rol.ADMIN);

      expect(result).toEqual(updatedUser);
      expect(prismaService.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: { rol: Rol.ADMIN },
        }),
      );
    });

    it('debe actualizar el rol de un usuario a CLIENTE', async () => {
      const updatedUser = {
        id: userId,
        nombre: 'Juan',
        correo: 'juan@example.com',
        rol: Rol.CLIENTE,
      };
      prismaService.usuario.update.mockResolvedValue(updatedUser);

      const result = await service.updateRol(userId, Rol.CLIENTE);

      expect(result.rol).toBe(Rol.CLIENTE);
    });

    it('no debe retornar la contraseña en la respuesta', async () => {
      prismaService.usuario.update.mockResolvedValue({
        id: userId,
        nombre: 'Juan',
        correo: 'juan@example.com',
        rol: Rol.ADMIN,
      });

      await service.updateRol(userId, Rol.ADMIN);

      const call = prismaService.usuario.update.mock.calls[0][0];
      expect(call.select).not.toHaveProperty('password');
    });

    it('debe propagar errores de base de datos', async () => {
      prismaService.usuario.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.updateRol(userId, Rol.ADMIN)).rejects.toThrow(
        'Database error',
      );
    });

    it('debe seleccionar solo los campos relevantes en la respuesta', async () => {
      prismaService.usuario.update.mockResolvedValue({});

      await service.updateRol(userId, Rol.ADMIN);

      const call = prismaService.usuario.update.mock.calls[0][0];
      expect(call.select).toEqual({
        id: true,
        nombre: true,
        correo: true,
        rol: true,
      });
    });
  });
});
