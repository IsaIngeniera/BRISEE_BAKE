 
/**
 * PRUEBAS UNITARIAS QA - ProductSearchBar
 *
 * Verifica la barra de búsqueda con filtros dietéticos:
 * - Input de búsqueda
 * - Popover de filtros al focus
 * - Toggle de tags
 * - Botón de limpiar filtros
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductSearchBar from '@/components/products/ProductSearchBar';

describe('ProductSearchBar [QA]', () => {
  it('debe renderizar un input de búsqueda con placeholder', () => {
    render(
      <ProductSearchBar
        value=""
        onChange={() => {}}
        placeholder="Buscar galleta..."
      />,
    );

    expect(
      screen.getByPlaceholderText('Buscar galleta...'),
    ).toBeInTheDocument();
  });

  it('debe usar placeholder por defecto si no se proporciona', () => {
    render(<ProductSearchBar value="" onChange={() => {}} />);

    expect(
      screen.getByPlaceholderText('Buscar producto...'),
    ).toBeInTheDocument();
  });

  it('debe mostrar el valor actual', () => {
    render(<ProductSearchBar value="granola" onChange={() => {}} />);

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    expect(input.value).toBe('granola');
  });

  it('debe llamar onChange al escribir', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<ProductSearchBar value="" onChange={handleChange} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'test');

    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledTimes(4); // t, e, s, t
  });

  it('debe mostrar el popover de filtros al enfocar el input', async () => {
    const user = userEvent.setup();

    render(
      <ProductSearchBar
        value=""
        onChange={() => {}}
        toggleTag={() => {}}
      />,
    );

    const input = screen.getByRole('searchbox');
    await user.click(input);

    expect(screen.getByText('Filtros dietéticos')).toBeInTheDocument();
  });

  it('debe mostrar todas las etiquetas dietéticas en el popover', async () => {
    const user = userEvent.setup();

    render(
      <ProductSearchBar
        value=""
        onChange={() => {}}
        toggleTag={() => {}}
      />,
    );

    await user.click(screen.getByRole('searchbox'));

    expect(screen.getByText('SIN AZUCAR')).toBeInTheDocument();
    expect(screen.getByText('SIN GLUTEN')).toBeInTheDocument();
    expect(screen.getByText('KETO')).toBeInTheDocument();
    expect(screen.getByText('VEGANO')).toBeInTheDocument();
    expect(screen.getByText('LIBRE DE LACTEOS')).toBeInTheDocument();
  });

  it('debe llamar toggleTag al clickear una etiqueta', async () => {
    const user = userEvent.setup();
    const handleToggle = jest.fn();

    render(
      <ProductSearchBar
        value=""
        onChange={() => {}}
        toggleTag={handleToggle}
      />,
    );

    await user.click(screen.getByRole('searchbox'));
    await user.click(screen.getByText('KETO'));

    expect(handleToggle).toHaveBeenCalledWith('KETO');
  });

  it('debe mostrar botón "Limpiar filtros" si hay filtros activos', async () => {
    const user = userEvent.setup();

    render(
      <ProductSearchBar
        value=""
        onChange={() => {}}
        toggleTag={() => {}}
        clearTags={() => {}}
        hasActiveFilters={true}
      />,
    );

    await user.click(screen.getByRole('searchbox'));

    expect(
      screen.getByRole('button', { name: /Limpiar filtros/i }),
    ).toBeInTheDocument();
  });

  it('NO debe mostrar "Limpiar filtros" sin filtros activos', async () => {
    const user = userEvent.setup();

    render(
      <ProductSearchBar
        value=""
        onChange={() => {}}
        toggleTag={() => {}}
        clearTags={() => {}}
        hasActiveFilters={false}
      />,
    );

    await user.click(screen.getByRole('searchbox'));

    expect(
      screen.queryByRole('button', { name: /Limpiar filtros/i }),
    ).not.toBeInTheDocument();
  });

  it('debe llamar clearTags al clickear "Limpiar filtros"', async () => {
    const user = userEvent.setup();
    const handleClear = jest.fn();

    render(
      <ProductSearchBar
        value=""
        onChange={() => {}}
        toggleTag={() => {}}
        clearTags={handleClear}
        hasActiveFilters={true}
      />,
    );

    await user.click(screen.getByRole('searchbox'));
    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    expect(handleClear).toHaveBeenCalled();
  });

  it('debe marcar como activa la etiqueta en activeTags', async () => {
    const user = userEvent.setup();

    render(
      <ProductSearchBar
        value=""
        onChange={() => {}}
        activeTags={new Set(['KETO'])}
        toggleTag={() => {}}
      />,
    );

    await user.click(screen.getByRole('searchbox'));

    const ketoButton = screen.getByText('KETO').closest('button');
    expect(ketoButton?.className).toContain('filterTagActive');
  });

  it('no debe mostrar popover si no se proporciona toggleTag', async () => {
    const user = userEvent.setup();

    render(<ProductSearchBar value="" onChange={() => {}} />);

    await user.click(screen.getByRole('searchbox'));

    expect(screen.queryByText('Filtros dietéticos')).not.toBeInTheDocument();
  });
});
