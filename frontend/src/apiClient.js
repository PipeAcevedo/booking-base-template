const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `La solicitud falló (${response.status}).`);
  }
  return data;
}

export const apiClient = {
  getServices: () => request('/services'),
  getProfessionals: (serviceId) => request(`/professionals?serviceId=${serviceId}`),
  getAvailability: ({ serviceId, professionalId, date }) => {
    const params = new URLSearchParams({ serviceId, professionalId, date });
    return request(`/availability?${params}`);
  },
  createAppointment: (appointment) => request('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointment),
  }),
  getAppointments: (date) => request(`/appointments?date=${encodeURIComponent(date)}`),
};
