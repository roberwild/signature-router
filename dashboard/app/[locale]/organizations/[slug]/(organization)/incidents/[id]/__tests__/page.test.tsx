/**
 * @jest-environment node
 */

import IncidentDetailPage from '../page';
import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import { incidentDb } from '~/src/features/incidents/data/incident-db';
import { notFound, redirect } from 'next/navigation';

// Mock the modules
jest.mock('@workspace/auth');
jest.mock('@workspace/auth/context');
jest.mock('~/src/features/incidents/data/incident-db');
jest.mock('next/navigation');

describe('IncidentDetailPage', () => {
  const mockIncidentData = {
    incident: {
      id: 'incident-123',
      internalId: 1,
      organizationId: 'org-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    },
    versions: [
      {
        id: 'version-1',
        incidentId: 'incident-123',
        token: 'token-abc-123',
        versionNumber: 1,
        isLatest: true,
        fechaDeteccion: new Date('2024-01-01'),
        descripcion: 'Test incident description',
        tipoIncidente: 'Breach',
        categoriasDatos: 'Personal,Financial',
        numeroAfectados: 100,
        consecuencias: 'Data exposure',
        medidasAdoptadas: 'System patched',
        fechaResolucion: null,
        notificadoAEPD: false,
        fechaNotificacionAEPD: null,
        notificadoAfectados: false,
        fechaNotificacionAfectados: null,
        notasInternas: 'Internal notes',
        createdAt: new Date('2024-01-01'),
        createdBy: 'user-123',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });
    
    (getAuthOrganizationContext as jest.Mock).mockResolvedValue({
      organization: { id: 'org-123', name: 'Test Org' },
    });
    
    (incidentDb.getIncidentWithHistory as jest.Mock).mockResolvedValue(mockIncidentData);
  });

  it('redirects to sign-in when user is not authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    await IncidentDetailPage({
      params: { slug: 'test-org', id: 'incident-123' },
    });

    expect(redirect).toHaveBeenCalledWith('/sign-in');
  });

  it('shows not found when incident does not exist', async () => {
    (incidentDb.getIncidentWithHistory as jest.Mock).mockResolvedValue(null);

    await IncidentDetailPage({
      params: { slug: 'test-org', id: 'non-existent' },
    });

    expect(notFound).toHaveBeenCalled();
  });

  it('shows not found when incident belongs to different organization', async () => {
    (getAuthOrganizationContext as jest.Mock).mockResolvedValue({
      organization: { id: 'different-org', name: 'Different Org' },
    });

    await IncidentDetailPage({
      params: { slug: 'test-org', id: 'incident-123' },
    });

    expect(notFound).toHaveBeenCalled();
  });

  it('fetches and displays incident data correctly', async () => {
    const params = { slug: 'test-org', id: 'incident-123' };
    
    await IncidentDetailPage({ params });

    expect(incidentDb.getIncidentWithHistory).toHaveBeenCalledWith('incident-123');
    expect(auth).toHaveBeenCalled();
    expect(getAuthOrganizationContext).toHaveBeenCalled();
  });
});