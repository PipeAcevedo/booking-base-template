import { useEffect, useMemo, useState } from 'react';
import { apiClient } from './apiClient.js';

const steps = ['Servicio', 'Profesional', 'Fecha y hora', 'Tus datos'];
const utcDate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const formatTime = (date) => new Date(date).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

function App() {
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [professional, setProfessional] = useState(null);
  const [date, setDate] = useState(utcDate(new Date()));
  const [slot, setSlot] = useState(null);
  const [customer, setCustomer] = useState({ customerName: '', customerEmail: '', customerPhone: '' });
  const [view, setView] = useState('booking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    apiClient.getServices().then(setServices).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!service) return;
    apiClient.getProfessionals(service.id)
      .then(setProfessionals)
      .catch((err) => setError(err.message));
  }, [service]);

  useEffect(() => {
    if (!service || !professional || view !== 'booking') return;
    setLoading(true);
    setSlot(null);
    apiClient.getAvailability({ serviceId: service.id, professionalId: professional.id, date })
      .then(setSlots)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [service, professional, date, view]);

  useEffect(() => {
    if (view !== 'admin') return;
    apiClient.getAppointments(utcDate(new Date()))
      .then(setAppointments)
      .catch((err) => setError(err.message));
  }, [view]);

  const minDate = useMemo(() => utcDate(new Date()), []);

  async function submitBooking(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await apiClient.createAppointment({ slotId: slot.id, ...customer });
      setConfirmation(result);
      setStep(4);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('reservado')) {
        apiClient.getAvailability({ serviceId: service.id, professionalId: professional.id, date })
          .then(setSlots)
          .catch((refreshError) => setError(refreshError.message));
      }
    } finally {
      setLoading(false);
    }
  }

  function chooseService(item) {
    setService(item);
    setProfessional(null);
    setStep(1);
  }

  function chooseProfessional(item) {
    setProfessional(item);
    setStep(2);
  }

  function reset() {
    setStep(0);
    setService(null);
    setProfessional(null);
    setSlot(null);
    setConfirmation(null);
    setCustomer({ customerName: '', customerEmail: '', customerPhone: '' });
    setError('');
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
      <header className="mx-auto mb-8 flex max-w-5xl items-center justify-between">
        <a className="flex items-center gap-3" href="#" onClick={() => { setView('booking'); reset(); }}>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-lg font-bold text-white">B</span>
          <span>
            <span className="block text-lg font-bold text-ink">Buen día</span>
            <span className="text-xs text-slate-500">Citas hechas con calma</span>
          </span>
        </a>
        <button
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
          onClick={() => { setError(''); setView(view === 'admin' ? 'booking' : 'admin'); }}
        >
          {view === 'admin' ? 'Volver a reservar' : 'Administración'}
        </button>
      </header>

      <section className="mx-auto max-w-5xl">
        {view === 'admin' ? (
          <Admin appointments={appointments} />
        ) : (
          <>
            <div className="mb-8 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand">Tu tiempo, bien cuidado</p>
              <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Agenda tu próxima cita</h1>
              <p className="mx-auto mt-3 max-w-lg text-slate-500">Elige el servicio y encuentra el momento ideal para ti.</p>
            </div>

            {step < 4 && <Progress step={step} />}
            <div className="mx-auto max-w-3xl rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-9">
              {error && <div role="alert" className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              {step === 0 && (
                <div>
                  <Heading eyebrow="Paso 1 de 4" title="¿Qué necesitas hoy?" />
                  {services.length ? (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {services.map((item) => (
                        <button key={item.id} onClick={() => chooseService(item)} className="choice-card text-left">
                          <span className="flex items-start justify-between gap-3">
                            <span className="text-lg font-semibold text-ink">{item.name}</span>
                            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                              ${(item.priceCents / 100).toFixed(2)}
                            </span>
                          </span>
                          <span className="mt-2 block text-sm leading-6 text-slate-500">{item.description}</span>
                          <span className="mt-4 block text-xs font-semibold text-slate-400">{item.durationMinutes} minutos</span>
                        </button>
                      ))}
                    </div>
                  ) : <p className="mt-6 text-sm text-slate-500">Cargando servicios o no hay servicios disponibles.</p>}
                </div>
              )}
              {step === 1 && (
                <div>
                  <Heading eyebrow="Paso 2 de 4" title="Elige a tu profesional" />
                  <p className="mt-2 text-sm text-slate-500">Servicio: {service?.name}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {professionals.map((item) => (
                      <button key={item.id} onClick={() => chooseProfessional(item)} className="choice-card text-left">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft font-bold text-brand">
                          {item.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                        </span>
                        <span className="mt-3 block font-semibold text-ink">{item.name}</span>
                        <span className="mt-1 block text-sm text-slate-500">Ver horarios disponibles</span>
                      </button>
                    ))}
                    {!professionals.length && <p className="text-sm text-slate-500">No hay profesionales para este servicio.</p>}
                  </div>
                  <BackButton onClick={() => setStep(0)} />
                </div>
              )}
              {step === 2 && (
                <div>
                  <Heading eyebrow="Paso 3 de 4" title="Escoge fecha y hora" />
                  <p className="mt-2 text-sm text-slate-500">{service?.name} · {professional?.name}</p>
                  <label className="mt-6 block text-sm font-semibold text-ink" htmlFor="booking-date">Fecha</label>
                  <input id="booking-date" className="field mt-2 max-w-xs" type="date" min={minDate} value={date}
                    onChange={(event) => setDate(event.target.value)} />
                  {loading ? <p className="mt-6 text-sm text-slate-500">Buscando horarios...</p> : (
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {slots.map((item) => (
                        <button key={item.id} onClick={() => setSlot(item)}
                          className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${slot?.id === item.id ? 'border-brand bg-brand text-white' : 'border-slate-200 text-ink hover:border-brand hover:text-brand'}`}>
                          {formatTime(item.startsAt)}
                        </button>
                      ))}
                      {!slots.length && <p className="col-span-full rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No hay horarios disponibles para esta fecha. Prueba otro día.</p>}
                    </div>
                  )}
                  <div className="mt-7 flex justify-between">
                    <BackButton onClick={() => setStep(1)} />
                    <button className="primary-button" disabled={!slot} onClick={() => setStep(3)}>Continuar</button>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <Heading eyebrow="Paso 4 de 4" title="Tus datos de contacto" />
                  <div className="my-5 rounded-xl bg-brand-soft p-4 text-sm text-brand-dark">
                    <strong>{service?.name}</strong> con {professional?.name}<br />
                    {new Date(slot.startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC
                  </div>
                  <form className="space-y-4" onSubmit={submitBooking}>
                    <label className="block text-sm font-semibold text-ink">Nombre completo
                      <input className="field mt-2" required minLength="2" autoComplete="name" value={customer.customerName}
                        onChange={(event) => setCustomer({ ...customer, customerName: event.target.value })} />
                    </label>
                    <label className="block text-sm font-semibold text-ink">Correo electrónico
                      <input className="field mt-2" required type="email" autoComplete="email" value={customer.customerEmail}
                        onChange={(event) => setCustomer({ ...customer, customerEmail: event.target.value })} />
                    </label>
                    <label className="block text-sm font-semibold text-ink">Teléfono <span className="font-normal text-slate-400">(opcional)</span>
                      <input className="field mt-2" type="tel" autoComplete="tel" value={customer.customerPhone}
                        onChange={(event) => setCustomer({ ...customer, customerPhone: event.target.value })} />
                    </label>
                    <div className="flex justify-between pt-2">
                      <BackButton onClick={() => setStep(2)} />
                      <button className="primary-button" disabled={loading}>{loading ? 'Confirmando...' : 'Confirmar reserva'}</button>
                    </div>
                  </form>
                </div>
              )}
              {step === 4 && confirmation && (
                <div className="py-6 text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-3xl text-brand">✓</span>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-brand">Reserva confirmada</p>
                  <h2 className="mt-2 text-2xl font-bold text-ink">¡Gracias, {confirmation.customerName}!</h2>
                  <p className="mt-3 text-slate-500">Te esperamos para {confirmation.serviceName} con {confirmation.professionalName}.</p>
                  <p className="mt-2 font-semibold text-ink">{new Date(confirmation.startsAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' })} UTC</p>
                  <p className="mt-4 text-sm text-slate-500">Enviamos los detalles a {confirmation.customerEmail}.</p>
                  <button className="primary-button mt-7" onClick={reset}>Reservar otra cita</button>
                </div>
              )}
            </div>
            <p className="mt-6 text-center text-xs text-slate-400">Tus datos se utilizan únicamente para gestionar esta reserva.</p>
          </>
        )}
      </section>
    </main>
  );
}

function Heading({ eyebrow, title }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-brand">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold text-ink">{title}</h2></div>;
}

function Progress({ step }) {
  return (
    <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between px-1">
      {steps.map((label, index) => (
        <div key={label} className="flex flex-1 items-center last:flex-none">
          <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${step >= index ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'}`}>
              {index + 1}
            </span>
            <span className={`hidden text-xs font-medium sm:block ${step >= index ? 'text-ink' : 'text-slate-400'}`}>{label}</span>
          </div>
          {index < steps.length - 1 && <span className={`mx-2 h-px flex-1 ${step > index ? 'bg-brand' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );
}

function BackButton({ onClick }) {
  return <button type="button" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50" onClick={onClick}>← Atrás</button>;
}

function Admin({ appointments }) {
  const today = new Date().toLocaleDateString([], { dateStyle: 'full', timeZone: 'UTC' });
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Administración</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">Agenda de hoy</h1>
      <p className="mt-2 text-slate-500">{today}</p>
      <div className="mt-7 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card">
        {appointments.length ? appointments.map((item) => (
          <article key={item.id} className="flex flex-col gap-3 border-b border-slate-100 p-5 last:border-0 sm:flex-row sm:items-center">
            <div className="min-w-24 text-lg font-bold text-brand">{formatTime(item.startsAt)}</div>
            <div className="flex-1">
              <h2 className="font-semibold text-ink">{item.customerName} <span className="font-normal text-slate-500">· {item.serviceName}</span></h2>
              <p className="mt-1 text-sm text-slate-500">{item.customerEmail}{item.customerPhone && ` · ${item.customerPhone}`}</p>
            </div>
            <span className="text-sm text-slate-500">{item.professionalName}</span>
          </article>
        )) : <p className="p-8 text-center text-sm text-slate-500">No hay citas confirmadas para hoy.</p>}
      </div>
    </div>
  );
}

export default App;
