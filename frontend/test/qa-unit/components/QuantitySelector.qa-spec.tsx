 
/**
 * PRUEBAS UNITARIAS QA - QuantitySelector
 *
 * Verifica el stepper para cantidades:
 * - Incrementar/decrementar
 * - Validación de números positivos
 * - Respeta min/max
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuantitySelector from '@/components/products/QuantitySelector';

describe('QuantitySelector [QA]', () => {
  it('debe renderizar el valor inicial', () => {
    render(<QuantitySelector value={3} onChange={() => {}} />);

    const input = screen.getByLabelText('Cantidad') as HTMLInputElement;
    expect(input.value).toBe('3');
  });

  it('debe incrementar el valor al hacer click en "+"', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<QuantitySelector value={2} onChange={handleChange} />);

    await user.click(screen.getByLabelText('Aumentar cantidad'));

    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('debe decrementar el valor al hacer click en "-"', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<QuantitySelector value={5} onChange={handleChange} />);

    await user.click(screen.getByLabelText('Disminuir cantidad'));

    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('no debe decrementar debajo del mínimo', () => {
    render(<QuantitySelector value={1} onChange={() => {}} min={1} />);

    const minusButton = screen.getByLabelText('Disminuir cantidad');
    expect(minusButton).toBeDisabled();
  });

  it('no debe incrementar arriba del máximo', () => {
    render(<QuantitySelector value={10} onChange={() => {}} max={10} />);

    const plusButton = screen.getByLabelText('Aumentar cantidad');
    expect(plusButton).toBeDisabled();
  });

  it('debe limitar al máximo al incrementar más allá', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(
      <QuantitySelector value={9} onChange={handleChange} max={10} />,
    );

    await user.click(screen.getByLabelText('Aumentar cantidad'));

    expect(handleChange).toHaveBeenCalledWith(10);
  });

  it('debe mostrar error al escribir texto no numérico', async () => {
    const user = userEvent.setup();
    const handleValidity = jest.fn();

    render(
      <QuantitySelector
        value={2}
        onChange={() => {}}
        onValidityChange={handleValidity}
      />,
    );

    const input = screen.getByLabelText('Cantidad');
    await user.clear(input);
    await user.type(input, 'abc');

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(handleValidity).toHaveBeenLastCalledWith(false);
  });

  it('debe mostrar error al escribir 0', async () => {
    const user = userEvent.setup();
    const handleValidity = jest.fn();

    render(
      <QuantitySelector
        value={2}
        onChange={() => {}}
        onValidityChange={handleValidity}
      />,
    );

    const input = screen.getByLabelText('Cantidad');
    await user.clear(input);
    await user.type(input, '0');

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(handleValidity).toHaveBeenLastCalledWith(false);
  });

  it('debe mostrar error al escribir número negativo', async () => {
    const user = userEvent.setup();

    render(<QuantitySelector value={2} onChange={() => {}} />);

    const input = screen.getByLabelText('Cantidad');
    await user.clear(input);
    await user.type(input, '-5');

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('debe mostrar error si excede max al escribir', async () => {
    const user = userEvent.setup();
    const handleValidity = jest.fn();

    render(
      <QuantitySelector
        value={2}
        onChange={() => {}}
        onValidityChange={handleValidity}
        max={10}
      />,
    );

    const input = screen.getByLabelText('Cantidad');
    await user.clear(input);
    await user.type(input, '15');

    expect(screen.getByText(/Solo hay 10 unidades disponibles/i)).toBeInTheDocument();
    expect(handleValidity).toHaveBeenLastCalledWith(false);
  });

  it('debe restaurar el valor anterior al perder foco con valor inválido', async () => {
    const user = userEvent.setup();

    render(<QuantitySelector value={5} onChange={() => {}} />);

    const input = screen.getByLabelText('Cantidad') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'abc');
    await user.tab();

    expect(input.value).toBe('5');
  });

  it('debe aceptar números enteros positivos sin error', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const handleValidity = jest.fn();

    render(
      <QuantitySelector
        value={1}
        onChange={handleChange}
        onValidityChange={handleValidity}
      />,
    );

    const input = screen.getByLabelText('Cantidad');
    await user.clear(input);
    await user.type(input, '7');

    expect(handleChange).toHaveBeenCalledWith(7);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('debe estar deshabilitado si disabled=true', () => {
    render(<QuantitySelector value={2} onChange={() => {}} disabled />);

    expect(screen.getByLabelText('Aumentar cantidad')).toBeDisabled();
    expect(screen.getByLabelText('Disminuir cantidad')).toBeDisabled();
    expect(screen.getByLabelText('Cantidad')).toBeDisabled();
  });
});
