 
/**
 * PRUEBAS UNITARIAS QA - ExpandableDescription
 *
 * Verifica la expansión/colapso de descripciones largas.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpandableDescription from '@/components/products/ExpandableDescription';

describe('ExpandableDescription [QA]', () => {
  it('debe retornar null si no hay texto', () => {
    const { container } = render(<ExpandableDescription text="" />);
    expect(container.firstChild).toBeNull();
  });

  it('debe mostrar el texto completo si es más corto que maxLength', () => {
    render(<ExpandableDescription text="Texto corto" maxLength={80} />);

    expect(screen.getByText('Texto corto')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('debe truncar el texto si excede maxLength y mostrar botón "Ver más"', () => {
    const largeText = 'A'.repeat(200);
    render(<ExpandableDescription text={largeText} maxLength={80} />);

    expect(screen.getByText(/A{80}\.\.\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver más/i })).toBeInTheDocument();
  });

  it('debe expandir el texto al hacer click en "Ver más"', async () => {
    const user = userEvent.setup();
    const largeText = 'Esto es un texto muy largo. '.repeat(10);
    render(<ExpandableDescription text={largeText} maxLength={30} />);

    // Antes del click, el texto completo no debe estar visible
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ver más/i }));

    // Después del click, el botón cambia a "Ver menos"
    expect(screen.getByRole('button', { name: /Ver menos/i })).toBeInTheDocument();
    // Y el texto completo aparece (sin "..." al final)
    const paragraph = screen.getByText(/Esto es un texto muy largo/);
    expect(paragraph.textContent?.trim().endsWith('.')).toBe(true);
    expect(paragraph.textContent).not.toContain('...');
  });

  it('debe contraer el texto al hacer click en "Ver menos"', async () => {
    const user = userEvent.setup();
    const largeText = 'Esto es un texto muy largo. '.repeat(10);
    render(<ExpandableDescription text={largeText} maxLength={30} />);

    await user.click(screen.getByRole('button', { name: /Ver más/i }));
    await user.click(screen.getByRole('button', { name: /Ver menos/i }));

    expect(screen.getByRole('button', { name: /Ver más/i })).toBeInTheDocument();
  });

  it('debe tener atributo aria-expanded correcto', async () => {
    const user = userEvent.setup();
    const largeText = 'A'.repeat(200);
    render(<ExpandableDescription text={largeText} maxLength={80} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('debe aplicar la clase personalizada', () => {
    const { container } = render(
      <ExpandableDescription text="Texto corto" className="mi-clase" />,
    );

    const p = container.querySelector('p');
    expect(p?.className).toContain('mi-clase');
  });

  it('debe usar maxLength por defecto (80) si no se especifica', () => {
    const text = 'A'.repeat(100);
    render(<ExpandableDescription text={text} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
