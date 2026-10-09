/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - DietaryFilterChips
 *
 * Verifica los chips de filtro dietético:
 * - Toggle de filtros
 * - Botón de limpiar
 * - Accesibilidad (aria-pressed)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DietaryFilterChips from '@/components/products/DietaryFilterChips';

const defaultOptions = [
  { value: 'SIN_AZUCAR', label: 'Sin azúcar' },
  { value: 'SIN_GLUTEN', label: 'Sin gluten' },
  { value: 'KETO', label: 'Keto' },
  { value: 'VEGANO', label: 'Vegano' },
];

describe('DietaryFilterChips [QA]', () => {
  it('debe retornar null si no hay opciones', () => {
    const { container } = render(
      <DietaryFilterChips
        options={[]}
        activeTags={new Set()}
        onToggle={() => {}}
        onClear={() => {}}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar todas las opciones como botones', () => {
    render(
      <DietaryFilterChips
        options={defaultOptions}
        activeTags={new Set()}
        onToggle={() => {}}
        onClear={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Sin azúcar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sin gluten' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vegano' })).toBeInTheDocument();
  });

  it('debe marcar como pressed=true los tags activos', () => {
    render(
      <DietaryFilterChips
        options={defaultOptions}
        activeTags={new Set(['SIN_AZUCAR', 'KETO'])}
        onToggle={() => {}}
        onClear={() => {}}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Sin azúcar' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Keto' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Sin gluten' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('debe llamar onToggle con el valor correcto al hacer click', async () => {
    const user = userEvent.setup();
    const handleToggle = jest.fn();

    render(
      <DietaryFilterChips
        options={defaultOptions}
        activeTags={new Set()}
        onToggle={handleToggle}
        onClear={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Keto' }));

    expect(handleToggle).toHaveBeenCalledWith('KETO');
  });

  it('debe mostrar el botón "Limpiar filtros" si hay tags activos', () => {
    render(
      <DietaryFilterChips
        options={defaultOptions}
        activeTags={new Set(['SIN_AZUCAR'])}
        onToggle={() => {}}
        onClear={() => {}}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Limpiar filtros/i }),
    ).toBeInTheDocument();
  });

  it('NO debe mostrar el botón "Limpiar filtros" si no hay tags activos', () => {
    render(
      <DietaryFilterChips
        options={defaultOptions}
        activeTags={new Set()}
        onToggle={() => {}}
        onClear={() => {}}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /Limpiar filtros/i }),
    ).not.toBeInTheDocument();
  });

  it('debe llamar onClear al hacer click en "Limpiar filtros"', async () => {
    const user = userEvent.setup();
    const handleClear = jest.fn();

    render(
      <DietaryFilterChips
        options={defaultOptions}
        activeTags={new Set(['SIN_AZUCAR'])}
        onToggle={() => {}}
        onClear={handleClear}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    expect(handleClear).toHaveBeenCalled();
  });

  it('debe tener aria-label en el group container', () => {
    render(
      <DietaryFilterChips
        options={defaultOptions}
        activeTags={new Set()}
        onToggle={() => {}}
        onClear={() => {}}
      />,
    );

    expect(
      screen.getByRole('group', { name: 'Filtros dietéticos' }),
    ).toBeInTheDocument();
  });
});
