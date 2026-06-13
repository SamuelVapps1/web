'use client';

import { useActionState, useState } from 'react';
import styles from '../../../admin.module.css';
import { createManualReservation, type AdminActionState } from '@/app/admin/actions';
import {
  AddonsStep,
  CustomerStep,
  DogStep,
  TimingStep,
  SubmitPanel,
  type ManualReservationAvailabilityReservation,
  type ManualReservationCustomer,
  type ManualReservationState,
} from './manual-reservation-panels';
import { getBratislavaDateKey, isWeekendDateKey, localDateTimeToUtc, shiftDateKey } from '@/lib/time';

const initialState: AdminActionState = { kind: 'idle' };

type ManualReservationFormProps = {
  customers: ManualReservationCustomer[];
  availabilityReservations: ManualReservationAvailabilityReservation[];
  initialDate?: string;
  initialTime?: string;
};

function getInitialDate(initialDate?: string): string {
  const todayKey = getBratislavaDateKey();
  if (!initialDate) {
    let nextDate = todayKey;
    while (isWeekendDateKey(nextDate)) {
      nextDate = shiftDateKey(nextDate, 1);
    }
    return nextDate;
  }

  const candidate = initialDate >= todayKey ? initialDate : todayKey;
  let nextDate = candidate;
  while (isWeekendDateKey(nextDate)) {
    nextDate = shiftDateKey(nextDate, 1);
  }
  return nextDate;
}

function createBlankCustomerDraft(): ManualReservationState['customerDraft'] {
  return { name: '', phone: '', email: '', note: '' };
}

function createBlankDogDraft(): ManualReservationState['dogDraft'] {
  return {
    name: '',
    breed: '',
    size: 'MEDIUM',
    note: '',
    temperamentNote: '',
    coatType: '',
    healthNote: '',
    groomingNotes: '',
  };
}

function createInitialReservationDraft(initialDate?: string, initialTime?: string): ManualReservationState['reservationDraft'] {
  return {
    date: getInitialDate(initialDate),
    time: initialTime ?? '10:00',
    durationMin: 90,
    internalNote: '',
    cutType: 'ADVICE',
    serviceIds: [] as string[],
  };
}

export default function ManualReservationForm({
  customers,
  availabilityReservations,
  initialDate,
  initialTime,
}: ManualReservationFormProps) {
  const [state, action, pending] = useActionState(createManualReservation, initialState);
  const [customerMode, setCustomerMode] = useState<'select' | 'new'>('select');
  const [dogMode, setDogMode] = useState<'existing' | 'new'>('new');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedDogId, setSelectedDogId] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  const [customerDraft, setCustomerDraft] = useState(createBlankCustomerDraft);
  const [dogDraft, setDogDraft] = useState(createBlankDogDraft);
  const [reservationDraft, setReservationDraft] = useState(() => createInitialReservationDraft(initialDate, initialTime));
  const [availabilityCursor, setAvailabilityCursor] = useState(() =>
    localDateTimeToUtc(getInitialDate(initialDate), initialTime ?? '10:00'),
  );

  const stateAction = {
    setCustomerMode,
    setSelectedCustomerId,
    setSelectedDogId,
    setCustomerQuery,
    setShowAllCustomers,
    setCustomerDraft,
    setDogMode,
    setDogDraft,
    setReservationDraft,
    setAvailabilityCursor,
  };

  return (
    <form action={action} className={styles.manualForm}>
      <CustomerStep customers={customers} state={{
        customerMode,
        dogMode,
        selectedCustomerId,
        selectedDogId,
        customerQuery,
        showAllCustomers,
        customerDraft,
        dogDraft,
        reservationDraft,
        availabilityCursor,
      }} stateAction={stateAction} />

      <DogStep
        customers={customers}
        state={{
          customerMode,
          dogMode,
          selectedCustomerId,
          selectedDogId,
          customerQuery,
          showAllCustomers,
          customerDraft,
          dogDraft,
          reservationDraft,
          availabilityCursor,
        }}
        stateAction={{ setDogMode, setSelectedDogId, setDogDraft }}
      />

      <TimingStep
        availabilityReservations={availabilityReservations}
        state={{
          customerMode,
          dogMode,
          selectedCustomerId,
          selectedDogId,
          customerQuery,
          showAllCustomers,
          customerDraft,
          dogDraft,
          reservationDraft,
          availabilityCursor,
        }}
        stateAction={{ setReservationDraft, setAvailabilityCursor }}
      />

      <AddonsStep
        state={{
          customerMode,
          dogMode,
          selectedCustomerId,
          selectedDogId,
          customerQuery,
          showAllCustomers,
          customerDraft,
          dogDraft,
          reservationDraft,
          availabilityCursor,
        }}
        stateAction={{ setReservationDraft }}
      />

      <SubmitPanel
        state={state}
        pending={pending}
        customerMode={customerMode}
        dogMode={dogMode}
        selectedCustomerId={selectedCustomerId}
        selectedDogId={selectedDogId}
        customerDraft={customerDraft}
        dogDraft={dogDraft}
        reservationDraft={reservationDraft}
      />
    </form>
  );
}
