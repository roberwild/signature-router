import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TokenDisplay } from '../token-display';

// Mock the toast function
jest.mock('@workspace/ui/components/sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('TokenDisplay', () => {
  const mockToken = 'abc123def456ghi789';
  const defaultProps = {
    token: mockToken,
    versionNumber: 2,
    totalVersions: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders token and version information', () => {
    render(<TokenDisplay {...defaultProps} />);
    
    expect(screen.getByText(mockToken)).toBeInTheDocument();
    expect(screen.getByText('Versión 2 de 3')).toBeInTheDocument();
    expect(screen.getByText('Token de Verificación')).toBeInTheDocument();
  });

  it('copies token to clipboard when copy button is clicked', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { toast } = require('@workspace/ui/components/sonner');
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValueOnce(undefined);

    render(<TokenDisplay {...defaultProps} />);
    
    const copyButtons = screen.getAllByRole('button');
    const tokenCopyButton = copyButtons[0]; // First button is token copy
    
    fireEvent.click(tokenCopyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockToken);
      expect(toast.success).toHaveBeenCalledWith('Token copiado', {
        description: 'El token ha sido copiado al portapapeles',
      });
    });
  });

  it('copies verification link to clipboard', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { toast } = require('@workspace/ui/components/sonner');
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValueOnce(undefined);

    render(<TokenDisplay {...defaultProps} />);
    
    const copyLinkButton = screen.getByText('Copiar Link de Verificación').closest('button');
    
    fireEvent.click(copyLinkButton!);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining(`/verify/${mockToken}`)
      );
      expect(toast.success).toHaveBeenCalledWith('Link copiado', {
        description: 'El link de verificación ha sido copiado',
      });
    });
  });

  it('opens public portal in new window', () => {
    const mockOpen = jest.fn();
    window.open = mockOpen;

    render(<TokenDisplay {...defaultProps} />);
    
    const portalButton = screen.getByText('Ver Portal Público').closest('button');
    
    fireEvent.click(portalButton!);

    expect(mockOpen).toHaveBeenCalledWith(`/verify/${mockToken}`, '_blank');
  });

  it('shows error toast when clipboard write fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { toast } = require('@workspace/ui/components/sonner');
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

    render(<TokenDisplay {...defaultProps} />);
    
    const copyButtons = screen.getAllByRole('button');
    const tokenCopyButton = copyButtons[0];
    
    fireEvent.click(tokenCopyButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error', {
        description: 'No se pudo copiar el token',
      });
    });
  });
});